import backOfficeInstance from '@/api/backoffice.instance';
import { buildLogger } from '@/utils';
import { config } from '@/config';
import {
  SpeiCashoutBackofficeRequest,
  SpeiCashoutBackofficeResponse,
  TransferBackofficeRequest,
  TransferBackofficeResponse,
} from '@/schemas/transfer.schemas';

const logger = buildLogger('TransferBackofficeService');

export class TransferBackofficeService {
  static async transfer(
    params: TransferBackofficeRequest,
    customerToken: string
  ): Promise<TransferBackofficeResponse> {
    logger.info('Processing wallet transfer with params:', {
      sourceCustomerID: params.sourceCustomerID,
      targetID: params.targetID,
      amount: params.amount,
    });

    const response = await backOfficeInstance.post<TransferBackofficeResponse>(
      '/wallet/v1/transfer',
      params,
      {
        headers: {
          'Authorization-customer': customerToken,
          'Authorization-ecommerce': config.ecommerceToken,
        },
      }
    );

    logger.info('Transfer completed successfully. Response:', {
      response: response.data,
    });
    return response.data;
  }

  static async speiCashout(
    params: SpeiCashoutBackofficeRequest,
    customerToken: string
  ): Promise<SpeiCashoutBackofficeResponse> {
    logger.info('Processing SPEI cashout with params:', {
      clabe: params.clabe,
      amount: params.amount,
    });

    const response =
      await backOfficeInstance.post<SpeiCashoutBackofficeResponse>(
        '/wallet/v1/spei-cashout',
        params,
        {
          headers: {
            'Authorization-customer': customerToken,
            'Authorization-ecommerce': config.ecommerceToken,
          },
        }
      );

    logger.info('SPEI cashout completed successfully. Response:', {
      response: response.data,
    });
    return response.data;
  }
}
