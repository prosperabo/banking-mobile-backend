import { RampOrderRepository } from '@/repositories/rampOrder.repository';
import { buildLogger } from '@/utils';
import { NotFoundError } from '@/shared/errors';
import { RampOrderResponse } from '@/schemas/rampOrder.schemas';

const logger = buildLogger('RampOrderService');

export class RampOrderService {
  static async findById(id: number): Promise<RampOrderResponse> {
    logger.info('findById called', { id });

    const order = await RampOrderRepository.findById(id);
    if (!order) throw new NotFoundError('Ramp order not found.');

    return {
      ...order,
      fiatAmount: order.fiatAmount?.toString() ?? null,
      cryptoAmount: order.cryptoAmount?.toString() ?? null,
    } as unknown as RampOrderResponse;
  }

  static async findByIdempotencyKey(
    idempotencyKey: string
  ): Promise<RampOrderResponse | null> {
    logger.info('findByIdempotencyKey called', { idempotencyKey });

    const order =
      await RampOrderRepository.findByIdempotencyKey(idempotencyKey);
    if (!order) return null;

    return {
      ...order,
      fiatAmount: order.fiatAmount?.toString() ?? null,
      cryptoAmount: order.cryptoAmount?.toString() ?? null,
    } as unknown as RampOrderResponse;
  }

  static async findByUserId(userId: number): Promise<RampOrderResponse[]> {
    logger.info('findByUserId called', { userId });

    const orders = await RampOrderRepository.findByUserId(userId);
    return orders.map(order => ({
      ...order,
      fiatAmount: order.fiatAmount?.toString() ?? null,
      cryptoAmount: order.cryptoAmount?.toString() ?? null,
    })) as unknown as RampOrderResponse[];
  }
}
