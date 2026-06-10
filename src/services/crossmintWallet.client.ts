import crossmintInstance from '@/api/crossmint.instance';
import { buildLogger } from '@/utils';
import {
  CrossmintCreateWalletRequest,
  CrossmintWalletResponse,
} from '@/schemas/defindex.schemas';

const logger = buildLogger('CrossmintWalletClient');

export class CrossmintWalletClient {
  static async createWallet(
    userId: number,
  ): Promise<{ id: string; address: string }> {
    const payload: CrossmintCreateWalletRequest = {
      type: 'stellar-mpc-wallet:non-custodial',
      linkedUser: `userId:${userId}`,
    };

    const { data } = await crossmintInstance.post<CrossmintWalletResponse>(
      '/api/2022-06-09/wallets',
      payload,
    );

    logger.info('Crossmint wallet created', {
      userId,
      providerWalletId: data.id,
      walletAddress: data.address,
    });

    return { id: data.id, address: data.address };
  }
}
