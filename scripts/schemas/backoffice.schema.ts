/**
 * @fileoverview Type definitions for 123 Backoffice API integration
 * @description Contains interfaces for backoffice account data and API responses
 */

import type { Gender } from '@prisma/client';

/**
 * Interface for creating a new backoffice customer profile
 * Abstracts Prisma's BackofficeCustomerProfileCreateInput
 */
export interface CustomerProfileCreateData {
  Users: { connect: { id: number } };
  account_level: number;
  account_status: number;
  account_status_string: string;
  address: string;
  address_document_back: string;
  address_document_back_url: string;
  address_document_front: string;
  address_document_front_url: string;
  address_document_type: number;
  are_account_resources_of_user: boolean;
  business_name: string;
  business_purpose: string;
  ciabe: string;
  city: string;
  colony: string;
  constitution_date: string;
  correspondence_address: string;
  country_of_birth: string;
  date_of_birth: string;
  ecommerce_id: number;
  email: string;
  exterior: string;
  first_name: string;
  gender: number;
  gender_string: string;
  external_customer_id: number;
  identification_document_back: string;
  identification_document_back_url: string;
  identification_document_front: string;
  identification_document_front_url: string;
  identification_document_type: number;
  interior: string;
  is_business: boolean;
  last_name: string;
  mobile: string | null;
  mobile_country_code: string;
  nationality_id: number;
  oauth_token: string;
  occupation_id: number;
  person_type: number;
  private_key: string;
  rfc: string;
  refresh_token: string;
  risk_level: number;
  second_last_name: string;
  society_type: number;
  selfie: string;
  selfie_url: string;
  state_id: number;
  street: string;
  telephone: string;
  zipcode: string;
  ewallet_id: number;
  ewallet_status: number;
}

/**
 * Interface for updating an existing backoffice customer profile
 * Abstracts Prisma's BackofficeCustomerProfileUpdateInput
 */
export interface CustomerProfileUpdateData {
  account_level?: number;
  account_status?: number;
  account_status_string?: string;
  external_customer_id?: number;
  oauth_token?: string;
  refresh_token?: string;
  private_key?: string;
  ewallet_id?: number;
  ewallet_status?: number;
  updatedAt?: Date;
}

/**
 * Interface for creating a new backoffice authentication state
 * Abstracts Prisma's BackofficeAuthStateCreateInput
 */
export interface AuthenticationStateCreateData {
  Users: { connect: { id: number } };
  clientState: number;
  deviceId: string;
  privateKey: string;
  refreshToken: string;
  extraLoginData: string;
  lastCustomerOauthToken: string;
  oauthExpirationTimestamp: string | null;
  refreshExpirationTimestamp: string | null;
  externalCustomerId: number;
  ewalletId: number;
  defaultBalanceId: number | null;
  lastCardId: number | null;
}

/**
 * Interface for updating an existing backoffice authentication state
 * Abstracts Prisma's BackofficeAuthStateUpdateInput
 */
export interface AuthenticationStateUpdateData {
  privateKey?: string;
  refreshToken?: string;
  lastCustomerOauthToken?: string;
  externalCustomerId?: number;
  ewalletId?: number;
  updatedAt?: Date;
}

/**
 * Interface for user data returned from repository queries
 * Abstracts Prisma's complex select types
 */
export interface UserMigrationData {
  id: number;
  email: string;
  password: string;
  phone: string;
  completeName: string;
  gender: Gender;
  birthDate: Date;
  birthCountry: string;
  curp: string;
  postalCode: string;
  state: string;
  country: string;
  municipality: string;
  street: string;
  colony: string;
  externalNumber: string;
  internalNumber: string;
  rfc: string;
}

/**
 * Interface for backoffice customer profile data returned from repository
 * Abstracts Prisma's BackofficeCustomerProfileGetPayload
 */
export interface CustomerProfileData {
  id: number;
  userId: number;
  external_customer_id: number;
  account_level: number;
  account_status: number;
  oauth_token: string;
  private_key: string;
  refresh_token: string;
  ewallet_id: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents account data structure from the 123 Backoffice API
 * Contains user profile, authentication, and e-wallet information
 */
export interface BackofficeAccountData {
  account_level: number;
  account_status: number;
  account_status_string: string;
  address: string;
  address_document_back: string;
  address_document_back_url: string;
  address_document_front: string;
  address_document_front_url: string;
  address_document_type: number;
  are_account_resources_of_user: boolean;
  business_name: string;
  business_purpose: string;
  ciabe: string;
  city: string;
  colony: string;
  constitution_date: string;
  correspondence_address: string;
  country_of_birth: string;
  date_of_birth: string;
  ecommerce_id: number;
  email: string;
  exterior: string;
  first_name: string;
  gender: number;
  gender_string: string;
  id: number;
  identification_document_back: string;
  identification_document_back_url: string;
  identification_document_front: string;
  identification_document_front_url: string;
  identification_document_type: number;
  interior: string;
  is_business: boolean;
  last_name: string;
  mobile: string;
  mobile_country_code: string;
  nationality_id: number;
  oauth_token: string;
  occupation_id: number;
  person_type: number;
  private_key: string;
  rfc: string;
  refresh_token: string;
  risk_level: number;
  second_last_name: string;
  society_type: number;
  selfie: string;
  selfie_url: string;
  state_id: number;
  street: string;
  telephone: string;
  zipcode: string;
  ewallet_id: number;
  ewallet_status: number;
}

/**
 * Response structure from the backoffice account creation API
 * Contains success/failure data and error information
 */
export interface CreateAccountResponse {
  /** Success response with account data */
  ss?: BackofficeAccountData;
  /** Result response with account data */
  rs?: BackofficeAccountData;
  /** Error message, null if successful */
  err: null | string;
}
