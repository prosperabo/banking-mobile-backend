/**
 * Activate Cards Script
 *
 * This script processes inactive physical cards and activates them
 * through the backoffice API, updating their status and customer auth state.
 */

import { db } from '../src/config/prisma';
import axios from 'axios';
import { buildLogger } from '../src/utils';

const logger = buildLogger('activate-cards-script');

const BACKOFFICE_API_BASE = process.env.BACKOFFICE_API_BASE;
const BACKOFFICE_BASE_URL = process.env.BACKOFFICE_BASE_URL;
const ECOMMERCE_TOKEN = process.env.ECOMMERCE_TOKEN;

// Normalize the backoffice API base URL
const NORMALIZED_BACKOFFICE_API_BASE =
  BACKOFFICE_API_BASE || BACKOFFICE_BASE_URL;

interface ActivateCardRequest {
  pin: string;
  card_identifier: string;
  reference_batch: string;
  customer_id: string;
  balance: {
    id: number;
  };
}

interface ActivateCardResponse {
  payload: {
    reference_card: string;
    status_card: number;
    customer_id: number;
    card_id: number;
    customer_private_key: string;
    customer_refresh_token: string;
  };
  message: string;
  status: number;
}

async function activatePhysicalCards() {
  try {
    logger.info('Starting physical card activation for ALL inactive cards...');

    const whereClause = {
      cardType: 'PHYSICAL' as const,
      status: 'INACTIVE' as const,
      BulkBatch: {
        isNot: null,
      } as { isNot: null },
    };

    const inactiveCards = await db.cards.findMany({
      where: whereClause,
      include: {
        Users: {
          include: {
            BackofficeCustomerProfile: true,
            BackofficeAuthState: true,
          },
        },
        BulkBatch: true,
      },
      take: 10,
    });

    if (inactiveCards.length === 0) {
      logger.info('No physical cards found for activation');
      return;
    }

    logger.info(`Found ${inactiveCards.length} card(s) to activate`);

    for (const card of inactiveCards) {
      try {
        const user = card.Users;

        if (!user.BackofficeCustomerProfile) {
          logger.warn(`User ${user.id} has no backoffice profile, skipping...`);
          continue;
        }

        const activationData: ActivateCardRequest = {
          pin: card.encryptedPin || user.pin || '1234',
          card_identifier: card.cardIdentifier,
          reference_batch: card.BulkBatch?.referenceBatch || '',
          customer_id: String(
            user.BackofficeCustomerProfile.external_customer_id || user.id
          ),
          balance: {
            id: user.BackofficeCustomerProfile.ewallet_id || 1,
          },
        };

        // Validate backoffice configuration
        if (!NORMALIZED_BACKOFFICE_API_BASE) {
          throw new Error(
            'BACKOFFICE API base URL is not configured. Set BACKOFFICE_BASE_URL or BACKOFFICE_API_BASE in your environment.'
          );
        }

        // Debug: Log activation data
        logger.info('Attempting to activate card with data:', {
          card_identifier: activationData.card_identifier,
          reference_batch: activationData.reference_batch,
          customer_id: activationData.customer_id,
          balance_id: activationData.balance.id,
          pin: activationData.pin,
        });

        const response = await axios.post<ActivateCardResponse>(
          `${NORMALIZED_BACKOFFICE_API_BASE}/debit/v1/activateCardForCustomer`,
          activationData,
          {
            headers: {
              'Authorization-ecommerce': ECOMMERCE_TOKEN,
              'Content-Type': 'application/json',
            },
          }
        );

        await db.cards.update({
          where: { id: card.id },
          data: {
            status: 'ACTIVE',
            prosperaCardId: String(response.data.payload.card_id),
            updatedAt: new Date(),
          },
        });

        if (
          response.data.payload.customer_private_key &&
          response.data.payload.customer_refresh_token
        ) {
          await db.backofficeAuthState.upsert({
            where: { userId: user.id },
            update: {
              privateKey: response.data.payload.customer_private_key,
              refreshToken: response.data.payload.customer_refresh_token,
              updatedAt: new Date(),
            },
            create: {
              userId: user.id,
              privateKey: response.data.payload.customer_private_key,
              refreshToken: response.data.payload.customer_refresh_token,
              lastCustomerOauthToken: '',
              clientState: 9,
              deviceId: 'script-activation',
              extraLoginData: null,
            },
          });
        }

        logger.info(
          `Card ${card.cardIdentifier} activated successfully (Card ID: ${response.data.payload.card_id})`
        );
      } catch (error) {
        logger.error(
          `Error activating card ${card.cardIdentifier}:`,
          error instanceof Error
            ? {
                message: error.message,
                response: (error as { response?: { data: unknown } }).response
                  ?.data,
              }
            : { error }
        );
      }
    }
  } catch (error) {
    logger.error(
      'Error in activation process:',
      error instanceof Error ? { message: error.message } : { error }
    );
    throw error;
  }
}

async function main() {
  try {
    logger.info('Running card activation for ALL users with inactive cards');

    await activatePhysicalCards();

    logger.info('Activation completed successfully');
  } catch (error) {
    logger.error(
      'Error executing script:',
      error instanceof Error ? { message: error.message } : { error }
    );
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { activatePhysicalCards };
