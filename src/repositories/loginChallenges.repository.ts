import { db } from '@/config/prisma';

export class LoginChallengesRepository {
  static createChallenge(params: {
    id: string;
    deviceId: string;
    challenge: string;
    expiresAt: Date;
  }) {
    return db.loginChallenges.create({
      data: {
        id: params.id,
        device_id: params.deviceId,
        challenge: params.challenge,
        expires_at: params.expiresAt,
      },
    });
  }

  static findById(id: string) {
    return db.loginChallenges.findUnique({ where: { id } });
  }

  static markUsed(id: string) {
    return db.loginChallenges.update({
      where: { id },
      data: { used_at: new Date() },
    });
  }
}
