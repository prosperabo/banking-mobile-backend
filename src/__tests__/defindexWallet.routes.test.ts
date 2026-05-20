import request from 'supertest';
import { DefindexWallet_chainType, DefindexWallet_status } from '@prisma/client';

jest.mock('@/config/firebase', () => ({ firebaseAdmin: {} }));

import app from '@/app';
import { DefindexWalletService } from '@/services/defindexWallet.service';
import { NotFoundError } from '@/shared/errors';

jest.mock('@/services/defindexWallet.service');
jest.mock('@/middlewares/authenticateToken', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    if (!req.headers['authorization']) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }
    req.user = { userId: 42, email: 'test@test.com' };
    next();
  },
}));

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

describe('POST /api/v1/defindex/wallets', () => {
  it('returns 201 and wallet when created successfully', async () => {
    jest.mocked(DefindexWalletService.createOrGetWallet).mockResolvedValue(mockWallet);

    const res = await request(app)
      .post('/api/v1/defindex/wallets')
      .set('Authorization', 'Bearer fake-token');

    expect(res.status).toBe(201);
    expect(res.body.data.wallet.crossmintWalletId).toBe('cm-wallet-123');
  });

  it('returns 201 and existing wallet when user already has one', async () => {
    jest.mocked(DefindexWalletService.createOrGetWallet).mockResolvedValue(mockWallet);

    const res = await request(app)
      .post('/api/v1/defindex/wallets')
      .set('Authorization', 'Bearer fake-token');

    expect(res.status).toBe(201);
    expect(res.body.data.wallet.userId).toBe(42);
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).post('/api/v1/defindex/wallets');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/defindex/wallets/me', () => {
  it('returns 200 and wallet when it exists', async () => {
    jest.mocked(DefindexWalletService.getWalletByUser).mockResolvedValue(mockWallet);

    const res = await request(app)
      .get('/api/v1/defindex/wallets/me')
      .set('Authorization', 'Bearer fake-token');

    expect(res.status).toBe(200);
    expect(res.body.data.wallet.walletAddress).toBe('GXYZ123ABC');
  });

  it('returns 404 when wallet does not exist', async () => {
    jest.mocked(DefindexWalletService.getWalletByUser).mockRejectedValue(
      new NotFoundError('Wallet not found for this user.')
    );

    const res = await request(app)
      .get('/api/v1/defindex/wallets/me')
      .set('Authorization', 'Bearer fake-token');

    expect(res.status).toBe(404);
  });
});
