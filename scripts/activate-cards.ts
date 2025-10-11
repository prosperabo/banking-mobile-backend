import { db } from '../src/config/prisma';
import axios from 'axios';
import { buildLogger } from '../src/utils';

const logger = buildLogger('ActivateCardsScript');

const BACKOFFICE_API_BASE = process.env.BACKOFFICE_API_BASE;
const ECOMMERCE_TOKEN = process.env.ECOMMERCE_TOKEN;

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
    logger.info('Iniciando proceso de activación de tarjetas físicas...');

    const inactiveCards = await db.cards.findMany({
      where: {
        cardType: 'PHYSICAL',
        status: 'INACTIVE',
        BulkBatch: {
          isNot: null,
        },
      },
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
      logger.info('No se encontraron tarjetas físicas para activar');
      return;
    }

    for (const card of inactiveCards) {
      try {
        const user = card.Users;

        if (!user.BackofficeCustomerProfile) {
          logger.warn(
            `Usuario ${user.id} no tiene perfil de backoffice, saltando...`
          );
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

        const response = await axios.post<ActivateCardResponse>(
          `${BACKOFFICE_API_BASE}/debit/v1/activateCardForCustomer`,
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
          `Tarjeta ${card.cardIdentifier} activada exitosamente (Card ID: ${response.data.payload.card_id})`
        );
      } catch (error) {
        logger.error(
          `Error activando tarjeta ${card.cardIdentifier}:`,
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
      'Error en el proceso de activación:',
      error instanceof Error ? { message: error.message } : { error }
    );
    throw error;
  }
}

async function main() {
  try {
    await activatePhysicalCards();

    logger.info('Activación completada exitosamente');
  } catch (error) {
    logger.error(
      'Error ejecutando el script:',
      error instanceof Error ? { message: error.message } : { error }
    );
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { activatePhysicalCards };
