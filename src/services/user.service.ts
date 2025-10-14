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

    return {
      id: user.id,
      email: user.email,
      completeName: user.completeName,
      phone: user.phone || undefined,
      gender: user.gender,
      birthDate: user.birthDate.toISOString(),
      birthCountry: user.birthCountry,
      curp: user.curp,
      postalCode: user.postalCode,
      state: user.state,
      country: user.country,
      municipality: user.municipality,
      street: user.street,
      colony: user.colony,
      externalNumber: user.externalNumber,
      internalNumber: user.internalNumber,
      occupation: user.occupation || undefined,
      sector: user.sector || undefined,
      mainActivity: user.mainActivity || undefined,
      monthlyIncome: user.monthlyIncome || undefined,
      monthlyOutcome: user.monthlyOutcome || undefined,
      hasOtherCreditCards: user.hasOtherCreditCards || undefined,
      universityRegistration: user.universityRegistration || undefined,
      creditLimit: user.creditLimit || undefined,
      interestRate: user.interestRate || undefined,
      paymentDates: user.paymentDates || undefined,
      initialDeposit: user.initialDeposit || undefined,
      rfc: user.rfc || undefined,
      createdAt: user.createdAt.toISOString(),
    };
  }

  static async updateUser(
    userId: number,
    updateData: UpdateUserRequest
  ): Promise<UpdateUserResponse> {
    logger.info(`Updating user ${userId}`, { updateData });

    const user = await UserRepository.findById(userId);
    if (!user) {
      logger.error(`User ${userId} not found`);
      throw new Error('Usuario no encontrado');
    }

    await UserRepository.updateUser(userId, updateData);

    logger.info(`User ${userId} updated successfully`);

    return {
      id: userId,
      message: 'Usuario actualizado correctamente',
    };
  }
}
