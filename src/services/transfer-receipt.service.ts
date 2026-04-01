import { Prisma, TransferReceiptType } from '@prisma/client';

import {
  InternalTransferReceipt,
  SpeiCashoutReceipt,
} from '@/schemas/transfer.schemas';
import { TransferReceiptRepository } from '@/repositories/transferReceipt.repository';
import { BackofficeService } from './customer.backoffice.service';
import { UserRepository } from '@/repositories/user.repository';
import { buildFullName } from '@/utils/buildFullName';
import {
  maskClabe,
  RECEIPT_TIMEZONE_LABEL,
} from '@/utils/transfer-receipt.utils';
import { InternalServerError } from '@/shared/errors';

export class TransferReceiptService {
  static async createInternalTransferReceipt(params: {
    userId: number;
    senderCustomerId: number;
    recipientUserId: number;
    recipientCustomerId: number;
    amount: number;
  }): Promise<InternalTransferReceipt> {
    const generatedAt = new Date();
    const [senderName, receiverName] = await Promise.all([
      this.resolveUserDisplayName(params.senderCustomerId, params.userId),
      this.resolveUserDisplayName(
        params.recipientCustomerId,
        params.recipientUserId
      ),
    ]);

    const receipt: InternalTransferReceipt = {
      receiptType: 'internal_transfer',
      title: 'Comprobante de transferencia interna',
      dateTime: generatedAt.toISOString(),
      timezone: RECEIPT_TIMEZONE_LABEL,
      amount: params.amount,
      senderName,
      receiverName,
    };

    await this.persistReceipt(
      params.userId,
      TransferReceiptType.INTERNAL_TRANSFER,
      receipt
    );

    return receipt;
  }

  static async createSpeiCashoutReceipt(params: {
    userId: number;
    senderCustomerId: number;
    receiverName: string;
    entityName: string;
    clabe: string;
    amount: number;
  }): Promise<SpeiCashoutReceipt> {
    const generatedAt = new Date();
    const senderName = await this.resolveUserDisplayName(
      params.senderCustomerId,
      params.userId
    );

    const receipt: SpeiCashoutReceipt = {
      receiptType: 'spei_cashout',
      title: 'Comprobante de transferencia externa',
      dateTime: generatedAt.toISOString(),
      timezone: RECEIPT_TIMEZONE_LABEL,
      amount: params.amount,
      senderName,
      receiverName: params.receiverName,
      entityName: params.entityName,
      receiverClabeMasked: maskClabe(params.clabe),
    };

    await this.persistReceipt(
      params.userId,
      TransferReceiptType.SPEI_CASHOUT,
      receipt
    );

    return receipt;
  }

  private static async persistReceipt(
    userId: number,
    type: TransferReceiptType,
    receipt: InternalTransferReceipt | SpeiCashoutReceipt
  ) {
    await TransferReceiptRepository.create({
      userId,
      type,
      transferData: receipt as unknown as Prisma.InputJsonObject,
    });
  }

  private static async resolveUserDisplayName(
    customerId: number,
    userId: number
  ): Promise<string> {
    try {
      const userInfo = await BackofficeService.getUserInfo(customerId);
      const fullName = buildFullName({
        first_name: userInfo.rs.first_name,
        middle_name: userInfo.rs.middle_name,
        last_name: userInfo.rs.last_name,
        second_last_name: userInfo.rs.second_last_name,
      });

      if (fullName) {
        return fullName;
      }
    } catch {
      // Fallback to local user data below
    }

    const localUser = await UserRepository.findById(userId);
    if (!localUser) {
      throw new InternalServerError('Unable to generate transfer receipt');
    }

    const localFullName =
      localUser.completeName ||
      [localUser.firstName, localUser.lastName, localUser.secondLastName]
        .filter(part => Boolean(part && part.trim()))
        .join(' ');

    if (!localFullName) {
      throw new InternalServerError('Unable to generate transfer receipt');
    }

    return localFullName;
  }
}
