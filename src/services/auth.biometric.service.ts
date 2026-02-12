import { ulid } from 'ulid';
import { Prisma } from '@prisma/client';

import {
  BiometricEnrollRequest,
  BiometricEnrollResponse,
  BiometricChallengeRequest,
  BiometricChallengeResponse,
  BiometricVerifyRequest,
} from '@/schemas';

import { DeviceCredentialsRepository } from '@/repositories/deviceCredentials.repository';
import { LoginChallengesRepository } from '@/repositories/loginChallenges.repository';
import { UnauthorizedError, NotFoundError } from '@/shared/errors';
import { buildLogger } from '@/utils';
import { randomBase64Url, verifyEs256JwkSignature } from '@/utils/jwk';

const logger = buildLogger('BiometricAuthService');

export class BiometricAuthService {
  static async enroll(
    userId: number,
    dto: BiometricEnrollRequest
  ): Promise<BiometricEnrollResponse> {
    const algorithm = dto.algorithm ?? 'ES256';

    await DeviceCredentialsRepository.upsertCredential({
      userId,
      deviceId: dto.deviceId,
      publicKeyJson: dto.publicKey as Prisma.InputJsonValue,
      algorithm,
    });

    return { ok: true };
  }

  static async createChallenge(
    dto: BiometricChallengeRequest
  ): Promise<BiometricChallengeResponse> {
    const cred = await DeviceCredentialsRepository.findActiveByDeviceId(
      dto.deviceId
    );
    if (!cred) throw new NotFoundError('Device not enrolled');

    const challengeId = ulid();
    const challenge = randomBase64Url(32);
    const expiresAt = new Date(Date.now() + 90_000);

    await LoginChallengesRepository.createChallenge({
      id: challengeId,
      deviceId: dto.deviceId,
      challenge,
      expiresAt,
    });

    return {
      challengeId,
      challenge,
      expiresIn: 90,
      algorithm: cred.algorithm,
    };
  }

  static async verifyChallenge(
    dto: BiometricVerifyRequest
  ): Promise<{ userId: number }> {
    const ch = await LoginChallengesRepository.findById(dto.challengeId);
    if (!ch || ch.device_id !== dto.deviceId) {
      throw new UnauthorizedError('Invalid challenge');
    }
    if (ch.used_at) throw new UnauthorizedError('Challenge already used');
    if (Date.now() > ch.expires_at.getTime()) {
      throw new UnauthorizedError('Challenge expired');
    }

    const cred = await DeviceCredentialsRepository.findActiveByDeviceId(
      dto.deviceId
    );
    if (!cred) throw new UnauthorizedError('Device not enrolled');

    const ok = verifyEs256JwkSignature({
      publicKeyJwk: cred.public_key_json,
      message: ch.challenge,
      signatureB64Url: dto.signature,
    });

    if (!ok) throw new UnauthorizedError('Invalid signature');

    await LoginChallengesRepository.markUsed(dto.challengeId);
    await DeviceCredentialsRepository.touchLastUsed(dto.deviceId);

    logger.info('Biometric verification OK', {
      userId: cred.user_id,
      deviceId: dto.deviceId,
    });

    return { userId: cred.user_id };
  }
}
