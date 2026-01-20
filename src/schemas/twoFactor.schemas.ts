export interface SetupTwoFactorResponse {
  qrCode: string;
  secret: string;
  issuer: string;
  account: string;
}

export interface VerifySetupRequest {
  code: string;
  secret: string;
}

export interface VerifySetupResponse {
  userId: number;
  twoFactorEnabled: boolean;
  activatedAt: string;
}

export interface VerifyLoginCodeRequest {
  code: string;
}

export interface TwoFactorStatusResponse {
  enabled: boolean;
  method?: string;
  activatedAt?: string;
}

export interface DisableTwoFactorRequest {
  password: string;
  code: string;
}

export interface DisableTwoFactorResponse {
  userId: number;
  twoFactorEnabled: boolean;
  disabledAt: string;
}

// Login response when 2FA is required
export interface LoginWith2FAResponse {
  requires2FA: true;
  tempToken: string;
  expiresIn: number;
}

// Standard login response (no 2FA)
export interface LoginResponse {
  token: string;
}

// Temp token payload
export interface TempTokenPayload {
  userId: number;
  email: string;
  type: '2fa-verification';
}
