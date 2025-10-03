import backOfficeInstance from '@/api/backoffice.instance';
import {
  ActivateCardParams,
  ActivateCardResponse,
  GetCardInfoResponse,
} from '@/schemas/card.schemas';
import { buildLogger } from '@/utils';

const logger = buildLogger('CardBackofficeService');

export class CardBackofficeService {
  static async activateCard(
    params: ActivateCardParams,
    customerToken: string
  ): Promise<ActivateCardResponse> {
    logger.info('Activating card with params:', { params });

    const response = await backOfficeInstance.post<ActivateCardResponse>(
      '/debit/v1/activateCardForCustomer',
      params,
      {
        headers: {
          'Authorization-customer': customerToken,
        },
      }
    );

    logger.info('Card activated successfully. Response:', {
      response: response.data,
    });
    return response.data;
  }

  static async getCardInfo(
    customerId: number,
    customerToken: string,
    cardId?: number
  ): Promise<GetCardInfoResponse> {
    logger.info('Fetching card info for customerId and cardId:', {
      customerId,
      cardId,
    });

    const response = await backOfficeInstance.get<GetCardInfoResponse>(
      '/debit/v1/infoForCustomer',
      {
        params: {
          customer_id: customerId,
          card_id: cardId,
        },
        headers: {
          'Authorization-customer': customerToken,
        },
      }
    );

    logger.info('Card info fetched successfully. Response:', {
      response: response.data,
    });
    return response.data;
  }
}
