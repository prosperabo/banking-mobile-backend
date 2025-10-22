import { db } from '../src/config/prisma';
import axios from 'axios';
import { buildLogger } from '../src/utils';
import { config } from '../src/config/config';

const logger = buildLogger('RequestPhysicalCardsScript');

// Prefer using the centralized config which loads .env via dotenv
const BACKOFFICE_API_BASE =
  config.backofficeBaseUrl || process.env.BACKOFFICE_API_BASE;
const ECOMMERCE_TOKEN = config.ecommerceToken || process.env.ECOMMERCE_TOKEN;

function normalizeBaseUrl(url?: string | null) {
  if (!url) return undefined;
  // Trim and remove trailing slash
  const trimmed = url.trim();
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

const NORMALIZED_BACKOFFICE_API_BASE = normalizeBaseUrl(BACKOFFICE_API_BASE);

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
    // Diagnostic logs to help troubleshoot "Invalid URL" errors
    logger.info('BACKOFFICE_API_BASE', {
      BACKOFFICE_API_BASE: NORMALIZED_BACKOFFICE_API_BASE,
    });
    logger.info('ECOMMERCE_TOKEN present', { present: !!ECOMMERCE_TOKEN });

    if (!NORMALIZED_BACKOFFICE_API_BASE) {
      throw new Error(
        'BACKOFFICE API base URL is not configured. Set BACKOFFICE_BASE_URL or BACKOFFICE_API_BASE in your environment.'
      );
    }

    const requestUrl = `${NORMALIZED_BACKOFFICE_API_BASE}/debit/v1/bulkOrderCard`;

    const response = await axios.post<BulkOrderCardResponse>(
      requestUrl,
      bulkOrderData,
      {
        headers: {
          'Authorization-ecommerce': ECOMMERCE_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    // Log full response to inspect payload shape
    logger.info('Backoffice response', { data: response.data });

    // Some backoffice responses may use different casing/keys. Try multiple fallbacks.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const respAny = response.data as any;
    const referenceBatchFromResponse =
      respAny?.payload?.reference_batch ||
      respAny?.payload?.referenceBatch ||
      respAny?.payload?.reference ||
      respAny?.reference_batch ||
      respAny?.referenceBatch ||
      respAny?.reference ||
      undefined;

    if (!referenceBatchFromResponse) {
      // Provide a helpful error including the actual response shape
      const respStr = JSON.stringify(response.data, null, 2);
      throw new Error(
        `Backoffice response did not include a reference batch. Response: ${respStr}`
      );
    }

    const bulkBatch = await db.bulkBatch.create({
      data: {
        referenceBatch: String(referenceBatchFromResponse),
        status: (response.data as any)?.payload?.status || 1,
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
