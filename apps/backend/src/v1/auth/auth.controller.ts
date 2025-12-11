import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Body,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { V1AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendOtpDto, VerifyOtpDto, ResendOtpDto } from './dto/phone-auth.dto';
import { UAParser } from 'ua-parser-js';
import { createHash } from 'crypto';
import { Public } from '../../common/decorators/common';
import { GoogleOAuthGuard, RefreshTokenGuard } from '../../common/guards/auth';
import { GetCurrentUserId } from '../../common/decorators/user';

/**
 * Authentication Controller (API v1)
 *
 * Supported Authentication Methods:
 * 1. PRIMARY: WhatsApp/SMS OTP (Passwordless) - Recommended for Indian users
 * 2. SECONDARY: Email/Password - Traditional login
 * 3. TERTIARY: Google OAuth - Social login
 *
 * All endpoints are public unless marked with @ApiBearerAuth
 */
@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
export class V1AuthController {
  constructor(private readonly authService: V1AuthService) {}

  // ============================================
  // PHONE OTP AUTHENTICATION (PRIMARY)
  // WhatsApp/SMS based passwordless authentication
  // Cost: ~₹0.12 per message (Gupshup WhatsApp)
  // ============================================

  @Public()
  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[PRIMARY] Send OTP to phone number',
    description:
      'Sends 6-digit OTP via WhatsApp (primary) or SMS (fallback). ' +
      'OTP expires in 10 minutes. Rate limited to 2 requests per minute.',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully. Returns expiry time and resend cooldown.',
  })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded. Too many OTP requests.' })
  @ApiResponse({ status: 400, description: 'Invalid phone number format.' })
  async sendOtp(@Body() dto: SendOtpDto, @Req() req: Request) {
    const deviceName = dto.deviceName || this.extractDeviceName(req);
    return this.authService.sendOtp(dto.phoneNumber, dto.countryCode, deviceName);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[PRIMARY] Verify OTP and authenticate',
    description:
      'Verifies the 6-digit OTP. ' +
      'If user exists: logs in and returns tokens. ' +
      'If new user: auto-registers and returns tokens (passwordless registration). ' +
      'Maximum 3 verification attempts per OTP.',
  })
  @ApiResponse({
    status: 200,
    description:
      'OTP verified successfully. Returns JWT access token, refresh token, and user profile.',
  })
  @ApiResponse({ status: 401, description: 'Invalid OTP or expired OTP.' })
  @ApiResponse({ status: 403, description: 'Maximum verification attempts exceeded.' })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request, @Ip() ipAddress: string) {
    const deviceInfo = {
      deviceId: this.generateDeviceId(req),
      deviceName: dto.deviceName,
      ipAddress,
      userAgent: req.headers['user-agent'],
    };

    return this.authService.verifyOtp(dto.phoneNumber, dto.countryCode, dto.otpCode, deviceInfo);
  }

  @Public()
  @Post('otp/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend OTP',
    description:
      'Resends the same OTP code. ' +
      'Rate limited: 60 seconds cooldown between resends. ' +
      'Maximum 3 resends per OTP session.',
  })
  @ApiResponse({ status: 200, description: 'OTP resent successfully.' })
  @ApiResponse({ status: 404, description: 'No pending OTP found. Please request a new OTP.' })
  @ApiResponse({
    status: 429,
    description: 'Resend cooldown active or maximum resend limit reached.',
  })
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.phoneNumber, dto.countryCode);
  }

  // ============================================
  // EMAIL/PASSWORD AUTHENTICATION (SECONDARY)
  // Traditional email/password based authentication
  // Requires email verification before login
  // ============================================

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '[SECONDARY] Register with email/password',
    description:
      'Creates new user account with email and password. ' +
      'Email verification required before login. ' +
      'Password must contain: uppercase, lowercase, number, special character.',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully. Verification email sent.',
  })
  @ApiResponse({ status: 409, description: 'Email already registered.' })
  @ApiResponse({ status: 400, description: 'Invalid email or weak password.' })
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Ip() ipAddress: string) {
    const deviceInfo = {
      deviceId: this.generateDeviceId(req),
      deviceName: dto.deviceName || this.extractDeviceName(req),
      ipAddress,
      userAgent: req.headers['user-agent'],
    };

    return this.authService.register(dto.email, dto.name, dto.password, deviceInfo);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address',
    description: 'Verifies email using token sent to user email. Token expires in 24 hours.',
  })
  @ApiResponse({ status: 200, description: 'Email verified successfully. User can now login.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired verification token.' })
  async verifyEmail(@Body() dto: { token: string }) {
    return this.authService.verifyEmail(dto.token);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[SECONDARY] Login with email/password',
    description: 'Authenticates user with email and password. Email must be verified.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns JWT tokens and user profile.',
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password.' })
  @ApiResponse({ status: 403, description: 'Email not verified. Please verify your email first.' })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Ip() ipAddress: string) {
    const deviceInfo = {
      deviceId: this.generateDeviceId(req),
      deviceName: this.extractDeviceName(req),
      ipAddress,
      userAgent: req.headers['user-agent'],
    };

    return this.authService.login(dto.email, dto.password, deviceInfo);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Sends password reset link to email if account exists. ' +
      'For security, always returns success even if email not found.',
  })
  @ApiResponse({
    status: 200,
    description: 'If email exists, password reset link has been sent. Check your email.',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with token',
    description:
      'Resets password using token from email. ' +
      'Token expires in 1 hour. ' +
      'Logs out user from all devices for security.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully. Please login with new password.',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token.' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend email verification link',
    description: 'Resends verification email. Rate limited to 1 request per minute.',
  })
  @ApiResponse({
    status: 200,
    description: 'If user exists and unverified, verification email sent.',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded. Please wait before requesting again.',
  })
  async resendVerification(@Body() dto: { email: string }) {
    return this.authService.resendVerificationEmail(dto.email);
  }

  // ============================================
  // GOOGLE OAUTH (TERTIARY)
  // Social authentication via Google
  // One-click sign-in/sign-up
  // ============================================

  @Public()
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({
    summary: '[TERTIARY] Initiate Google OAuth',
    description: 'Redirects user to Google consent screen for authentication.',
  })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth consent screen.' })
  async googleAuth() {
    // OAuth flow is handled by GoogleOAuthGuard
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth callback',
    description:
      'OAuth callback endpoint. ' +
      'If email exists: links Google account and logs in. ' +
      'If new user: auto-registers and logs in.',
  })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with authentication tokens.' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response, @Ip() ipAddress: string) {
    const googleUser = req.user as any;

    if (!googleUser) {
      const frontendUrl = this.authService['configService'].get('FRONTEND_URL');
      return res.redirect(`${frontendUrl}/auth/error?message=Authentication failed`);
    }

    const deviceInfo = {
      deviceId: this.generateDeviceId(req),
      deviceName: this.extractDeviceName(req),
      ipAddress,
      userAgent: req.headers['user-agent'],
    };

    const authResponse = await this.authService.googleLogin(googleUser, deviceInfo);

    const frontendUrl = this.authService['configService'].get('FRONTEND_URL');
    const params = new URLSearchParams({
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
      userId: authResponse.user.id,
      deviceId: authResponse.deviceId,
    });

    res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
  }

  // ============================================
  // TOKEN MANAGEMENT
  // Refresh tokens, logout, and session management
  // ============================================

  @Public()
  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Generates new access token using refresh token. ' +
      'Requires valid refresh token in Authorization header and deviceId in body.',
  })
  @ApiResponse({ status: 200, description: 'New access and refresh tokens generated.' })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token, or device mismatch.',
  })
  async refreshTokens(@Req() req: any, @Body() body: { deviceId: string }) {
    return this.authService.refreshTokens(req.user.refreshToken, body.deviceId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout from current device',
    description: 'Revokes refresh token for current device. User stays logged in on other devices.',
  })
  @ApiResponse({ status: 200, description: 'Logged out successfully from current device.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing access token.' })
  async logout(@GetCurrentUserId() userId: string, @Req() req: Request) {
    const deviceId = (req.headers['x-device-id'] as string) || this.generateDeviceId(req);
    return this.authService.logout(userId, deviceId);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout from all devices',
    description: 'Revokes all refresh tokens for user. Logs out from all devices simultaneously.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out from all devices. Returns count of devices logged out.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing access token.' })
  async logoutAll(@GetCurrentUserId() userId: string) {
    return this.authService.logoutAllDevices(userId);
  }

  // ============================================
  // USER INFO & STATUS
  // Authenticated endpoints for user information
  // ============================================

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current authenticated user',
    description: 'Returns basic information about the currently authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'Returns user ID and profile information.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing access token.' })
  async getCurrentUser(@GetCurrentUserId() userId: string) {
    return { userId };
  }

  @Get('email-verified-status')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check email verification status',
    description: 'Returns whether the user has verified their email address.',
  })
  @ApiResponse({ status: 200, description: 'Returns email verification status (boolean).' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing access token.' })
  async checkEmailVerified(@GetCurrentUserId() userId: string) {
    return this.authService.checkEmailVerifiedStatus(userId);
  }

  // ============================================
  // HELPER METHODS
  // Private utility methods for device identification
  // ============================================

  /**
   * Extracts device name from User-Agent string
   * Format: "OS – Browser" (e.g., "Windows – Chrome")
   */
  private extractDeviceName(req: Request): string {
    const uaString = req.headers['user-agent'] || '';
    const parser = new UAParser(uaString);
    const os = parser.getOS().name || 'Unknown OS';
    const browser = parser.getBrowser().name || 'Unknown Browser';
    return `${os} – ${browser}`;
  }

  /**
   * Generates unique device ID
   * Priority: 1) x-device-id header, 2) hash(user-agent + IP)
   * Used for multi-device session management
   */
  private generateDeviceId(req: Request): string {
    // Check header first (preferred method)
    const headerDeviceId = req.headers['x-device-id'] as string;
    if (headerDeviceId) return headerDeviceId;

    // Fallback: Generate from user-agent + IP
    const ua = req.headers['user-agent'] || '';
    const ip = req.ip || '';
    return createHash('sha256').update(`${ua}${ip}`).digest('hex').substring(0, 32);
  }
}
