import type { Gender } from '@prisma/client';

/**
 * Request payload for user login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Response payload for successful authentication
 */
export interface LoginResponse {
  token: string;
}

/**
 * Request payload for user registration
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  secondLastName: string;
  curp: string;
  birthDate: Date;
  gender: Gender;
  nationality: string;
  countryCode: string;
  phone: string;
  rfc?: string;
  street: string;
  externalNumber: string;
  internalNumber: string;
  colony: string;
  municipality: string;
  state: string;
  monthlyIncomeRange: string;
  isUniversityStudent: boolean;
  universityRegistration?: number;
  universityProfilePhotoLink?: string;
  documentScan?: string;
  academicInfo?: {
    actualSemester?: number;
    academicArea?: string;
    scholarshipPercentageRange?: string;
  };
}

/**
 * Data required for creating account in 123 Backoffice
 */
export interface BackofficeCreateAccountData {
  email: string;
  password: string;
  completeName: string;
  phone: string;
}

/**
 * Response from 123 Backoffice account creation
 */
export interface BackofficeAccountResponse {
  id: string;
  email: string;
  mobile: string;
  oauth_token: string;
  refresh_token: string;
  private_key: string;
  ewallet_id: string;
  [key: string]: unknown;
}

/**
 * Error response from 123 Backoffice
 */
export interface BackofficeErrorResponse {
  err: string;
}

/**
 * Union type for 123 Backoffice API responses
 */
export type BackofficeApiResponse =
  | BackofficeAccountResponse
  | BackofficeErrorResponse;

/**
 * Type guard to check if response is an error
 */
export function isBackofficeError(
  response: BackofficeApiResponse
): response is BackofficeErrorResponse {
  return 'err' in response;
}

/**
 * User creation data for local database
 */
export interface UserCreateData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  secondLastName: string;
  completeName: string;
  phone: string;
  gender: Gender;
  birthDate: Date;
  nationality: string;
  countryCode: string;
  curp: string;
  rfc?: string;
  postalCode?: string;
  state: string;
  country?: string;
  municipality: string;
  street: string;
  colony: string;
  externalNumber: string;
  internalNumber: string;
  monthlyIncomeRange: string;
  isUniversityStudent: boolean;
  universityRegistration?: number;
  universityProfilePhotoLink?: string;
  documentScan?: string;
}

/**
 * Academic information data for registration
 */
export interface AcademicInfoCreateData {
  userId: number;
  actualSemester?: number;
  academicArea?: string;
  scholarshipPercentageRange?: string;
}

/**
 * JWT payload structure for tokens
 */
export interface JwtPayload {
  userId: number;
  email: string;
  username: string;
  backoffice: {
    customer_oauth_token: string;
    expiration_timestamp: string;
    customer_refresh_token: string;
    refresh_expiration_timestamp: string;
    client_state_ret: number;
    customerId: number;
  };
}
