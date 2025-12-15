import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { V1AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CountryCode, UserRole, OtpPurpose } from '@mimicare/schema';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('V1AuthService', () => {
  let service: V1AuthService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user_123',
    email: 'test@example.com',
    name: 'Test User',
    phoneNumber: '9876543210',
    countryCode: CountryCode.IN,
    passwordHash: 'hashed_password',
    role: UserRole.PATIENT,
    isVerified: true,
    isPhoneVerified: true,
    googleId: null,
    profilePictureUrl: null,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockDeviceInfo = {
    deviceId: 'device_123',
    deviceName: 'Test Device',
    ipAddress: '127.0.0.1',
    userAgent: 'Jest Test Agent',
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    otpVerification: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    emailVerificationToken: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    userActivityLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_ACCESS_TOKEN_SECRET: 'test-access-secret',
        JWT_REFRESH_TOKEN_SECRET: 'test-refresh-secret',
        JWT_ACCESS_TOKEN_EXPIRATION: '15m',
        JWT_REFRESH_TOKEN_EXPIRATION: '7d',
        FRONTEND_URL: 'http://localhost:5173',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        V1AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<V1AuthService>(V1AuthService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==========================================
  // PHONE OTP AUTHENTICATION TESTS
  // ==========================================

  describe('sendOtp', () => {
    it('should send OTP to new phone number', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.otpVerification.count.mockResolvedValue(0);
      mockPrismaService.otpVerification.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.otpVerification.create.mockResolvedValue({
        id: 'otp_123',
        otpCode: '123456',
      });

      const result = await service.sendOtp('9876543210', CountryCode.IN, 'Test Device');

      expect(result.message).toBe('OTP sent successfully');
      expect(result.expiresIn).toBe(600); // 10 minutes
      expect(prisma.otpVerification.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for rate limit exceeded', async () => {
      mockPrismaService.otpVerification.count.mockResolvedValue(3);

      await expect(service.sendOtp('9876543210', CountryCode.IN)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should invalidate previous OTPs before creating new one', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.otpVerification.count.mockResolvedValue(0);
      mockPrismaService.otpVerification.updateMany.mockResolvedValue({ count: 2 });
      mockPrismaService.otpVerification.create.mockResolvedValue({ id: 'otp_123' });

      await service.sendOtp('9876543210', CountryCode.IN);

      expect(prisma.otpVerification.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          phoneNumber: '9876543210',
          purpose: OtpPurpose.LOGIN,
        }),
        data: { expiresAt: expect.any(Date) },
      });
    });
  });

  describe('verifyOtp', () => {
    const mockOtpRecord = {
      id: 'otp_123',
      phoneNumber: '9876543210',
      countryCode: CountryCode.IN,
      otpCode: '123456',
      otpHash: 'hashed_otp',
      attempts: 0,
      maxAttempts: 3,
      isVerified: false,
      expiresAt: new Date(Date.now() + 600000),
    };

    it('should verify OTP and login existing user', async () => {
      mockPrismaService.otpVerification.findFirst.mockResolvedValue(mockOtpRecord);
      mockPrismaService.otpVerification.update.mockResolvedValue({ ...mockOtpRecord, attempts: 1 });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: 'refresh_123' });
      mockPrismaService.userActivityLog.create.mockResolvedValue({});

      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.signAsync
        .mockResolvedValueOnce('temp_access_token')
        .mockResolvedValueOnce('temp_refresh_token')
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');

      const result = await service.verifyOtp(
        '9876543210',
        CountryCode.IN,
        '123456',
        mockDeviceInfo,
      );

      expect(result.accessToken).toBe('access_token');
      expect(result.user.id).toBe(mockUser.id);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: expect.objectContaining({ isPhoneVerified: true }),
      });
    });

    it('should register new user on OTP verification', async () => {
      mockPrismaService.otpVerification.findFirst.mockResolvedValue(mockOtpRecord);
      mockPrismaService.otpVerification.update.mockResolvedValue({ ...mockOtpRecord, attempts: 1 });
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: 'refresh_123' });
      mockPrismaService.userActivityLog.create.mockResolvedValue({});

      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.signAsync
        .mockResolvedValueOnce('temp_access_token')
        .mockResolvedValueOnce('temp_refresh_token')
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');

      const result = await service.verifyOtp(
        '9876543210',
        CountryCode.IN,
        '123456',
        mockDeviceInfo,
      );

      expect(result.user).toBeDefined();
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          phoneNumber: '9876543210',
          isPhoneVerified: true,
          role: UserRole.PATIENT,
        }),
      });
    });

    it('should throw UnauthorizedException for invalid OTP', async () => {
      mockPrismaService.otpVerification.findFirst.mockResolvedValue(mockOtpRecord);
      mockPrismaService.otpVerification.update.mockResolvedValue({ ...mockOtpRecord, attempts: 1 });

      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.verifyOtp('9876543210', CountryCode.IN, '999999', mockDeviceInfo),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired OTP', async () => {
      mockPrismaService.otpVerification.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyOtp('9876543210', CountryCode.IN, '123456', mockDeviceInfo),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException for max attempts exceeded', async () => {
      mockPrismaService.otpVerification.findFirst.mockResolvedValue({
        ...mockOtpRecord,
        attempts: 3,
      });

      await expect(
        service.verifyOtp('9876543210', CountryCode.IN, '123456', mockDeviceInfo),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('resendOtp', () => {
    const mockOtpRecord = {
      id: 'otp_123',
      phoneNumber: '9876543210',
      otpCode: '123456',
      resentCount: 0,
      lastResentAt: new Date(Date.now() - 120000), // 2 minutes ago
    };

    it('should resend OTP successfully', async () => {
      mockPrismaService.otpVerification.findFirst.mockResolvedValue(mockOtpRecord);
      mockPrismaService.otpVerification.update.mockResolvedValue({
        ...mockOtpRecord,
        resentCount: 1,
      });

      const result = await service.resendOtp('9876543210', CountryCode.IN);

      expect(result.message).toBe('OTP resent successfully');
      expect(prisma.otpVerification.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException for cooldown period', async () => {
      mockPrismaService.otpVerification.findFirst.mockResolvedValue({
        ...mockOtpRecord,
        lastResentAt: new Date(), // Just now
      });

      await expect(service.resendOtp('9876543210', CountryCode.IN)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException for max resend count', async () => {
      mockPrismaService.otpVerification.findFirst.mockResolvedValue({
        ...mockOtpRecord,
        resentCount: 3,
      });

      await expect(service.resendOtp('9876543210', CountryCode.IN)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ==========================================
  // EMAIL/PASSWORD AUTHENTICATION TESTS
  // ==========================================

  describe('register', () => {
    it('should register new user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.emailVerificationToken.create.mockResolvedValue({});

      mockedBcrypt.hash.mockResolvedValue('hashed_password' as never);

      const result = await service.register(
        'test@example.com',
        'Test User',
        'password123',
        mockDeviceInfo,
      );

      expect(result.message).toContain('verify your email');
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.emailVerificationToken.create).toHaveBeenCalled();
    });

    it('should throw ConflictException for existing email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register('test@example.com', 'Test User', 'password123', mockDeviceInfo),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: 'refresh_123' });
      mockPrismaService.userActivityLog.create.mockResolvedValue({});

      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.signAsync
        .mockResolvedValueOnce('temp_access_token')
        .mockResolvedValueOnce('temp_refresh_token')
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');

      const result = await service.login('test@example.com', 'password123', mockDeviceInfo);

      expect(result.accessToken).toBe('access_token');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.login('test@example.com', 'wrongpassword', mockDeviceInfo),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException for unverified email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        isVerified: false,
      });
      mockedBcrypt.compare.mockResolvedValue(true as never);

      await expect(
        service.login('test@example.com', 'password123', mockDeviceInfo),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('verifyEmail', () => {
    const mockToken = 'verification_token_123';

    it('should verify email successfully', async () => {
      mockPrismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'token_123',
        userId: mockUser.id,
        token: mockToken,
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: null,
      });

      // FIX: $transaction receives an ARRAY of promises, not a callback
      mockPrismaService.$transaction.mockResolvedValue([
        { ...mockUser, isVerified: true }, // user.update result
        {}, // emailVerificationToken.update result
      ]);

      mockPrismaService.user.update.mockResolvedValue({ ...mockUser, isVerified: true });
      mockPrismaService.emailVerificationToken.update.mockResolvedValue({});

      const result = await service.verifyEmail(mockToken);

      expect(result.message).toBe('Email verified successfully');
    });

    it('should throw BadRequestException for expired token', async () => {
      mockPrismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'token_123',
        userId: mockUser.id,
        token: mockToken,
        expiresAt: new Date(Date.now() - 3600000), // Expired
        usedAt: null,
      });

      await expect(service.verifyEmail(mockToken)).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword', () => {
    it('should generate password reset token', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.passwordResetToken.create.mockResolvedValue({});

      const result = await service.forgotPassword('test@example.com');

      expect(result.message).toContain('password reset link');
      expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    });

    it('should not reveal if email does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@example.com');

      expect(result.message).toContain('password reset link');
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const mockResetToken = {
      id: 'reset_123',
      userId: mockUser.id,
      token: 'reset_token_123',
      expiresAt: new Date(Date.now() + 3600000),
      usedAt: null,
    };

    it('should reset password successfully', async () => {
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(mockResetToken);

      // FIX: $transaction receives an ARRAY of promises
      mockPrismaService.$transaction.mockResolvedValue([
        mockUser, // user.update result
        {}, // passwordResetToken.update result
        { count: 2 }, // refreshToken.updateMany result
      ]);

      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockPrismaService.passwordResetToken.update.mockResolvedValue({});
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      mockedBcrypt.hash.mockResolvedValue('new_hashed_password' as never);

      const result = await service.resetPassword('reset_token_123', 'newPassword123');

      expect(result.message).toContain('Password reset successfully');
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        data: { isRevoked: true },
      });
    });

    it('should throw BadRequestException for expired token', async () => {
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue({
        ...mockResetToken,
        expiresAt: new Date(Date.now() - 3600000),
      });

      await expect(service.resetPassword('reset_token_123', 'newPassword123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ==========================================
  // TOKEN MANAGEMENT TESTS
  // ==========================================

  describe('refreshTokens', () => {
    const mockRefreshToken = {
      id: 'refresh_123',
      userId: mockUser.id,
      token: 'refresh_token_abc',
      deviceId: 'device_123',
      deviceName: 'Test Device',
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 604800000),
      user: mockUser,
    };

    it('should refresh tokens successfully', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        await callback(mockPrismaService);
        return { id: 'new_refresh_123' };
      });
      mockPrismaService.refreshToken.update.mockResolvedValue({});
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: 'new_refresh_123' });
      mockPrismaService.userActivityLog.create.mockResolvedValue({});

      mockJwtService.signAsync
        .mockResolvedValueOnce('new_access_token')
        .mockResolvedValueOnce('new_refresh_token')
        .mockResolvedValueOnce('final_access_token')
        .mockResolvedValueOnce('final_refresh_token');

      const result = await service.refreshTokens('refresh_token_abc', 'device_123');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedException for revoked token', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        ...mockRefreshToken,
        isRevoked: true,
      });

      await expect(service.refreshTokens('refresh_token_abc', 'device_123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for device mismatch', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);

      await expect(service.refreshTokens('refresh_token_abc', 'different_device')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should logout user from specific device', async () => {
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.userActivityLog.create.mockResolvedValue({});

      const result = await service.logout(mockUser.id, 'device_123');

      expect(result.message).toBe('Logged out successfully');
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, deviceId: 'device_123', isRevoked: false },
        data: { isRevoked: true },
      });
    });
  });

  describe('logoutAllDevices', () => {
    it('should logout user from all devices', async () => {
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 3 });
      mockPrismaService.userActivityLog.create.mockResolvedValue({});

      const result = await service.logoutAllDevices(mockUser.id);

      expect(result.message).toBe('Logged out from all devices');
      expect(result.devicesLoggedOut).toBe(3);
    });
  });

  // ==========================================
  // GOOGLE OAUTH TESTS
  // ==========================================

  describe('googleLogin', () => {
    const googleUser = {
      googleId: 'google_123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      picture: 'https://example.com/photo.jpg',
    };

    it('should login existing Google user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: 'refresh_123' });
      mockPrismaService.userActivityLog.create.mockResolvedValue({});

      mockJwtService.signAsync
        .mockResolvedValueOnce('temp_access_token')
        .mockResolvedValueOnce('temp_refresh_token')
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');

      const result = await service.googleLogin(googleUser, mockDeviceInfo);

      expect(result.user.email).toBe(mockUser.email);
      expect(result.accessToken).toBe('access_token');
    });

    it('should create new user for first-time Google login', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // No googleId match
        .mockResolvedValueOnce(null); // No email match
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        googleId: googleUser.googleId,
      });
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: 'refresh_123' });
      mockPrismaService.userActivityLog.create.mockResolvedValue({});

      mockJwtService.signAsync
        .mockResolvedValueOnce('temp_access_token')
        .mockResolvedValueOnce('temp_refresh_token')
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');

      const result = await service.googleLogin(googleUser, mockDeviceInfo);

      expect(prisma.user.create).toHaveBeenCalled();
      expect(result.user).toBeDefined();
    });
  });
});
