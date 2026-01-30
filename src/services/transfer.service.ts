import { UserRepository } from '@/repositories/user.repository';
import { BackofficeRepository } from '@/repositories/backoffice.repository';
import { TransferBackofficeService } from './transfer.backoffice.service';
import { buildLogger } from '@/utils';
import {
  AccountInfoResponse,
  TransferRequest,
  UserQRResponse,
} from '@/schemas/transfer.schemas';
import { BadRequestError } from '@/shared/errors';
import { BackofficeService } from './customer.backoffice.service';

const logger = buildLogger('TransferService');

type QueryType = 'email' | 'alias';

export class TransferService {
  /**
   * Transfer funds by target (email or alias)
   */
  static async transfer(
    userId: number,
    transferData: TransferRequest,
    customerToken: string,
    customerId: number,
    queryType: QueryType = 'email'
  ) {
    logger.info(`Transferring funds to ${queryType} ${transferData.target}`, {
      userId,
      amount: transferData.amount,
    });

    const queryMap = {
      email: (target: string) => UserRepository.findByEmail(target),
      alias: (target: string) => UserRepository.findByAlias(target),
    };

    const recipientUser = await queryMap[queryType](transferData.target);
    if (!recipientUser) {
      logger.error(`User with ${queryType} ${transferData.target} not found`);
      throw new BadRequestError('Recipient not found');
    }

    if (recipientUser.id === userId) {
      logger.warn(`User ${userId} attempted self-transfer`);
      throw new BadRequestError('Cannot transfer to yourself');
    }

    const recipientProfile = await BackofficeRepository.findProfileByUserId(
      recipientUser.id
    );
    if (!recipientProfile || !recipientProfile.external_customer_id) {
      logger.error(
        `No external_customer_id found for recipient ${recipientUser.id}`
      );
      throw new BadRequestError('Recipient wallet not found');
    }

    const transferRequest = {
      amount: transferData.amount,
      sourceCustomerID: customerId,
      targetID: recipientProfile.external_customer_id,
      description: transferData.description,
    };

    const response = await TransferBackofficeService.transfer(
      transferRequest,
      customerToken
    );

    logger.info(`Transfer to ${queryType} ${transferData.target} completed`, {
      userId,
      amount: transferData.amount,
    });

    return response.payload.transactionId;
  }

  /**
   * Get user QR code with email
   */
  static async getUserQR(userId: number): Promise<UserQRResponse> {
    logger.info(`Getting QR code for user ${userId}`);

    const user = await UserRepository.findById(userId);
    if (!user) {
      logger.error(`User ${userId} not found`);
      throw new BadRequestError('User not found');
    }

    // Generate QR code data (encoded email for mobile app to scan)
    // In production, this would generate an actual QR code image
    const qrData = {
      email: user.email,
      alias: user.alias,
      timestamp: new Date().toISOString(),
    };

    const qrCodeString = Buffer.from(JSON.stringify(qrData)).toString('base64');

    logger.info(`QR code generated for user ${userId}`);

    return {
      id: userId,
      email: user.email,
      alias: user.alias || undefined,
      qrCode: qrCodeString,
    };
  }

  static async getMyAccountInfo(
    customerToken: string
  ): Promise<AccountInfoResponse> {
    logger.info(`Getting account info`);

    const response = await BackofficeService.getSpeiClabe(customerToken);

    logger.info(`Account info retrieved successfully`, { ...response });
    return {
      clabe: '01349901093890109382',
      bankReceptor: 'Banco de Prueba S.A.',
      beneficiaryName: 'Juan Pérez Gómez',
    };
  }
}
