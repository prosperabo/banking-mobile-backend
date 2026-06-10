import { InvestmentOperationRepository } from '@/repositories/investmentOperation.repository';
import { buildLogger } from '@/utils';
import { NotFoundError } from '@/shared/errors';
import { InvestmentOperationResponse } from '@/schemas/investmentOperation.schemas';

const logger = buildLogger('InvestmentOperationService');

export class InvestmentOperationService {
  static async findById(id: number): Promise<InvestmentOperationResponse> {
    logger.info('findById called', { id });

    const operation = await InvestmentOperationRepository.findById(id);
    if (!operation) throw new NotFoundError('Investment operation not found.');

    return {
      ...operation,
      amount: operation.amount.toString(),
    } as unknown as InvestmentOperationResponse;
  }

  static async findByUserId(
    userId: number
  ): Promise<InvestmentOperationResponse[]> {
    logger.info('findByUserId called', { userId });

    const operations = await InvestmentOperationRepository.findByUserId(userId);
    return operations.map(operation => ({
      ...operation,
      amount: operation.amount.toString(),
    })) as unknown as InvestmentOperationResponse[];
  }
}
