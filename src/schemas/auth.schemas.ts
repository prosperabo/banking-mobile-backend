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

export interface RegisterByEmailRequest {
  email: string;
}

/**
 * Data required for creating account in 123 Backoffice
 */
export interface BackofficeCreateAccountData {
  device_id: string;
  email: string;
  password: string;
  phone: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  secondLastName?: string;
  gender?: string | number;
  rfc?: string;
  postalCode?: string;
  countryCode?: string;
}

/**
 * Response from 123 Backoffice account creation
 */
export interface BackofficeAccountResponse {
  id: string;
  email: string;
  mobile: number;
  first_name: string;
  last_name: string;
  second_last_name: string;
  zipcode: string;
  oauth_token: string;
  refresh_token: string;
  private_key: string;
  ewallet_id: number;
  ewallet_status: number;
  gender: number;
  rfc: string;
  gender_string: string;
  account_level?: number;
  account_status?: number;
  account_status_string?: string;
  address?: string;
  address_document_back?: string;
  address_document_back_url?: string;
  address_document_front?: string;
  address_document_front_url?: string;
  address_document_type?: number;
  are_account_resources_of_user?: boolean;
  business_name?: string;
  business_purpose?: string;
  clabe?: string;
  city?: string;
  colony?: string;
  constitution_date?: string;
  correspondence_address?: string;
  country_of_birth?: string;
  date_of_birth?: string;
  ecommerce_id?: number;
  exterior?: string;
  identification_document_back?: string;
  identification_document_back_url?: string;
  identification_document_front?: string;
  identification_document_front_url?: string;
  identification_document_type?: number;
  interior?: string;
  is_business?: boolean;
  mobile_country_code?: string;
  nationality_id?: number;
  occupation_id?: number;
  person_type?: number;
  risk_level?: number;
  society_type?: number;
  selfie?: string;
  selfie_url?: string;
  state_id?: number;
  street?: string;
  telephone?: string;
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
