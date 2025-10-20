import { db } from '../src/config/prisma';
import axios from 'axios';
import { buildLogger } from '../src/utils';

const logger = buildLogger('RequestPhysicalCardsScript');

const BACKOFFICE_API_BASE = process.env.BACKOFFICE_API_BASE;
const ECOMMERCE_TOKEN = process.env.ECOMMERCE_TOKEN;

interface BulkOrderCardRequest {
  delivery_location: {
    additional_notes?: string;
    first_names: string;
    last_names: string;
    exterior_number: string;
    city: string;
    street: string;
    mobile: number;
    interior_number?: string;
    state: string;
    neighborhood: string;
    postal_code: string;
  };
  batch: Array<{
    card_identifier: string;
    front_name: string;
    qr: string;
    pin: string;
  }>;
}

interface BulkOrderCardResponse {
  payload: {
    reference_batch: string;
    status: number;
  };
  message: string;
  status: number;
}

async function requestPhysicalCardsForUsers() {
  try {
    logger.info('Iniciando proceso de solicitud de tarjetas físicas...');

    const usersBatch = await db.users.findMany({
      where: {
        BackofficeCustomerProfile: {
          isNot: null,
        },
        Cards: {
          none: {
            cardType: 'PHYSICAL',
          },
        },
      },
      include: {
        BackofficeCustomerProfile: true,
        BackofficeAuthState: true,
      },
      take: 10,
    });

    if (usersBatch.length === 0) {
      logger.info('No se encontraron usuarios que necesiten tarjetas físicas');
      return;
    }

    const batch = usersBatch.map((user, index) => ({
      card_identifier: `${Date.now()}${String(index + 1).padStart(3, '0')}`,
      front_name: `${
        user.BackofficeCustomerProfile?.first_name || ''
      } ${user.BackofficeCustomerProfile?.last_name || ''}`.trim(),
      qr: `https://prospera.undostres.com.mx/user/${user.id}`,
      pin: user.pin || '1234',
    }));

    const firstUser = usersBatch[0];
    const deliveryLocation = {
      first_names:
        firstUser.BackofficeCustomerProfile?.first_name ||
        firstUser.completeName.split(' ')[0],
      last_names:
        firstUser.BackofficeCustomerProfile?.last_name ||
        firstUser.completeName.split(' ').slice(1).join(' '),
      exterior_number:
        firstUser.BackofficeCustomerProfile?.exterior ||
        firstUser.externalNumber,
      city: firstUser.BackofficeCustomerProfile?.city || firstUser.municipality,
      street: firstUser.BackofficeCustomerProfile?.street || firstUser.street,
      mobile: parseInt(
        firstUser.BackofficeCustomerProfile?.mobile ||
          firstUser.phone ||
          '5555555555'
      ),
      interior_number:
        firstUser.BackofficeCustomerProfile?.interior ||
        firstUser.internalNumber,
      state: firstUser.state,
      neighborhood:
        firstUser.BackofficeCustomerProfile?.colony || firstUser.colony,
      postal_code:
        firstUser.BackofficeCustomerProfile?.zipcode || firstUser.postalCode,
      additional_notes:
        'Tarjetas físicas solicitadas automáticamente via script',
    };

    const bulkOrderData: BulkOrderCardRequest = {
      delivery_location: deliveryLocation,
      batch: batch,
    };

    logger.info('Enviando solicitud de tarjetas físicas al backoffice...');

    const response = await axios.post<BulkOrderCardResponse>(
      `${BACKOFFICE_API_BASE}/debit/v1/bulkOrderCard`,
      bulkOrderData,
      {
        headers: {
          'Authorization-ecommerce': ECOMMERCE_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    const bulkBatch = await db.bulkBatch.create({
      data: {
        referenceBatch: response.data.payload.reference_batch,
        status: response.data.payload.status,
        numCreated: 0,
        numFailed: 0,
        requestedAt: new Date(),
      },
    });

    for (let i = 0; i < usersBatch.length; i++) {
      const user = usersBatch[i];
      const cardData = batch[i];

      await db.cards.create({
        data: {
          userId: user.id,
          bulkBatchId: bulkBatch.id,
          cardType: 'PHYSICAL',
          cardIdentifier: cardData.card_identifier,
          status: 'INACTIVE',
          encryptedPin: cardData.pin,
          updatedAt: new Date(),
        },
      });

      logger.info(`Tarjeta registrada para usuario ${user.id} (${user.email})`);
    }
  } catch (error) {
    logger.error(
      'Error en la solicitud de tarjetas físicas:',
      error instanceof Error ? { message: error.message } : { error }
    );
    throw error;
  }
}

async function main() {
  try {
    await requestPhysicalCardsForUsers();
    logger.info('Proceso completado exitosamente');
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

export { requestPhysicalCardsForUsers };
