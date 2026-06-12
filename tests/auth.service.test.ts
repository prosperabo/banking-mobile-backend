jest.mock('@/config/firebase', () => ({ firebaseAdmin: {} }));
jest.mock('@/config', () => ({
  config: {
    ecommerceToken: 'test-ecommerce-token',
    jwt: {
      secret: 'test-secret',
      expiresIn: '1h',
    },
  },
}));
jest.mock('@/config/config', () => ({
  config: {
    ecommerceToken: 'test-ecommerce-token',
    jwt: {
      secret: 'test-secret',
      expiresIn: '1h',
    },
  },
}));
jest.mock('@/config/prisma', () => ({
  db: {
    users: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  },
}));
jest.mock('@/utils/jwt.utils', () => ({
  JwtUtil: {
    generateToken: jest.fn(),
  },
}));

import { AuthService } from '@/services/auth.service';
import { UserRepository } from '@/repositories/user.repository';
import { BackofficeRepository } from '@/repositories/backoffice.repository';
import { BackofficeService } from '@/services/customer.backoffice.service';
import { BiometricAuthService } from '@/services/auth.biometric.service';
import { JwtUtil } from '@/utils/jwt.utils';

jest.mock('@/repositories/user.repository');
jest.mock('@/repositories/backoffice.repository');
jest.mock('@/services/customer.backoffice.service');
jest.mock('@/services/auth.biometric.service');

const mockUser = {
  id: 42,
  email: 'user@test.com',
  password: 'valid-password',
  completeName: 'Test User',
};

const mockUserWithAuthState = {
  ...mockUser,
  BackofficeAuthState: {
    refreshToken: 'refresh-token',
    deviceId: 'device-id',
    externalCustomerId: 123,
  },
};

const mockRefreshResponse = {
  response: {
    oauth_token: 'oauth-token',
    expiration_timestamp: '2026-06-11T12:00:00.000Z',
  },
};

describe('AuthService', () => {
  beforeEach(() => {
    jest.mocked(JwtUtil.generateToken).mockReturnValue('jwt-token');
    jest
      .mocked(BackofficeService.refreshCustomerToken)
      .mockResolvedValue(mockRefreshResponse as never);
    jest
      .mocked(BackofficeRepository.updateAuthState)
      .mockResolvedValue(undefined as never);
    jest
      .mocked(BackofficeRepository.updateProfile)
      .mockResolvedValue(undefined as never);
    jest
      .mocked(UserRepository.updateLastLogin)
      .mockResolvedValue(mockUser as never);
  });

  it('updates lastLogin after successful password login', async () => {
    jest.mocked(UserRepository.findByEmail).mockResolvedValue(mockUser as never);
    jest
      .mocked(UserRepository.findByEmailWithAuthState)
      .mockResolvedValue(mockUserWithAuthState as never);

    const result = await AuthService.login('password', {
      email: 'user@test.com',
      password: 'valid-password',
    });

    expect(result).toEqual({ token: 'jwt-token' });
    expect(UserRepository.updateLastLogin).toHaveBeenCalledTimes(1);
    expect(UserRepository.updateLastLogin).toHaveBeenCalledWith(
      42,
      expect.any(Date)
    );
  });

  it('does not update lastLogin when password login fails', async () => {
    jest.mocked(UserRepository.findByEmail).mockResolvedValue(mockUser as never);

    await expect(
      AuthService.login('password', {
        email: 'user@test.com',
        password: 'invalid-password',
      })
    ).rejects.toThrow('Invalid credentials');

    expect(UserRepository.updateLastLogin).not.toHaveBeenCalled();
  });

  it('updates lastLogin after successful biometric login', async () => {
    jest
      .mocked(BiometricAuthService.verifyChallenge)
      .mockResolvedValue({ userId: 42 } as never);
    jest.mocked(UserRepository.findById).mockResolvedValue(mockUser as never);
    jest
      .mocked(UserRepository.findByEmailWithAuthState)
      .mockResolvedValue(mockUserWithAuthState as never);

    const result = await AuthService.login('biometric', {
      deviceId: 'device-id',
      challengeId: 'challenge-id',
      signature: 'signature',
    });

    expect(result).toEqual({ token: 'jwt-token' });
    expect(UserRepository.updateLastLogin).toHaveBeenCalledTimes(1);
    expect(UserRepository.updateLastLogin).toHaveBeenCalledWith(
      42,
      expect.any(Date)
    );
  });
});
