import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { CountryCode, OtpPurpose, UserRole } from '@mimicare/schema';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import {
  AuthResponse,
  AuthTokens,
  DeviceInfo,
  GoogleUserData,
  JwtPayload,
  StatefulJwtPayload,
} from './types';

@Injectable()
export class V1AuthService {
  private readonly logger = new Logger(V1AuthService.name);
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly OTP_RESEND_COOLDOWN_SECONDS = 60;
  private readonly MAX_RESEND_COUNT = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {} // ============================================
  // PHONE OTP AUTHENTICATION (PRIMARY METHOD)
  // WhatsApp/SMS OTP - Primary authentication for Indian market
  // Cost: ~₹0.12-0.18 per message
  // ============================================
  /**
   * Send OTP to phone number via WhatsApp/SMS
   * Supports both WhatsApp and SMS fallback
   */

  async sendOtp(
    phoneNumber: string,
    countryCode: CountryCode = CountryCode.IN,
    deviceName?: string,
  ): Promise<{ message: string; expiresIn: number; canResendAt: Date }> {
    // Normalize phone number
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber, countryCode); // Check rate limiting

    await this.checkOtpRateLimit(normalizedPhone, countryCode); // Generate 6-digit OTP

    const otpCode = this.generateOtp();
    const otpHash = await bcrypt.hash(otpCode, 10); // Calculate expiry

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    const canResendAt = new Date();
    canResendAt.setSeconds(canResendAt.getSeconds() + this.OTP_RESEND_COOLDOWN_SECONDS); // Find or create user

    let user = await this.prisma.user.findUnique({
      where: {
        unique_phone_per_country: {
          countryCode,
          phoneNumber: normalizedPhone,
        },
      },
    }); // Invalidate previous OTPs

    await this.prisma.otpVerification.updateMany({
      where: {
        phoneNumber: normalizedPhone,
        countryCode,
        purpose: OtpPurpose.LOGIN,
        isVerified: false,
      },
      data: { expiresAt: new Date() }, // Expire immediately
    }); // Store OTP

    await this.prisma.otpVerification.create({
      data: {
        userId: user?.id,
        phoneNumber: normalizedPhone,
        countryCode,
        otpCode: otpCode, // Store plain for SMS provider
        otpHash,
        purpose: user ? OtpPurpose.LOGIN : OtpPurpose.REGISTRATION,
        expiresAt,
        lastResentAt: new Date(),
      },
    }); // Send OTP via WhatsApp (primary) or SMS (fallback)

    await this.sendOtpViaSms(normalizedPhone, countryCode, otpCode);

    this.logger.log(`OTP sent to ${countryCode}${normalizedPhone} (Device: ${deviceName})`); // FOR DEVELOPMENT ONLY - Remove in production

    if (process.env.NODE_ENV === 'development') {
      this.logger.warn(`🔐 OTP Code: ${otpCode}`);
    }

    return {
      message: 'OTP sent successfully',
      expiresIn: this.OTP_EXPIRY_MINUTES * 60,
      canResendAt,
    };
  } /**
   * Verify OTP and login/register user
   * Auto-registers new users (passwordless registration)
   */

  async verifyOtp(
    phoneNumber: string,
    countryCode: CountryCode,
    otpCode: string,
    deviceInfo: DeviceInfo,
  ): Promise<AuthResponse> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber, countryCode); // Find latest valid OTP

    const otpRecord = await this.prisma.otpVerification.findFirst({
      where: {
        phoneNumber: normalizedPhone,
        countryCode,
        purpose: { in: [OtpPurpose.LOGIN, OtpPurpose.REGISTRATION] },
        isVerified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('OTP expired or invalid');
    } // Check attempts

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      throw new ForbiddenException('Maximum OTP verification attempts exceeded. Request new OTP.');
    } // Verify OTP

    const isValid = await bcrypt.compare(otpCode, otpRecord.otpHash); // Increment attempts

    await this.prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });

    if (!isValid) {
      const remainingAttempts = otpRecord.maxAttempts - (otpRecord.attempts + 1);
      throw new UnauthorizedException(`Invalid OTP. ${remainingAttempts} attempt(s) remaining.`);
    } // Mark OTP as verified

    await this.prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    }); // Find or create user

    let user = await this.prisma.user.findUnique({
      where: {
        unique_phone_per_country: {
          countryCode,
          phoneNumber: normalizedPhone,
        },
      },
    });

    if (!user) {
      // Register new user
      user = await this.prisma.user.create({
        data: {
          phoneNumber: normalizedPhone,
          countryCode,
          isPhoneVerified: true,
          role: UserRole.PATIENT,
          isVerified: true,
          lastLoginAt: new Date(),
          settings: {
            create: {},
          },
        },
      });

      this.logger.log(`New user registered via OTP: ${user.id}`);
    } else {
      // Update existing user
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isPhoneVerified: true,
          lastLoginAt: new Date(),
        },
      });
    } // Log activity

    await this.logUserActivity(user.id, 'LOGIN', { method: 'PHONE_OTP', deviceInfo }); // Generate tokens

    return this.generateAuthResponse(user, deviceInfo);
  } /**
   * Resend OTP with rate limiting
   */

  async resendOtp(
    phoneNumber: string,
    countryCode: CountryCode,
  ): Promise<{ message: string; canResendAt: Date }> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber, countryCode); // Find latest OTP

    const latestOtp = await this.prisma.otpVerification.findFirst({
      where: {
        phoneNumber: normalizedPhone,
        countryCode,
        isVerified: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestOtp) {
      throw new NotFoundException('No pending OTP found. Please request a new OTP.');
    } // Check resend cooldown

    if (latestOtp.lastResentAt) {
      const cooldownEnds = new Date(latestOtp.lastResentAt);
      cooldownEnds.setSeconds(cooldownEnds.getSeconds() + this.OTP_RESEND_COOLDOWN_SECONDS);

      if (new Date() < cooldownEnds) {
        throw new BadRequestException(
          `Please wait ${Math.ceil((cooldownEnds.getTime() - Date.now()) / 1000)} seconds before resending`,
        );
      }
    } // Check max resend count

    if (latestOtp.resentCount >= this.MAX_RESEND_COUNT) {
      throw new ForbiddenException(
        'Maximum resend limit reached. Please request a new OTP after 10 minutes.',
      );
    } // Update resend count

    await this.prisma.otpVerification.update({
      where: { id: latestOtp.id },
      data: {
        resentCount: { increment: 1 },
        lastResentAt: new Date(),
      },
    }); // Resend OTP

    await this.sendOtpViaSms(normalizedPhone, countryCode, latestOtp.otpCode);

    const canResendAt = new Date();
    canResendAt.setSeconds(canResendAt.getSeconds() + this.OTP_RESEND_COOLDOWN_SECONDS);

    return {
      message: 'OTP resent successfully',
      canResendAt,
    };
  } // ============================================
  // EMAIL/PASSWORD OR PHONE/PASSWORD AUTHENTICATION (SECONDARY)
  // For users who prefer traditional login
  // ============================================

  async register(
    email: string,
    name: string,
    password: string,
    _deviceInfo: DeviceInfo,
  ): Promise<{ message: string; userId: string }> {
    // Check if email exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    } // Hash password

    const passwordHash = await bcrypt.hash(password, 12); // Create user

    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        role: UserRole.PATIENT,
        isVerified: false, // Changed to false to require email verification
        settings: {
          create: {},
        },
      },
    }); // Generate verification token

    const verificationToken = this.generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        email: user.email!,
        token: verificationToken,
        expiresAt,
      },
    }); // Send verification email

    await this.sendVerificationEmail(user.email!, verificationToken);

    this.logger.log(`User registered: ${user.id} (${email})`);

    return {
      message: 'Registration successful. Please verify your email.',
      userId: user.id,
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const verificationRecord = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!verificationRecord || verificationRecord.usedAt) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (new Date() > verificationRecord.expiresAt) {
      throw new BadRequestException('Verification token expired');
    } // Update user

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verificationRecord.userId },
        data: { isVerified: true },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: verificationRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Email verified successfully' };
  }

  async login(email: string, password: string, deviceInfo: DeviceInfo): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    } // Verify password

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    } // Check if email is verified

    if (!user.isVerified) {
      throw new ForbiddenException('Please verify your email before logging in');
    } // Update last login

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }); // Log activity

    await this.logUserActivity(user.id, 'LOGIN', { method: 'EMAIL_PASSWORD', deviceInfo });

    return this.generateAuthResponse(user, deviceInfo);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    }); // Don't reveal if email exists (security best practice)

    if (!user) {
      return { message: 'If email exists, password reset link has been sent' };
    } // Invalidate previous reset tokens

    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }); // Generate reset token

    const resetToken = this.generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    }); // Send password reset email

    await this.sendPasswordResetEmail(user.email!, resetToken);

    return { message: 'If email exists, password reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetRecord || resetRecord.usedAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (new Date() > resetRecord.expiresAt) {
      throw new BadRequestException('Reset token expired');
    } // Hash new password

    const passwordHash = await bcrypt.hash(newPassword, 12); // Update password and mark token as used

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }), // Revoke all refresh tokens by setting isRevoked: true.
      // This ensures immediate logout across all devices via the stateful AccessTokenStrategy.
      this.prisma.refreshToken.updateMany({
        where: { userId: resetRecord.userId },
        data: { isRevoked: true },
      }),
    ]);

    return { message: 'Password reset successfully. Please login with new password.' };
  } // ============================================
  // GOOGLE OAUTH (TERTIARY)
  // One-click social login
  // ============================================

  async googleLogin(googleUser: any, deviceInfo: DeviceInfo): Promise<AuthResponse> {
    let user = await this.prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
    });

    if (!user) {
      // Check if email already exists
      user = await this.prisma.user.findUnique({
        where: { email: googleUser.email.toLowerCase() },
      });

      if (user) {
        // Link Google account to existing user
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.googleId,
            profilePictureUrl: googleUser.picture || user.profilePictureUrl,
            isVerified: true,
            lastLoginAt: new Date(),
          },
        });
      } else {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email: googleUser.email.toLowerCase(),
            name: `${googleUser.firstName} ${googleUser.lastName}`.trim(),
            googleId: googleUser.googleId,
            profilePictureUrl: googleUser.picture,
            role: UserRole.PATIENT,
            isVerified: true,
            lastLoginAt: new Date(),
            settings: {
              create: {},
            },
          },
        });

        this.logger.log(`New user registered via Google: ${user.id}`);
      }
    } else {
      // Update existing Google user
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          profilePictureUrl: googleUser.picture || user.profilePictureUrl,
        },
      });
    }

    await this.logUserActivity(user.id, 'LOGIN', { method: 'GOOGLE_OAUTH', deviceInfo });

    return this.generateAuthResponse(user, deviceInfo);
  } // ============================================
  // TOKEN MANAGEMENT
  // ============================================

  async refreshTokens(refreshToken: string, deviceId: string): Promise<AuthTokens> {
    // 1. Find and validate refresh token
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.isRevoked) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (tokenRecord.deviceId !== deviceId) {
      this.logger.warn(
        `Refresh token device ID mismatch for user ${tokenRecord.userId}. Attempted deviceId: ${deviceId}, Original deviceId: ${tokenRecord.deviceId}`,
      );
      throw new UnauthorizedException(
        'Device mismatch or token theft attempt. Please log in again.',
      );
    } // 2. Generate new tokens (Access token will contain a temporary ID initially)

    const tokensWithTempId = await this.generateTokens(tokenRecord.user, deviceId);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    // 3. Use a transaction to revoke old, create new, and update the Access Token with the final session ID.

    try {
      const newRecord = await this.prisma.$transaction(async (tx) => {
        // Revoke old refresh token (set isRevoked to true)
        await tx.refreshToken.update({
          where: { id: tokenRecord.id },
          data: { isRevoked: true, lastUsedAt: new Date() },
        }); // Store the NEW refresh token (gets a new database ID)

        return tx.refreshToken.create({
          data: {
            userId: tokenRecord.user.id,
            token: tokensWithTempId.refreshToken,
            deviceId: deviceId,
            deviceName: tokenRecord.deviceName,
            ipAddress: tokenRecord.ipAddress,
            userAgent: tokenRecord.userAgent,
            expiresAt,
          },
        });
      });

      // 4. Re-sign the Access Token with the new session ID
      const finalTokens = await this.generateTokens(
        tokenRecord.user,
        deviceId,
        newRecord.id, // Use the new RefreshToken record ID as sessionId
      ); // 5. Log activity

      await this.logUserActivity(tokenRecord.user.id, 'LOGIN', {
        action: 'REFRESH_TOKEN',
        deviceId,
      }); // 6. Return the final tokens

      return finalTokens;
    } catch (e: any) {
      if (e.code === 'P2002') {
        this.logger.error(
          `P2002 Unique Constraint Failed during token refresh for user ${tokenRecord.userId}. Old Token ID: ${tokenRecord.id}.`,
          e.stack,
        );
      }
      throw new UnauthorizedException(
        'Token refresh failed due to a server error. Please log in again.',
      );
    }
  }

  async logout(userId: string, deviceId: string): Promise<{ message: string }> {
    const result = await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        deviceId,
        isRevoked: false,
      },
      data: { isRevoked: true },
    });

    this.logger.log(
      `User ${userId} logged out from device ${deviceId}. Sessions revoked: ${result.count}`,
    );

    await this.logUserActivity(userId, 'LOGIN', {
      action: 'LOGOUT',
      deviceId,
      revokedCount: result.count,
    });

    return { message: 'Logged out successfully' };
  }

  async logoutAllDevices(userId: string): Promise<{ message: string; devicesLoggedOut: number }> {
    const result = await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: { isRevoked: true },
    });

    this.logger.log(
      `User ${userId} logged out from ALL devices. Total sessions revoked: ${result.count}`,
    );

    await this.logUserActivity(userId, 'LOGIN', {
      action: 'LOGOUT_ALL_DEVICES',
      revokedCount: result.count,
    });

    return {
      message: 'Logged out from all devices',
      devicesLoggedOut: result.count,
    };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || user.isVerified) {
      return { message: 'If user exists and unverified, email sent' };
    } // Check rate limit

    const recentToken = await this.prisma.emailVerificationToken.findFirst({
      where: {
        userId: user.id,
        createdAt: { gt: new Date(Date.now() - 60000) }, // Last 1 minute
      },
    });

    if (recentToken) {
      throw new BadRequestException('Please wait before requesting another verification email');
    } // Generate new token

    const verificationToken = this.generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        email: user.email!,
        token: verificationToken,
        expiresAt,
      },
    });

    await this.sendVerificationEmail(user.email!, verificationToken);

    return { message: 'Verification email sent' };
  }

  async checkEmailVerifiedStatus(userId: string): Promise<{ isVerified: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isVerified: true },
    });

    return { isVerified: user?.isVerified || false };
  } // ============================================
  // HELPER METHODS
  // ============================================

  private generateJti(): string {
    // Generate a secure, URL-safe random string for JTI (JWT ID)
    return randomBytes(16).toString('base64url');
  }

  private async generateAuthResponse(user: any, deviceInfo: DeviceInfo): Promise<AuthResponse> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    // 1. Generate tokens with a temporary ID for the Access Token

    const tokensWithTempId = await this.generateTokens(user, deviceInfo.deviceId); // 2. Store the new session (RefreshToken) first to get its unique database ID (CUID)

    const tokenRecord = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokensWithTempId.refreshToken,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        expiresAt,
      },
    }); // 3. Re-sign the Access Token with the correct database ID (tokenRecord.id)

    const finalTokens = await this.generateTokens(
      user,
      deviceInfo.deviceId,
      tokenRecord.id, // Pass the DB ID to embed in the Access Token
    );

    return {
      ...finalTokens, // Use the final tokens with the embedded sessionId
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        countryCode: user.countryCode,
        role: user.role,
        isVerified: user.isVerified,
        profilePictureUrl: user.profilePictureUrl,
      },
      deviceId: deviceInfo.deviceId,
      expiresIn: 15 * 60, // 15 minutes
    };
  }

  private async generateTokens(
    user: any,
    deviceId: string,
    refreshTokenId?: string,
  ): Promise<AuthTokens> {
    // Base payload for both tokens
    const basePayload: JwtPayload = {
      userId: user.id,
      role: user.role,
    };

    const jti = this.generateJti(); // Access Token Payload: MUST contain sessionId (the DB ID) for stateful check

    const accessTokenPayload: StatefulJwtPayload = {
      ...basePayload,
      // Use the actual DB ID if provided (after persistence), otherwise use the random JTI (during initial persistence)
      sessionId: refreshTokenId || jti,
    }; // Refresh Token Payload: MUST contain JTI for collision prevention

    const refreshPayload = {
      ...basePayload,
      deviceId,
      jti: jti,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION') || '15m',
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION') || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  private normalizePhoneNumber(phoneNumber: string, countryCode: CountryCode): string {
    // Remove all non-digit characters
    let normalized = phoneNumber.replace(/\D/g, ''); // Remove country code prefix if present

    const prefixes: Record<CountryCode, string> = {
      [CountryCode.IN]: '91',
      [CountryCode.US]: '1',
      [CountryCode.GB]: '44',
    };

    const prefix = prefixes[countryCode];
    if (normalized.startsWith(prefix)) {
      normalized = normalized.slice(prefix.length);
    }

    return normalized;
  }

  private async checkOtpRateLimit(phoneNumber: string, countryCode: CountryCode): Promise<void> {
    const oneMinuteAgo = new Date(Date.now() - 60000);

    const recentOtps = await this.prisma.otpVerification.count({
      where: {
        phoneNumber,
        countryCode,
        createdAt: { gt: oneMinuteAgo },
      },
    });

    if (recentOtps >= 2) {
      throw new BadRequestException('Too many OTP requests. Please try again later.');
    }
  }

  private async logUserActivity(userId: string, activityType: string, details: any): Promise<void> {
    try {
      // This should be offloaded to DynamoDB for production as per schema comments
      await this.prisma.userActivityLog.create({
        data: {
          userId,
          activityType: activityType as any,
          details,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log user activity', error);
    }
  } // ============================================
  // EXTERNAL SERVICE INTEGRATIONS
  // ============================================
  /**
   * Send OTP via WhatsApp (primary) or SMS (fallback)
   * Providers: Gupshup WhatsApp (~₹0.12), MSG91 SMS (~₹0.14-0.19)
   */

  private async sendOtpViaSms(
    phoneNumber: string,
    countryCode: CountryCode,
    otpCode: string,
  ): Promise<void> {
    const message = `Your Mimicare OTP is: ${otpCode}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes. Do not share with anyone.`;

    this.logger.log(
      `[SMS/WhatsApp Service] Would send to +${countryCode}${phoneNumber}: ${message}`,
    ); // TODO: Implement WhatsApp Business API as primary
    // TODO: Implement SMS (MSG91) as fallback
  }

  private async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;

    this.logger.log(`[Email Service] Verification email to ${email}: ${verificationUrl}`); // TODO: Integrate with AWS SES
  }

  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

    this.logger.log(`[Email Service] Password reset email to ${email}: ${resetUrl}`); // TODO: Integrate with AWS SES
  } /**
   * Validate Google user for Passport strategy
   * Called by GoogleStrategy during OAuth flow
   */

  async validateGoogleUser(googleData: GoogleUserData): Promise<any> {
    return {
      email: googleData.email,
      firstName: googleData.firstName,
      lastName: googleData.lastName,
      googleId: googleData.googleId,
      picture: googleData.picture,
    };
  }
}
