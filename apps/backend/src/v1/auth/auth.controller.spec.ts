import { Test, type TestingModule } from '@nestjs/testing';
import { V1AuthController } from './auth.controller';
import { V1AuthService } from './auth.service';
import { CountryCode, UserRole } from '@mimicare/schema';
import { type Request, type Response } from 'express';

describe('V1AuthController', () => {
  let controller: V1AuthController;
  let service: V1AuthService;

  const mockAuthService = {
    sendOtp: jest.fn(),
    verifyOtp: jest.fn(),
    resendOtp: jest.fn(),
    register: jest.fn(),
    verifyEmail: jest.fn(),
    login: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    resendVerificationEmail: jest.fn(),
    googleLogin: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
    logoutAllDevices: jest.fn(),
    checkEmailVerifiedStatus: jest.fn(),
  };

  const mockRequest = {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
      'x-device-id': 'test-device-123',
    },
    ip: '127.0.0.1',
    user: null,
  } as unknown as Request;

  const mockResponse = {
    redirect: jest.fn(),
  } as unknown as Response;

  const mockUser = {
    id: 'user_123',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.PATIENT,
    isVerified: true,
    profilePictureUrl: null,
    phoneNumber: '9876543210',
    countryCode: CountryCode.IN,
  };

  const mockAuthResponse = {
    accessToken: 'access_token_123',
    refreshToken: 'refresh_token_123',
    user: mockUser,
    deviceId: 'test-device-123',
    expiresIn: 900,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [V1AuthController],
      providers: [
        {
          provide: V1AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<V1AuthController>(V1AuthController);
    service = module.get<V1AuthService>(V1AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ==========================================
  // PHONE OTP AUTHENTICATION TESTS
  // ==========================================

  describe('sendOtp', () => {
    it('should send OTP successfully', async () => {
      const dto = {
        phoneNumber: '9876543210',
        countryCode: CountryCode.IN,
        deviceName: 'Test Device',
      };

      const mockResponse = {
        message: 'OTP sent successfully',
        expiresIn: 600,
        canResendAt: new Date(),
      };

      mockAuthService.sendOtp.mockResolvedValue(mockResponse);

      const result = await controller.sendOtp(dto, mockRequest);

      expect(service.sendOtp).toHaveBeenCalledWith(
        dto.phoneNumber,
        dto.countryCode,
        dto.deviceName,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should extract device name from user-agent if not provided', async () => {
      const dto = {
        phoneNumber: '9876543210',
        countryCode: CountryCode.IN,
      };

      mockAuthService.sendOtp.mockResolvedValue({
        message: 'OTP sent successfully',
        expiresIn: 600,
        canResendAt: new Date(),
      });

      await controller.sendOtp(dto, mockRequest);

      expect(service.sendOtp).toHaveBeenCalledWith(
        dto.phoneNumber,
        dto.countryCode,
        expect.stringContaining('–'), // Device name format: "OS – Browser"
      );
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP and return auth tokens', async () => {
      const dto = {
        phoneNumber: '9876543210',
        countryCode: CountryCode.IN,
        otpCode: '123456',
        deviceName: 'Test Device',
      };

      mockAuthService.verifyOtp.mockResolvedValue(mockAuthResponse);

      const result = await controller.verifyOtp(dto, mockRequest, '127.0.0.1');

      expect(service.verifyOtp).toHaveBeenCalledWith(
        dto.phoneNumber,
        dto.countryCode,
        dto.otpCode,
        expect.objectContaining({
          deviceId: 'test-device-123',
          deviceName: dto.deviceName,
          ipAddress: '127.0.0.1',
          userAgent: expect.any(String),
        }),
      );
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('resendOtp', () => {
    it('should resend OTP successfully', async () => {
      const dto = {
        phoneNumber: '9876543210',
        countryCode: CountryCode.IN,
      };

      const mockResponse = {
        message: 'OTP resent successfully',
        canResendAt: new Date(),
      };

      mockAuthService.resendOtp.mockResolvedValue(mockResponse);

      const result = await controller.resendOtp(dto);

      expect(service.resendOtp).toHaveBeenCalledWith(dto.phoneNumber, dto.countryCode);
      expect(result).toEqual(mockResponse);
    });
  });

  // ==========================================
  // EMAIL/PASSWORD AUTHENTICATION TESTS
  // ==========================================

  describe('register', () => {
    it('should register new user successfully', async () => {
      const dto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'StrongPass123!',
        deviceName: 'Test Device',
      };

      const mockResponse = {
        message: 'Registration successful. Please verify your email.',
        userId: 'user_123',
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(dto, mockRequest, '127.0.0.1');

      expect(service.register).toHaveBeenCalledWith(
        dto.email,
        dto.name,
        dto.password,
        expect.objectContaining({
          deviceId: expect.any(String),
          deviceName: dto.deviceName,
          ipAddress: '127.0.0.1',
        }),
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const dto = { token: 'verification_token_123' };
      const mockResponse = { message: 'Email verified successfully' };

      mockAuthService.verifyEmail.mockResolvedValue(mockResponse);

      const result = await controller.verifyEmail(dto);

      expect(service.verifyEmail).toHaveBeenCalledWith(dto.token);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'StrongPass123!',
      };

      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(dto, mockRequest, '127.0.0.1');

      expect(service.login).toHaveBeenCalledWith(
        dto.email,
        dto.password,
        expect.objectContaining({
          deviceId: expect.any(String),
          ipAddress: '127.0.0.1',
        }),
      );
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      const dto = { email: 'test@example.com' };
      const mockResponse = { message: 'If email exists, password reset link has been sent' };

      mockAuthService.forgotPassword.mockResolvedValue(mockResponse);

      const result = await controller.forgotPassword(dto);

      expect(service.forgotPassword).toHaveBeenCalledWith(dto.email);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const dto = {
        token: 'reset_token_123',
        newPassword: 'NewStrongPass123!',
      };

      const mockResponse = {
        message: 'Password reset successfully. Please login with new password.',
      };

      mockAuthService.resetPassword.mockResolvedValue(mockResponse);

      const result = await controller.resetPassword(dto);

      expect(service.resetPassword).toHaveBeenCalledWith(dto.token, dto.newPassword);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email', async () => {
      const dto = { email: 'test@example.com' };
      const mockResponse = { message: 'Verification email sent' };

      mockAuthService.resendVerificationEmail.mockResolvedValue(mockResponse);

      const result = await controller.resendVerification(dto);

      expect(service.resendVerificationEmail).toHaveBeenCalledWith(dto.email);
      expect(result).toEqual(mockResponse);
    });
  });

  // ==========================================
  // GOOGLE OAUTH TESTS
  // ==========================================

  describe('googleAuth', () => {
    it('should initiate Google OAuth flow', async () => {
      // GoogleOAuthGuard handles the redirect
      const result = await controller.googleAuth();
      expect(result).toBeUndefined();
    });
  });

  describe('googleAuthCallback', () => {
    it('should handle successful Google OAuth callback', async () => {
      const googleUser = {
        googleId: 'google_123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        picture: 'https://example.com/photo.jpg',
      };

      const mockReq = {
        ...mockRequest,
        user: googleUser,
      } as unknown as Request;

      mockAuthService.googleLogin.mockResolvedValue(mockAuthResponse);
      (mockAuthService as any).configService = {
        get: jest.fn().mockReturnValue('http://localhost:5173'),
      };

      await controller.googleAuthCallback(mockReq, mockResponse, '127.0.0.1');

      expect(service.googleLogin).toHaveBeenCalledWith(
        googleUser,
        expect.objectContaining({
          deviceId: expect.any(String),
          ipAddress: '127.0.0.1',
        }),
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:5173/auth/callback'),
      );
    });

    it('should redirect to error page if Google user is null', async () => {
      const mockReq = {
        ...mockRequest,
        user: null,
      } as unknown as Request;

      (mockAuthService as any).configService = {
        get: jest.fn().mockReturnValue('http://localhost:5173'),
      };

      await controller.googleAuthCallback(mockReq, mockResponse, '127.0.0.1');

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/auth/error?message=Authentication failed'),
      );
    });
  });

  // ==========================================
  // TOKEN MANAGEMENT TESTS
  // ==========================================

  describe('refreshTokens', () => {
    it('should refresh access token successfully', async () => {
      const mockReq = {
        user: { refreshToken: 'refresh_token_123' },
      };

      const mockTokens = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      };

      mockAuthService.refreshTokens.mockResolvedValue(mockTokens);

      const result = await controller.refreshTokens(mockReq, { deviceId: 'device_123' });

      expect(service.refreshTokens).toHaveBeenCalledWith('refresh_token_123', 'device_123');
      expect(result).toEqual(mockTokens);
    });
  });

  describe('logout', () => {
    it('should logout from current device', async () => {
      const mockResponse = { message: 'Logged out successfully' };

      mockAuthService.logout.mockResolvedValue(mockResponse);

      const result = await controller.logout('user_123', mockRequest);

      expect(service.logout).toHaveBeenCalledWith('user_123', 'test-device-123');
      expect(result).toEqual(mockResponse);
    });

    it('should generate device ID if x-device-id header is missing', async () => {
      const mockReq = {
        headers: {
          'user-agent': 'Test Agent',
        },
        ip: '127.0.0.1',
      } as unknown as Request;

      mockAuthService.logout.mockResolvedValue({ message: 'Logged out successfully' });

      await controller.logout('user_123', mockReq);

      expect(service.logout).toHaveBeenCalledWith('user_123', expect.any(String));
    });
  });

  describe('logoutAll', () => {
    it('should logout from all devices', async () => {
      const mockResponse = {
        message: 'Logged out from all devices',
        devicesLoggedOut: 3,
      };

      mockAuthService.logoutAllDevices.mockResolvedValue(mockResponse);

      const result = await controller.logoutAll('user_123');

      expect(service.logoutAllDevices).toHaveBeenCalledWith('user_123');
      expect(result).toEqual(mockResponse);
    });
  });

  // ==========================================
  // USER INFO & STATUS TESTS
  // ==========================================

  describe('getCurrentUser', () => {
    it('should return current user ID', async () => {
      const result = await controller.getCurrentUser('user_123');

      expect(result).toEqual({ userId: 'user_123' });
    });
  });

  describe('checkEmailVerified', () => {
    it('should return email verification status', async () => {
      const mockResponse = { isVerified: true };

      mockAuthService.checkEmailVerifiedStatus.mockResolvedValue(mockResponse);

      const result = await controller.checkEmailVerified('user_123');

      expect(service.checkEmailVerifiedStatus).toHaveBeenCalledWith('user_123');
      expect(result).toEqual(mockResponse);
    });
  });

  // ==========================================
  // HELPER METHODS TESTS
  // ==========================================

  describe('extractDeviceName', () => {
    it('should extract device name from user-agent', () => {
      const deviceName = (controller as any).extractDeviceName(mockRequest);

      expect(deviceName).toContain('–'); // Should contain separator
      expect(deviceName).toBeTruthy();
    });

    it('should handle missing user-agent', () => {
      const mockReq = {
        headers: {},
      } as unknown as Request;

      const deviceName = (controller as any).extractDeviceName(mockReq);

      expect(deviceName).toContain('Unknown');
    });
  });

  describe('generateDeviceId', () => {
    it('should use x-device-id header if present', () => {
      const deviceId = (controller as any).generateDeviceId(mockRequest);

      expect(deviceId).toBe('test-device-123');
    });

    it('should generate hash from user-agent and IP if header missing', () => {
      const mockReq = {
        headers: {
          'user-agent': 'Test Agent',
        },
        ip: '127.0.0.1',
      } as unknown as Request;

      const deviceId = (controller as any).generateDeviceId(mockReq);

      expect(deviceId).toHaveLength(32); // SHA256 hash truncated to 32 chars
      expect(deviceId).toMatch(/^[a-f0-9]{32}$/);
    });
  });
});
