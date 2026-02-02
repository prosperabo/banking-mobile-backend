import { db } from '@/config/prisma';
import type {
  UserCreateData,
  UserWithAuthState,
  User,
  UserCreate,
  UserUpdate,
} from '@/schemas';

export class UserRepository {
  /**
   * Find user by email address
   */
  static async findByEmail(email: string): Promise<User | null> {
    return await db.users.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by ID
   */
  static async findById(id: number): Promise<User | null> {
    return await db.users.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by email including backoffice auth state
   */
  static async findByEmailWithAuthState(
    email: string
  ): Promise<UserWithAuthState | null> {
    return await db.users.findUnique({
      where: { email },
      include: {
        BackofficeAuthState: true,
      },
    });
  }

  /**
   * Update user data
   */
  static async updateUser(id: number, data: UserUpdate): Promise<User> {
    return await db.users.update({
      where: { id },
      data,
    });
  }

  /**
   * Create new user with complete data
   */
  static async create(data: UserCreate): Promise<User> {
    return await db.users.create({
      data,
    });
  }

  /**
   * Create user from registration data with defaults
   */
  static async createFromRegistration(userData: UserCreateData): Promise<User> {
    return await db.users.create({
      data: {
        email: userData.email,
        password: userData.password,
        completeName: userData.completeName,
        phone: userData.phone,
        gender: userData.gender,
        birthDate: userData.birthDate,
        birthCountry: userData.birthCountry,
        curp: userData.curp,
        postalCode: userData.postalCode,
        state: userData.state,
        country: userData.country,
        municipality: userData.municipality,
        street: userData.street,
        colony: userData.colony,
        externalNumber: userData.externalNumber,
        internalNumber: userData.internalNumber,
      },
    });
  }

  static async findByAlias(alias: string): Promise<Users | null> {
    return await db.users.findUnique({
      where: { alias },
    });
  }
}
