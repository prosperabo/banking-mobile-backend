export type BiometricEnrollRequest = {
  deviceId: string;
  publicKey: unknown;
  algorithm?: 'ES256';
  deviceName?: string;
  platform?: 'ios' | 'android';
  appVersion?: string;
};

export type BiometricEnrollResponse = { ok: true };

export type BiometricChallengeRequest = { deviceId: string };

export type BiometricChallengeResponse = {
  challengeId: string;
  challenge: string;
  expiresIn: number;
  algorithm: string;
};

export type BiometricVerifyRequest = {
  deviceId: string;
  challengeId: string;
  signature: string;
};

export type LoginMethod = 'password' | 'biometric';
