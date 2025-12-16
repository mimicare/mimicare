import { Test, type TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { V1ProfileService } from './profile.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityType, CountryCode, Gender, LifeStage } from '@mimicare/schema';

describe('V1ProfileService', () => {
  let service: V1ProfileService;
  let prisma: PrismaService;

  // Mock user data
  const mockUserId = 'user_test_123';
  const mockUser = {
    id: mockUserId,
    name: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    phoneNumber: '9876543210',
    countryCode: CountryCode.IN,
    gender: Gender.FEMALE,
    role: 'PATIENT',
    isVerified: true,
    isPhoneVerified: true,
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    settings: {
      id: 'settings_123',
      userId: mockUserId,
      preferredLanguage: 'ENGLISH',
      theme: 'SYSTEM',
      lifeStage: LifeStage.REPRODUCTIVE,
    },
  };

  // Mock PrismaService
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    userSetting: {
      upsert: jest.fn(),
    },
    userActivityLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        V1ProfileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<V1ProfileService>(V1ProfileService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==========================================
  // GET MY PROFILE TESTS
  // ==========================================

  describe('getMyProfile', () => {
    it('should return user profile with settings', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMyProfile(mockUserId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId, deletedAt: null },
        include: { settings: true },
      });
      expect(result).toBeDefined();
      expect(result.id).toBe(mockUserId);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getMyProfile('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.getMyProfile('nonexistent')).rejects.toThrow(
        'User profile not found or has been deleted',
      );
    });

    it('should exclude soft-deleted users', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getMyProfile(mockUserId)).rejects.toThrow(NotFoundException);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId, deletedAt: null },
        include: { settings: true },
      });
    });
  });

  // ==========================================
  // UPDATE PROFILE TESTS
  // ==========================================

  describe('updateProfile', () => {
    beforeEach(() => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockPrismaService.userSetting.upsert.mockResolvedValue(mockUser.settings);
      mockPrismaService.userActivityLog.create.mockResolvedValue({});
    });

    it('should update basic profile fields', async () => {
      const updateDto = { name: 'Updated Name' };

      const result = await service.updateProfile(mockUserId, updateDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: expect.objectContaining({ name: 'Updated Name' }),
      });
      expect(result).toBeDefined();
    });

    it('should normalize username to lowercase', async () => {
      const updateDto = { username: 'NewUserName' };

      await service.updateProfile(mockUserId, updateDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: expect.objectContaining({ username: 'newusername' }),
      });
    });

    it('should require phone reverification when phone number changes', async () => {
      const updateDto = { phoneNumber: '1234567890' };

      await service.updateProfile(mockUserId, updateDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: expect.objectContaining({
          phoneNumber: '1234567890',
          isPhoneVerified: false,
        }),
      });
    });

    it('should throw ConflictException when username already exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValueOnce({ id: 'other_user' });

      await expect(service.updateProfile(mockUserId, { username: 'existinguser' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      // FIXED: When only email is provided, no username check happens
      // So only mock ONE findFirst call (for email check)
      mockPrismaService.user.findFirst.mockResolvedValueOnce({ id: 'other_user' });

      await expect(
        service.updateProfile(mockUserId, { email: 'existing@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when phone already exists', async () => {
      // FIXED: When only phone is provided, no username or email check happens
      // So only mock ONE findFirst call (for phone check)
      mockPrismaService.user.findFirst.mockResolvedValueOnce({ id: 'other_user' });

      await expect(
        service.updateProfile(mockUserId, {
          phoneNumber: '9876543210',
          countryCode: CountryCode.IN,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should update settings when provided', async () => {
      const updateDto = {
        settings: {
          theme: 'DARK' as any,
          pushNotifications: false,
        },
      };

      await service.updateProfile(mockUserId, updateDto);

      expect(prisma.userSetting.upsert).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        create: { userId: mockUserId, ...updateDto.settings },
        update: updateDto.settings,
      });
    });

    it('should prevent male users from setting female-only life stages', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        gender: Gender.MALE,
      });

      await expect(
        service.updateProfile(mockUserId, {
          settings: { lifeStage: LifeStage.PERIMENOPAUSE },
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.updateProfile(mockUserId, {
          settings: { lifeStage: LifeStage.POSTMENOPAUSE },
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.updateProfile(mockUserId, {
          settings: { lifeStage: LifeStage.PUBERTY },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow female users to set any life stage', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        gender: Gender.FEMALE,
      });

      await service.updateProfile(mockUserId, {
        settings: { lifeStage: LifeStage.PERIMENOPAUSE },
      });

      expect(prisma.userSetting.upsert).toHaveBeenCalled();
    });

    it('should log activity after successful update', async () => {
      await service.updateProfile(mockUserId, { name: 'New Name' });

      expect(prisma.userActivityLog.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          activityType: ActivityType.LOGIN,
          details: expect.objectContaining({
            action: 'profile_updated',
            updatedFields: ['name'],
          }),
        },
      });
    });
  });

  // ==========================================
  // DELETE ACCOUNT TESTS
  // ==========================================

  describe('deleteAccount', () => {
    beforeEach(() => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });
      mockPrismaService.userActivityLog.create.mockResolvedValue({});
    });

    it('should delete account with correct confirmation phrase', async () => {
      const result = await service.deleteAccount(mockUserId, {
        confirmationPhrase: 'DELETE',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: expect.objectContaining({
          name: 'Deleted User',
          username: null,
          email: null,
          phoneNumber: null,
          passwordHash: null,
          googleId: null,
          deletedAt: expect.any(Date),
          isActive: false,
        }),
      });

      expect(result).toEqual({ message: 'Account successfully deleted' });
    });

    it('should throw BadRequestException for incorrect confirmation phrase', async () => {
      await expect(
        service.deleteAccount(mockUserId, { confirmationPhrase: 'delete' }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.deleteAccount(mockUserId, { confirmationPhrase: 'REMOVE' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteAccount('nonexistent', { confirmationPhrase: 'DELETE' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when account already deleted', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });

      await expect(
        service.deleteAccount(mockUserId, { confirmationPhrase: 'DELETE' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should log deletion activity', async () => {
      await service.deleteAccount(mockUserId, { confirmationPhrase: 'DELETE' });

      expect(prisma.userActivityLog.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          activityType: ActivityType.LOGIN,
          details: expect.objectContaining({
            action: 'account_deleted',
            reason: 'user_initiated',
          }),
        },
      });
    });

    it('should anonymize all PII fields', async () => {
      await service.deleteAccount(mockUserId, { confirmationPhrase: 'DELETE' });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: expect.objectContaining({
          name: 'Deleted User',
          username: null,
          email: null,
          phoneNumber: null,
          profilePictureUrl: null,
          dateOfBirth: null,
          passwordHash: null,
          googleId: null,
          abhaAddress: null,
          abhaId: null,
        }),
      });
    });
  });
});
