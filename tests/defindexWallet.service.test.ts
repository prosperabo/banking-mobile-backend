import {
  Prisma,
  WalletChain,
  WalletStatus,
} from '@prisma/client';

jest.mock('@/config/firebase', () => ({ firebaseAdmin: {} }));

import { UserWalletService } from '@/services/userWallet.service';
import { UserWalletRepository } from '@/repositories/userWallet.repository';
import { CrossmintWalletClient } from '@/services/crossmintWallet.client';
import { NotFoundError } from '@/shared/errors';

jest.mock('@/repositories/userWallet.repository');
jest.mock('@/services/crossmintWallet.client');

const mockWallet = {
  id: 1,
  userId: 42,
  provider: 'CROSSMINT' as const,
  providerWalletId: 'cm-wallet-123',
  walletAddress: 'GXYZ123ABC',
  chain: WalletChain.STELLAR,
  custodyType: 'NON_CUSTODIAL' as const,
  status: WalletStatus.ACTIVE,
  metadata: null as Prisma.JsonValue,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockWalletResponse = {
  id: 1,
  userId: 42,
  crossmintWalletId: 'cm-wallet-123',
  walletAddress: 'GXYZ123ABC',
  chainType: WalletChain.STELLAR,
  status: WalletStatus.ACTIVE,
  createdAt: mockWallet.createdAt,
};

describe('UserWalletService', () => {
  describe('createOrGetWallet', () => {
    it('returns existing wallet without calling Crossmint', async () => {
      jest
        .mocked(UserWalletRepository.findByUserId)
        .mockResolvedValue(mockWallet);

      const result = await UserWalletService.createOrGetWallet(42);

      expect(result).toEqual(mockWalletResponse);
      expect(CrossmintWalletClient.createWallet).not.toHaveBeenCalled();
    });

    it('creates a new wallet via Crossmint when none exists', async () => {
      jest
        .mocked(UserWalletRepository.findByUserId)
        .mockResolvedValue(null);
      jest
        .mocked(CrossmintWalletClient.createWallet)
        .mockResolvedValue({ id: 'cm-wallet-123', address: 'GXYZ123ABC' });
      jest
        .mocked(UserWalletRepository.create)
        .mockResolvedValue(mockWallet);

      const result = await UserWalletService.createOrGetWallet(42);

      expect(CrossmintWalletClient.createWallet).toHaveBeenCalledWith(42);
      expect(UserWalletRepository.create).toHaveBeenCalledWith({
        userId: 42,
        provider: 'CROSSMINT',
        providerWalletId: 'cm-wallet-123',
        walletAddress: 'GXYZ123ABC',
        chain: WalletChain.STELLAR,
        custodyType: 'NON_CUSTODIAL',
        status: WalletStatus.ACTIVE,
      });
      expect(result).toEqual(mockWalletResponse);
    });
  });

  describe('getWalletByUser', () => {
    it('returns wallet when it exists', async () => {
      jest
        .mocked(UserWalletRepository.findByUserId)
        .mockResolvedValue(mockWallet);

      const result = await UserWalletService.getWalletByUser(42);

      expect(result).toEqual(mockWalletResponse);
    });

    it('throws NotFoundError when wallet does not exist', async () => {
      jest
        .mocked(UserWalletRepository.findByUserId)
        .mockResolvedValue(null);

      await expect(UserWalletService.getWalletByUser(42)).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
