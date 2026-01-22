/**
 * @fileoverview Script to request N physical cards in one bulk batch (no user relation)
 * @description Orders N cards to a fixed delivery location and stores reference + identifiers in DB
 *
 * Usage:
 *   npx tsx scripts/request-bulk-cards-no-user.ts --count=200 --pin=1234
 *   npx tsx scripts/request-bulk-cards-no-user.ts --count=100 --pin=1234
 *   npx tsx scripts/request-bulk-cards-no-user.ts --count=300 --pin=1234
 */

import { db } from '../src/config/prisma';
import axios from 'axios';
import { buildLogger } from '../src/utils';
import { config } from '../src/config/config';

const logger = buildLogger('RequestBulkCardsNoUserScript');

const BACKOFFICE_API_BASE =
  config.backofficeBaseUrl || process.env.BACKOFFICE_API_BASE;
const ECOMMERCE_TOKEN = config.ecommerceToken || process.env.ECOMMERCE_TOKEN;

function normalizeBaseUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

const NORMALIZED_BACKOFFICE_API_BASE = normalizeBaseUrl(BACKOFFICE_API_BASE);

/** ---------- Types ---------- */

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
    front_name?: string;
    qr?: string;
    pin: string;
    campaign_id?: string; // ✅ optional per docs
  }>;
}

/**
 * 200 OK response body (per backoffice docs)
 */
type BulkOrderCardApiResponse = {
  endpoint: string;
  error: string; // empty in successful requests
  payload: {
    reference: string; // The batch order's id
    status: number; // int16
  };
  text: string;
  timestamp: string; // date-time
};

/** ---------- Config & helpers ---------- */

function assertConfigured(): void {
  if (!NORMALIZED_BACKOFFICE_API_BASE) {
    throw new Error(
      'BACKOFFICE API base URL is not configured. Set BACKOFFICE_BASE_URL or BACKOFFICE_API_BASE in your environment.'
    );
  }
  if (!ECOMMERCE_TOKEN) {
    throw new Error(
      'ECOMMERCE_TOKEN is not configured. Set ECOMMERCE_TOKEN in your environment.'
    );
  }
}

function buildCardIdentifiers(count: number): string[] {
  // Unique per request: base timestamp + 0001..NNNN
  const base = Date.now().toString();
  return Array.from(
    { length: count },
    (_, i) => `${base}${String(i + 1).padStart(4, '0')}`
  );
}

function parseArgs(argv: string[]): { count: number; pin: string } {
  let count = 200;
  let pin = '1234';

  for (const arg of argv) {
    if (arg.startsWith('--count=')) {
      const n = Number(arg.replace('--count=', '').trim());
      if (!Number.isFinite(n) || n <= 0) {
        throw new Error(`Invalid --count value: "${arg}"`);
      }
      count = Math.floor(n);
    } else if (arg.startsWith('--pin=')) {
      const p = arg.replace('--pin=', '').trim();
      if (!/^\d{4}$/.test(p)) {
        throw new Error(`Invalid --pin value (must be 4 digits): "${p}"`);
      }
      pin = p;
    }
  }

  return { count, pin };
}

/** ---------- Main logic ---------- */

async function requestBulkCardsNoUser(params: {
  count: number;
  pin: string;
}): Promise<void> {
  assertConfigured();

  const { count, pin } = params;

  // ✅ campaign id provided by user
  const CAMPAIGN_ID = 'KBZ260121860';

  // Delivery location (fixed)
  const deliveryLocation: BulkOrderCardRequest['delivery_location'] = {
    first_names: 'Prospera',
    last_names: 'Recepcion',
    street: 'Alcatraz M61 L1, jardines del sur 5',
    neighborhood: 'Jardines del sur 5',
    city: 'Benito Juarez',
    state: 'Quintana Roo',
    exterior_number: '21',
    interior_number: '1',
    postal_code: '5349',
    mobile: 9983940931,
    additional_notes:
      'Bulk order physical cards (no user). Same PIN; will be changed later.',
  };

  const identifiers = buildCardIdentifiers(count);

  const batch: BulkOrderCardRequest['batch'] = identifiers.map(id => ({
    card_identifier: id,
    pin,
    front_name: 'PROSPERA',
    qr: '',
    campaign_id: CAMPAIGN_ID, // ✅ include campaign
  }));

  const bulkOrderData: BulkOrderCardRequest = {
    delivery_location: deliveryLocation,
    batch,
  };

  const requestUrl = `${NORMALIZED_BACKOFFICE_API_BASE}/debit/v1/bulkOrderCard`;

  logger.info('Sending bulk order to backoffice...', {
    url: requestUrl,
    batch_count: batch.length,
    campaign_id: CAMPAIGN_ID,
    delivery_location: deliveryLocation,
    first_batch_item: batch[0],
  });

  const response = await axios.post<BulkOrderCardApiResponse>(
    requestUrl,
    bulkOrderData,
    {
      headers: {
        'Authorization-ecommerce': ECOMMERCE_TOKEN,
        'Content-Type': 'application/json',
      },
    }
  );

  logger.info('Backoffice response received', { data: response.data });

  // If backoffice returns an error field even with 200 OK, handle it.
  if (response.data.error && response.data.error.trim().length > 0) {
    throw new Error(
      `Backoffice returned error: ${response.data.error}. Full response: ${JSON.stringify(
        response.data,
        null,
        2
      )}`
    );
  }

  const referenceBatchFromResponse = response.data.payload.reference;
  const statusFromPayload = response.data.payload.status ?? 1;

  if (
    !referenceBatchFromResponse ||
    referenceBatchFromResponse.trim().length === 0
  ) {
    throw new Error(
      `Backoffice response did not include payload.reference. Response: ${JSON.stringify(
        response.data,
        null,
        2
      )}`
    );
  }

  // Store in DB: 1 bulk + N cards (no userId)
  await db.$transaction(async tx => {
    const bulkBatch = await tx.bulkBatch.create({
      data: {
        referenceBatch: referenceBatchFromResponse,
        status: statusFromPayload,
        numCreated: 0,
        numFailed: 0,
        requestedAt: new Date(),
      },
    });

    await tx.cards.createMany({
      data: batch.map(c => ({
        bulkBatchId: bulkBatch.id,
        cardType: 'PHYSICAL',
        cardIdentifier: c.card_identifier,
        status: 'INACTIVE',
        encryptedPin: pin,
        updatedAt: new Date(),
      })),
    });

    logger.info('Bulk batch stored', {
      bulkBatchId: bulkBatch.id,
      referenceBatch: bulkBatch.referenceBatch,
      cardsInserted: count,
      campaign_id: CAMPAIGN_ID,
    });
  });
}

/** ---------- Entrypoint ---------- */

async function main(): Promise<void> {
  try {
    const { count, pin } = parseArgs(process.argv.slice(2));

    logger.info('Running bulk card request (no user relation)', { count, pin });

    await requestBulkCardsNoUser({ count, pin });

    logger.info('Done');
  } catch (error) {
    logger.error(
      'Error executing script:',
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { error }
    );
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { requestBulkCardsNoUser };
