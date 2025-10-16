import backOfficeInstance from '@/api/backoffice.instance';
import {
  ActivateCardParams,
  ActivateCardResponse,
  CreateLinkedCardParams,
  CreateLinkedCardResponse,
  GetCardInfoResponse,
  StopCardParams,
  StopCardResponse,
  UnstopCardParams,
  UnstopCardResponse,
  ViewPinForCustomerResponse,
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

  static async viewPinForCustomer(
    card_backoffice_id: number,
    customerToken: string
  ): Promise<ViewPinForCustomerResponse> {
    logger.info('Viewing pin for customer with params:', {
      card_backoffice_id,
    });

    const response = await backOfficeInstance.post<ViewPinForCustomerResponse>(
      '/debit/v1/viewPinForCustomer',
      { card_id: card_backoffice_id },
      {
        headers: {
          'Authorization-customer': customerToken,
        },
      }
    );

    logger.info('Pin fetched successfully. Response:', {
      response: response.data,
    });

    return response.data;
  }

  static async stopCard(
    params: StopCardParams,
    customerToken: string
  ): Promise<StopCardResponse> {
    logger.info('Stopping card with params:', { params });

    const response = await backOfficeInstance.post<StopCardResponse>(
      '/debit/v1/stop',
      params,
      {
        headers: {
          'Authorization-customer': customerToken,
        },
      }
    );

    logger.info('Card stopped successfully. Response:', {
      response: response.data,
    });
    return response.data;
  }

  static async unstopCard(
    params: UnstopCardParams,
    customerToken: string
  ): Promise<UnstopCardResponse> {
    logger.info('Unstopping card with params:', { params });

    const response = await backOfficeInstance.post<UnstopCardResponse>(
      '/debit/v1/unstop',
      params,
      {
        headers: {
          'Authorization-customer': customerToken,
        },
      }
    );

    logger.info('Card unstopped successfully. Response:', {
      response: response.data,
    });
    return response.data;
  }

  static async createLinkedCard(
    params: CreateLinkedCardParams,
    customerToken: string
  ): Promise<CreateLinkedCardResponse> {
    logger.info('Creating linked card with params:', { params });

    const response = await backOfficeInstance.post<CreateLinkedCardResponse>(
      '/debit/v1/create-linked-card',
      {},
      {
        params: {
          campaign_id: params.campaign_id || '',
          balance_id: params.balance_id,
        },
        headers: {
          'Authorization-customer': customerToken,
        },
      }
    );

    logger.info('Linked card created successfully. Response:', {
      response: response.data,
    });
    return response.data;
  }
}
