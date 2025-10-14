import { db } from '@/config/prisma';
import { Users, BackofficeAuthState } from '@prisma/client';

export class UserRepository {
  static async findByEmail(email: string): Promise<Users | null> {
    return await db.users.findUnique({
      where: { email },
    });
  }

  static async findById(id: number): Promise<Users | null> {
    return await db.users.findUnique({
      where: { id },
    });
  }

  static async findByEmailWithAuthState(email: string): Promise<
    | (Users & {
        BackofficeAuthState: BackofficeAuthState | null;
      })
    | null
  > {
    return await db.users.findUnique({
      where: { email },
      include: {
        BackofficeAuthState: true,
      },
    });
  }

  static async updateUser(id: number, data: Partial<Users>): Promise<Users> {
    return await db.users.update({
      where: { id },
      data,
    });
  }
}
