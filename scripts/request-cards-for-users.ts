/**
 * @fileoverview Script to request physical cards for users through 123 Backoffice
 * @description Automates the process of ordering physical cards for users who have
 * a backoffice customer profile but lack physical cards
 */

import { db } from '../src/config/prisma';
import axios from 'axios';
import { buildLogger } from '../src/utils';
import { config } from '../src/config/config';
import type { BackofficeApiResponse } from './schemas';

const logger = buildLogger('RequestPhysicalCardsScript');

// TEMPORAL: Target specific user ID for card request (set to null for all users)

/**
 * Backoffice API configuration
 * Prioritizes centralized config which loads .env via dotenv
 */
const BACKOFFICE_API_BASE =
  config.backofficeBaseUrl || process.env.BACKOFFICE_API_BASE;
const ECOMMERCE_TOKEN = config.ecommerceToken || process.env.ECOMMERCE_TOKEN;

/**
 * Normalizes base URL by removing trailing slashes
 * @param url - The URL to normalize
 * @returns Normalized URL without trailing slash
 */
function normalizeBaseUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

const NORMALIZED_BACKOFFICE_API_BASE = normalizeBaseUrl(BACKOFFICE_API_BASE);

/**
 * Represents a bulk order request for physical cards to the backoffice API
 */
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

/**
 * Response from backoffice API for bulk card orders
 */
interface BulkOrderCardResponse {
  payload: {
    reference_batch: string;
    status: number;
  };
  message: string;
  status: number;
}

/**
 * Requests physical cards for users who have backoffice profiles but no physical cards
 * @param targetUserId - Optional user ID to request cards specifically (temporal feature)
 * @throws {Error} When configuration is invalid or API request fails
 */
async function requestPhysicalCardsForUsers(): Promise<void> {
  try {
    logger.info('Starting physical card request process for ALL users...');

    const whereClause = {
      BackofficeCustomerProfile: {
        isNot: null,
      } as { isNot: null },
      Cards: {
        none: {
          cardType: 'PHYSICAL' as const,
        },
      },
    };

    const usersBatch = await db.users.findMany({
      where: {
        id: 9,
        ...whereClause,
      },
      include: {
        BackofficeCustomerProfile: true,
        BackofficeAuthState: true,
      },
      take: 10,
    });

    if (usersBatch.length === 0) {
      logger.info('No users found that need physical cards');
      return;
    }

    logger.info(`Found ${usersBatch.length} user(s) for card request`);

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
      mobile: Number(
        firstUser.BackofficeCustomerProfile?.mobile ||
          firstUser.phone ||
          '5555555555'
      ),
      interior_number: (() => {
        const interiorValue =
          firstUser.BackofficeCustomerProfile?.interior ||
          firstUser.internalNumber;

        // Only use the value if it's numeric
        if (interiorValue && /^\d+$/.test(interiorValue)) {
          return interiorValue;
        }

        // Default to '1' if not valid (must be numeric)
        return '1';
      })(),
      state: firstUser.state,
      neighborhood:
        firstUser.BackofficeCustomerProfile?.colony || firstUser.colony,
      postal_code:
        firstUser.BackofficeCustomerProfile?.zipcode || firstUser.postalCode,
      additional_notes: 'Physical cards requested automatically via script',
    };

    const bulkOrderData: BulkOrderCardRequest = {
      delivery_location: deliveryLocation,
      batch: batch,
    };

    logger.info('Sending physical card request to backoffice...');

    // Log the data being sent for debugging
    logger.info('Request data:', {
      delivery_location: deliveryLocation,
      batch_count: batch.length,
      first_batch_item: batch[0],
    });

    // Diagnostic logs to help troubleshoot "Invalid URL" errors
    logger.info('Backoffice API configuration', {
      BACKOFFICE_API_BASE: NORMALIZED_BACKOFFICE_API_BASE,
      hasToken: !!ECOMMERCE_TOKEN,
    });

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
    logger.info('Backoffice response received', { data: response.data });

    // Handle different response formats from backoffice API
    const responseData = response.data as unknown as BackofficeApiResponse;
    const payload = responseData.payload;

    const referenceBatchFromResponse =
      payload?.reference_batch ||
      payload?.referenceBatch ||
      payload?.reference ||
      responseData.reference_batch ||
      responseData.referenceBatch ||
      responseData.reference;

    if (!referenceBatchFromResponse) {
      const respStr = JSON.stringify(response.data, null, 2);
      throw new Error(
        `Backoffice response did not include a reference batch. Response: ${respStr}`
      );
    }

    const bulkBatch = await db.bulkBatch.create({
      data: {
        referenceBatch: String(referenceBatchFromResponse),
        status: (payload?.status as number) || 1,
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

      logger.info(`Card registered for user ${user.id} (${user.email})`);
    }
  } catch (error) {
    logger.error('Error requesting physical cards:');

    // Type-safe error handling
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: {
          status?: number;
          statusText?: string;
          data?: unknown;
        };
        config?: {
          url?: string;
          method?: string;
        };
      };

      logger.error('HTTP error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        url: axiosError.config?.url,
        method: axiosError.config?.method,
      });

      if (axiosError.response?.status === 400) {
        logger.error(
          'Bad Request (400) - Check the request data in logs above'
        );
      }
    } else {
      logger.error(
        'Non-HTTP error:',
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : { error }
      );
    }

    throw error;
  }
}

/**
 * Main execution function for the script
 * Orchestrates the physical card request process
 */
async function main(): Promise<void> {
  try {
    logger.info('Running card request for ALL users without physical cards');

    await requestPhysicalCardsForUsers();
    logger.info('Process completed successfully');
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

export { requestPhysicalCardsForUsers };
