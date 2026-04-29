import { UserRepository } from '@/repositories/user.repository';
import { BackofficeRepository } from '@/repositories/backoffice.repository';
import { TransferBackofficeService } from './transfer.backoffice.service';
import { buildLogger } from '@/utils';
import { config } from '@/config';
import {
  AccountInfoResponse,
  SpeiCashoutRequest,
  TransferOperationResponse,
  TransferRequest,
  UserQRResponse,
} from '@/schemas/transfer.schemas';
import { BadRequestError } from '@/shared/errors';
import { BackofficeService } from './customer.backoffice.service';
import { buildFullName } from '@/utils/buildFullName';
import { TransferReceiptService } from './transfer-receipt.service';
import { NotificationService } from './notification.service';

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
  ): Promise<TransferOperationResponse> {
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

    const receipt = await TransferReceiptService.createInternalTransferReceipt({
      userId,
      senderCustomerId: customerId,
      recipientUserId: recipientUser.id,
      recipientCustomerId: recipientProfile.external_customer_id,
      amount: transferData.amount,
    });

    const senderUser = await UserRepository.findById(userId);
    const formattedAmount = Number(transferData.amount).toFixed(2);
    const senderName = buildFullName({
      first_name: senderUser.firstName,
      last_name: senderUser.lastName,
      second_last_name: senderUser.secondLastName,
    });
    const recipientName = buildFullName({
      first_name: recipientUser.firstName,
      last_name: recipientUser.lastName,
      second_last_name: recipientUser.secondLastName,
    });

    await NotificationService.sendToUser(recipientUser.id, {
      title: 'Transferencia recibida',
      body: `Recibiste $${formattedAmount} MXN de ${senderName}`,
      data: { type: 'transfer', transactionId: response.payload.transactionId },
    });

    await NotificationService.sendToUser(userId, {
      title: 'Transferencia enviada',
      body: `Enviaste $${formattedAmount} MXN a ${recipientName}`,
      data: { type: 'transfer', transactionId: response.payload.transactionId },
    });

    return {
      transaction: {
        transactionId: response.payload.transactionId,
      },
      receipt,
    };
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
    customerId: number,
    customerToken: string
  ): Promise<AccountInfoResponse> {
    logger.info(`Getting account info`);

    const speiClabe = await BackofficeService.getSpeiClabe(customerToken);
    const userInfo = await BackofficeService.getUserInfo(customerId);
    const { first_name, middle_name, last_name, second_last_name } =
      userInfo.rs;

    const beneficiaryName = buildFullName({
      first_name,
      middle_name,
      last_name,
      second_last_name,
    });

    logger.info(`Account info retrieved successfully`);
    return {
      clabe: speiClabe,
      bankReceptor: 'Finco pay',
      beneficiaryName: beneficiaryName,
    };
  }

  /**
   * SPEI cashout: withdraw funds to a destination CLABE
   */
  static async speiCashout(
    userId: number,
    cashoutData: SpeiCashoutRequest,
    customerToken: string,
    customerId: number
  ): Promise<TransferOperationResponse> {
    logger.info('Processing SPEI cashout', {
      userId,
      clabe: cashoutData.clabe,
      amount: cashoutData.amount,
    });

    const response = await TransferBackofficeService.speiCashout(
      {
        clabe: cashoutData.clabe,
        amount: cashoutData.amount,
        description: cashoutData.description,
      },
      customerToken
    );

    const receipt = await TransferReceiptService.createSpeiCashoutReceipt({
      userId,
      senderCustomerId: customerId,
      receiverName: cashoutData.receiverName,
      entityName: cashoutData.entityName,
      clabe: cashoutData.clabe,
      amount: cashoutData.amount,
    });

    logger.info('SPEI cashout completed successfully', {
      userId,
      transactionId: response.payload.transactionId,
    });

    return {
      transaction: {
        transactionId: response.payload.transactionId,
      },
      receipt,
    };
  }

  /**
   * Get SPEI cashout fee
   */
  static getSpeiCashoutFee(): number {
    return config.spei.cashoutFee;
  }
}
