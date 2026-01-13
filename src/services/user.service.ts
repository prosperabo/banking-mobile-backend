import { UserRepository } from '@/repositories/user.repository';
import {
  GetUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  AddAliasRequest,
  AddAliasResponse,
} from '@/schemas/user.schemas';
import { buildLogger } from '@/utils';

const logger = buildLogger('UserService');

export class UserService {
  static async getUserById(userId: number): Promise<GetUserResponse> {
    logger.info(`Fetching user ${userId}`);

    const user = await UserRepository.findById(userId);
    if (!user) {
      logger.error(`User ${userId} not found`);
      throw new Error('User not found');
    }

    const {
      id,
      email,
      completeName,
      phone,
      gender,
      birthDate,
      birthCountry,
      curp,
      postalCode,
      state,
      country,
      municipality,
      street,
      colony,
      externalNumber,
      internalNumber,
      occupation,
      sector,
      mainActivity,
      monthlyIncome,
      monthlyOutcome,
      hasOtherCreditCards,
      universityRegistration,
      creditLimit,
      interestRate,
      paymentDates,
      initialDeposit,
      rfc,
      createdAt,
    } = user;

    return {
      id,
      email,
      completeName,
      phone,
      gender,
      birthDate: birthDate.toISOString(),
      birthCountry,
      curp,
      postalCode,
      state,
      country,
      municipality,
      street,
      colony,
      externalNumber,
      internalNumber,
      occupation,
      sector,
      mainActivity,
      monthlyIncome,
      monthlyOutcome,
      hasOtherCreditCards,
      universityRegistration,
      creditLimit,
      interestRate,
      paymentDates,
      initialDeposit,
      rfc,
      createdAt: createdAt.toISOString(),
    };
  }

  static async updateUser(
    userId: number,
    updateData: UpdateUserRequest
  ): Promise<UpdateUserResponse> {
    logger.info(`Updating user ${userId}`, { updateData });

    await UserRepository.updateUser(userId, updateData);

    logger.info(`User ${userId} updated successfully`);

    return {
      id: userId,
      message: 'User updated successfully',
    };
  }

  static async changePassword(
    userId: number,
    passwordData: ChangePasswordRequest
  ): Promise<ChangePasswordResponse> {
    logger.info(`Changing password for user ${userId}`);

    const user = await UserRepository.findById(userId);
    if (!user) {
      logger.error(`User ${userId} not found`);
      throw new Error('User not found');
    }

    if (passwordData.currentPassword !== user.password) {
      logger.warn(`Invalid current password for user ${userId}`);
      throw new Error('Current password is incorrect');
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      logger.warn(`New password is same as current for user ${userId}`);
      throw new Error('New password must be different from current password');
    }

    await UserRepository.updateUser(userId, {
      password: passwordData.newPassword,
    });

    logger.info(`Password changed successfully for user ${userId}`);

    return {
      id: userId,
      message: 'Password changed successfully',
    };
  }

  static async addAlias(
    userId: number,
    aliasData: AddAliasRequest
  ): Promise<AddAliasResponse> {
    logger.info(`Adding alias for user ${userId}`, { alias: aliasData.alias });

    const existingUser = await UserRepository.findByAlias(aliasData.alias);
    if (existingUser) {
      logger.warn(`Alias ${aliasData.alias} already exists`);
      throw new Error('This alias is already in use');
    }

    const updatedUser = await UserRepository.updateUser(userId, {
      alias: aliasData.alias,
    });

    logger.info(`Alias added successfully for user ${userId}`);

    return {
      id: userId,
      alias: updatedUser.alias || '',
      message: 'Alias added successfully',
    };
  }
}
