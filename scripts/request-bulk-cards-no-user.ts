import { randomBytes } from 'crypto';
import { db } from '../src/config/prisma';
import { buildLogger } from '../src/utils';
import backOfficeInstance from './api/backoffice.instance';

const logger = buildLogger('RequestBulkCardsNoUserScript');

/* ================= TYPES ================= */

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
    pin: string;
    qr: string;
    campaign_id: string;
  }>;
}

type BulkOrderCardApiResponse = {
  endpoint: string;
  error: string;
  payload: {
    reference: string;
    status: number;
  };
  text: string;
  timestamp: string;
};

/* ================= HELPERS ================= */

function parseArgs(argv: string[]): { count: number; pin: string } {
  let count = 200;
  let pin = '1234';

  for (const arg of argv) {
    if (arg.startsWith('--count=')) {
      const n = Number(arg.replace('--count=', ''));
      if (!Number.isFinite(n) || n <= 0) throw new Error('Invalid count');
      count = Math.floor(n);
    }
    if (arg.startsWith('--pin=')) {
      const p = arg.replace('--pin=', '');
      if (!/^\d{4}$/.test(p)) throw new Error('PIN must be 4 digits');
      pin = p;
    }
  }

  return { count, pin };
}

function randomBase32(len: number): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = randomBytes(len);
  return Array.from(bytes)
    .map(b => alphabet[b % alphabet.length])
    .join('');
}

function buildIdentifiers(count: number): string[] {
  const ts = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const seq = i + 1;
    const suffix = randomBase32(6);
    return `PHYSICAL_${ts}_${seq}_${suffix}`;
  });
}

/* ================= MAIN ================= */

async function requestBulkCardsNoUser(params: {
  count: number;
  pin: string;
}): Promise<void> {
  const { count, pin } = params;

  const CAMPAIGN_ID = 'KBZ260121860';
  const QR_URL = 'https://slan.mx/card-activation';

  const deliveryLocation: BulkOrderCardRequest['delivery_location'] = {
    first_names: 'Prospera',
    last_names: 'Recepcion',
    street: 'Alcatraz M61 L1, jardines del sur 5',
    neighborhood: 'Jardines del sur 5',
    city: 'Benito Juarez',
    state: 'Quintana Roo',
    exterior_number: '21',
    interior_number: '1',
    postal_code: '77536',
    mobile: 9983940931,
    additional_notes: 'Bulk order physical cards',
  };

  const identifiers = buildIdentifiers(count);

  const batch: BulkOrderCardRequest['batch'] = identifiers.map(id => ({
    card_identifier: id,
    pin,
    qr: QR_URL,
    campaign_id: CAMPAIGN_ID,
  }));

  const bulkOrderData: BulkOrderCardRequest = {
    delivery_location: deliveryLocation,
    batch,
  };

  logger.info('🚀 Sending bulk order', {
    count,
    example: batch[0],
  });

  // ✅ Aquí ya loggea TODO la instancia axios
  const response = await backOfficeInstance.post<BulkOrderCardApiResponse>(
    '/debit/v1/bulkOrderCard',
    bulkOrderData
  );

  const reference = response.data.payload.reference;
  const status = response.data.payload.status;

  await db.$transaction(async tx => {
    const bulkBatch = await tx.bulkBatch.create({
      data: {
        referenceBatch: reference,
        status,
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

    logger.info('✅ Cards stored', {
      batchId: bulkBatch.id,
      reference,
      count,
    });
  });
}

/* ================= ENTRYPOINT ================= */

async function main(): Promise<void> {
  const { count, pin } = parseArgs(process.argv.slice(2));

  logger.info('Starting bulk card request', { count, pin });

  await requestBulkCardsNoUser({ count, pin });

  logger.info('Done');
}

if (require.main === module) {
  main();
}
