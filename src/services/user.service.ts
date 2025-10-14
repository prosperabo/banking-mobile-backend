import { UserRepository } from '@/repositories/user.repository';
import {
  GetUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
} from '@/schemas/user.schemas';
import { buildLogger } from '@/utils';

const logger = buildLogger('UserService');

export class UserService {
  static async getUserById(userId: number): Promise<GetUserResponse> {
    logger.info(`Fetching user ${userId}`);

    const user = await UserRepository.findById(userId);
    if (!user) {
      logger.error(`User ${userId} not found`);
      throw new Error('Usuario no encontrado');
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
      message: 'Usuario actualizado correctamente',
    };
  }
}
