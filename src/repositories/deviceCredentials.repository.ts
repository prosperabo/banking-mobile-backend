import { db } from '@/config/prisma';
import { Prisma } from '@prisma/client';

export class DeviceCredentialsRepository {
  static upsertCredential(params: {
    userId: number;
    deviceId: string;
    publicKeyJson: Prisma.InputJsonValue;
    algorithm: string;
  }) {
    return db.deviceCredentials.upsert({
      where: { device_id: params.deviceId },
      create: {
        user_id: params.userId,
        device_id: params.deviceId,
        public_key_json: params.publicKeyJson,
        algorithm: params.algorithm,
        revoked_at: null,
      },
      update: {
        user_id: params.userId,
        public_key_json: params.publicKeyJson,
        algorithm: params.algorithm,
        revoked_at: null,
      },
    });
  }

  static findActiveByDeviceId(deviceId: string) {
    return db.deviceCredentials.findFirst({
      where: { device_id: deviceId, revoked_at: null },
    });
  }

  static touchLastUsed(deviceId: string) {
    return db.deviceCredentials.update({
      where: { device_id: deviceId },
      data: { last_used_at: new Date() },
    });
  }
}
