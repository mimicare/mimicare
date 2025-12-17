import { Test, TestingModule } from '@nestjs/testing';
import { V1ProfileController } from './profile.controller';
import { V1ProfileService } from './profile.service';
import { Gender, LifeStage } from '@mimicare/schema';

describe('V1ProfileController', () => {
  let controller: V1ProfileController;
  let service: V1ProfileService;

  const mockUserId = 'user_test_123';
  const mockProfile = {
    id: mockUserId,
    name: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    gender: Gender.FEMALE,
    role: 'PATIENT',
    settings: {
      preferredLanguage: 'ENGLISH',
      theme: 'SYSTEM',
      lifeStage: LifeStage.REPRODUCTIVE,
    },
  };

  const mockProfileService = {
    getMyProfile: jest.fn(),
    updateProfile: jest.fn(),
    deleteAccount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [V1ProfileController],
      providers: [
        {
          provide: V1ProfileService,
          useValue: mockProfileService,
        },
      ],
    }).compile();

    controller = module.get<V1ProfileController>(V1ProfileController);
    service = module.get<V1ProfileService>(V1ProfileService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyProfile', () => {
    it('should return user profile', async () => {
      mockProfileService.getMyProfile.mockResolvedValue(mockProfile);

      const result = await controller.getMyProfile(mockUserId);

      expect(service.getMyProfile).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateProfile', () => {
    it('should update and return profile', async () => {
      const updateDto = { name: 'Updated Name' };
      mockProfileService.updateProfile.mockResolvedValue({
        ...mockProfile,
        name: 'Updated Name',
      });

      const result = await controller.updateProfile(mockUserId, updateDto);

      expect(service.updateProfile).toHaveBeenCalledWith(mockUserId, updateDto);
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('deleteAccount', () => {
    it('should delete account and return success message', async () => {
      const confirmDto = { confirmationPhrase: 'DELETE' };
      mockProfileService.deleteAccount.mockResolvedValue({
        message: 'Account successfully deleted',
      });

      const result = await controller.deleteAccount(mockUserId, confirmDto);

      expect(service.deleteAccount).toHaveBeenCalledWith(mockUserId, confirmDto);
      expect(result.message).toBe('Account successfully deleted');
    });
  });
});
