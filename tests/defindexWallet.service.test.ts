import {
  DefindexWallet_chainType,
  DefindexWallet_status,
} from '@prisma/client';

jest.mock('@/config/firebase', () => ({ firebaseAdmin: {} }));

import { DefindexWalletService } from '@/services/defindexWallet.service';
import { DefindexWalletRepository } from '@/repositories/defindexWallet.repository';
import crossmintInstance from '@/api/crossmint.instance';
import { NotFoundError } from '@/shared/errors';

jest.mock('@/repositories/defindexWallet.repository');
jest.mock('@/api/crossmint.instance', () => ({ post: jest.fn() }));

const mockWallet = {
  id: 1,
  userId: 42,
  crossmintWalletId: 'cm-wallet-123',
  walletAddress: 'GXYZ123ABC',
  chainType: DefindexWallet_chainType.STELLAR,
  status: DefindexWallet_status.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('DefindexWalletService', () => {
  describe('createOrGetWallet', () => {
    it('returns existing wallet without calling Crossmint', async () => {
      jest
        .mocked(DefindexWalletRepository.findByUserId)
        .mockResolvedValue(mockWallet);

      const result = await DefindexWalletService.createOrGetWallet(42);

      expect(result).toEqual(mockWallet);
      expect(crossmintInstance.post).not.toHaveBeenCalled();
    });

    it('creates a new wallet via Crossmint when none exists', async () => {
      jest
        .mocked(DefindexWalletRepository.findByUserId)
        .mockResolvedValue(null);
      jest.mocked(crossmintInstance.post).mockResolvedValue({
        data: {
          id: 'cm-wallet-123',
          type: 'stellar-mpc-wallet:non-custodial',
          address: 'GXYZ123ABC',
          linkedUser: 'userId:42',
        },
      } as any);
      jest
        .mocked(DefindexWalletRepository.create)
        .mockResolvedValue(mockWallet);

      const result = await DefindexWalletService.createOrGetWallet(42);

      expect(crossmintInstance.post).toHaveBeenCalledWith(
        '/api/2022-06-09/wallets',
        { type: 'stellar-mpc-wallet:non-custodial', linkedUser: 'userId:42' }
      );
      expect(DefindexWalletRepository.create).toHaveBeenCalledWith({
        userId: 42,
        crossmintWalletId: 'cm-wallet-123',
        walletAddress: 'GXYZ123ABC',
        chainType: DefindexWallet_chainType.STELLAR,
        status: DefindexWallet_status.ACTIVE,
      });
      expect(result).toEqual(mockWallet);
    });
  });

  describe('getWalletByUser', () => {
    it('returns wallet when it exists', async () => {
      jest
        .mocked(DefindexWalletRepository.findByUserId)
        .mockResolvedValue(mockWallet);

      const result = await DefindexWalletService.getWalletByUser(42);

      expect(result).toEqual(mockWallet);
    });

    it('throws NotFoundError when wallet does not exist', async () => {
      jest
        .mocked(DefindexWalletRepository.findByUserId)
        .mockResolvedValue(null);

      await expect(DefindexWalletService.getWalletByUser(42)).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
