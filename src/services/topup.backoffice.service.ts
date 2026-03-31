import backOfficeInstance from '@/api/backoffice.instance';
import { config } from '@/config';
import {
  WalletTopUpRequest,
  WalletTopUpResponsePayload,
} from '@/schemas/payment.schemas';
import { ApiResponse } from '@/schemas/api.backoffice.schemas';
import { buildLogger } from '@/utils';

const logger = buildLogger('TopupBackofficeService');

export class TopupBackofficeService {
  static async topUp(
    params: WalletTopUpRequest
  ): Promise<ApiResponse<WalletTopUpResponsePayload>> {
    logger.info('Processing wallet topUp', {
      externalTransactionId: params.externalTransactionId,
      balanceId: params.balanceId,
      sourceCustomerID: params.sourceCustomerID,
      amount: params.amount,
    });

    const response = await backOfficeInstance.post<
      ApiResponse<WalletTopUpResponsePayload>
    >('/wallet/v1/topUp', params, {
      headers: {
        'Authorization-ecommerce': config.ecommerceToken,
      },
    });

    logger.info('Wallet topUp completed successfully', {
      externalTransactionId: params.externalTransactionId,
      response: response.data,
    });

    return response.data;
  }
}
