import crypto from 'crypto';
import { db, config } from '@/config';
import { buildLogger } from '@/shared/utils';

const logger = buildLogger('webhooks-service');

export type BackofficeEventPayload = {
  event_id: string;
  type: string;
  occurred_at: string;
  data: any;
};

export class WebhooksService {
  static verifySignature(
    rawBody: Buffer,
    signature: string,
    timestamp: string
  ): boolean {
    try {
      if (!config.webhookSecret) return false;
      const hmac = crypto.createHmac('sha256', config.webhookSecret);
      hmac.update(timestamp);
      hmac.update('.');
      hmac.update(rawBody);
      const digest = hmac.digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(digest)
      );
    } catch (e) {
      logger.error('verifySignature failed', {
        error: e instanceof Error ? e.message : 'unknown',
      });
      return false;
    }
  }

  static isFresh(timestamp: string): boolean {
    const tolerance = config.webhookToleranceSeconds ?? 300;
    const now = Math.floor(Date.now() / 1000);
    const ts = Math.floor(new Date(timestamp).getTime() / 1000);
    return Math.abs(now - ts) <= tolerance;
  }

  static async alreadyProcessed(eventId: string): Promise<boolean> {
    const found = await db.incomingEvent.findUnique({ where: { eventId } });
    return !!found;
  }

  static async recordEvent(
    eventId: string,
    type: string,
    payload: unknown,
    status: 'RECEIVED' | 'PROCESSED' | 'ERROR',
    error?: string
  ) {
    const existing = await db.incomingEvent.findUnique({ where: { eventId } });
    if (!existing) {
      return db.incomingEvent.create({
        data: {
          eventId,
          type,
          payload: payload as any,
          status,
          processedAt: status !== 'RECEIVED' ? new Date() : null,
          error: error ?? null,
        },
      });
    }
    return db.incomingEvent.update({
      where: { eventId },
      data: {
        status,
        processedAt: status !== 'RECEIVED' ? new Date() : existing.processedAt,
        error: error ?? existing.error,
      },
    });
  }

  static async processEvent(evt: BackofficeEventPayload) {
    const { type, data } = evt;
    logger.info('Processing event', { type, event_id: evt.event_id });

    switch (type) {
      case 'card.activated':
        await this.handleCardActivated(data);
        break;
      case 'card.stopped':
        await this.handleCardStatus(data, 'BLOCKED');
        break;
      case 'card.unstopped':
        await this.handleCardStatus(data, 'ACTIVE');
        break;
      case 'wallet.topup.completed':
        await this.handleTopupCompleted(data);
        break;
      case 'debit.deduct.completed':
        await this.handleDeductCompleted(data);
        break;
      default:
        logger.warn('Unhandled event type', { type });
    }
  }

  private static async handleCardActivated(data: any) {
    const {
      user_id,
      card_id,
      card_identifier,
      card_type,
      masked_number,
      expiry_date,
    } = data;
    if (!user_id || !card_id)
      throw new Error('Invalid payload for card.activated');

    const existing = await db.cards.findFirst({
      where: { prosperaCardId: String(card_id) },
    });

    if (existing) {
      await db.cards.update({
        where: { id: existing.id },
        data: {
          userId: Number(user_id),
          cardIdentifier: card_identifier ?? null,
          status: 'ACTIVE' as any,
          maskedNumber: masked_number ?? null,
          expiryDate: expiry_date ?? null,
          updatedAt: new Date(),
        },
      });
      return;
    }

    await db.cards.create({
      data: {
        userId: Number(user_id),
        prosperaCardId: String(card_id),
        cardType: (card_type === 'VIRTUAL' ? 'VIRTUAL' : 'PHYSICAL') as any,
        cardIdentifier: card_identifier ?? null,
        status: 'ACTIVE' as any,
        maskedNumber: masked_number ?? null,
        expiryDate: expiry_date ?? null,
        updatedAt: new Date(),
      },
    });
  }

  private static async handleCardStatus(
    data: any,
    status: 'ACTIVE' | 'BLOCKED'
  ) {
    const { card_id } = data;
    if (!card_id) throw new Error('Invalid payload for card status change');

    const existing = await db.cards.findFirst({
      where: { prosperaCardId: String(card_id) },
    });
    if (!existing) throw new Error('Card not found for status change');

    await db.cards.update({
      where: { id: existing.id },
      data: { status: status as any, updatedAt: new Date() },
    });
  }

  private static async handleTopupCompleted(data: any) {
    const {
      user_id,
      // balance_id,
      amount,
      external_transaction_id,
      description,
    } = data;
    if (!user_id || !amount || !external_transaction_id)
      throw new Error('Invalid payload for topup');

    await db.transactions.create({
      data: {
        userId: Number(user_id),
        cardId: null,
        type: 'TOPUP',
        amount: String(amount) as any,
        externalTransactionId: String(external_transaction_id),
        status: 'COMPLETED',
        description: description ?? null,
        prosperaReference: null,
        updatedAt: new Date(),
      },
    });
  }

  private static async handleDeductCompleted(data: any) {
    const { user_id, card_id, amount, prospera_reference, narrative } = data;
    if (!user_id || !card_id || !amount)
      throw new Error('Invalid payload for deduct');

    await db.transactions.create({
      data: {
        userId: Number(user_id),
        cardId: Number(card_id),
        type: 'DEDUCT',
        amount: String(amount) as any,
        externalTransactionId: null,
        status: 'COMPLETED',
        description: narrative ?? null,
        prosperaReference: prospera_reference ?? null,
        updatedAt: new Date(),
      },
    });
  }
}
