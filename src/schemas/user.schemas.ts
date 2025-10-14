export interface GetUserResponse {
  id: number;
  email: string;
  completeName: string;
  phone?: string;
  gender: string;
  birthDate: string;
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
  occupation?: string;
  sector?: string;
  mainActivity?: string;
  monthlyIncome?: number;
  monthlyOutcome?: number;
  hasOtherCreditCards?: boolean;
  universityRegistration?: number;
  creditLimit?: number;
  interestRate?: number;
  paymentDates?: string;
  initialDeposit?: number;
  rfc?: string;
  createdAt: string;
}

export interface UpdateUserRequest {
  completeName?: string;
  phone?: string;
  birthCountry?: string;
  postalCode?: string;
  state?: string;
  country?: string;
  municipality?: string;
  street?: string;
  colony?: string;
  externalNumber?: string;
  internalNumber?: string;
  occupation?: string;
  sector?: string;
  mainActivity?: string;
  monthlyIncome?: number;
  monthlyOutcome?: number;
  hasOtherCreditCards?: boolean;
  universityRegistration?: number;
  creditLimit?: number;
  interestRate?: number;
  paymentDates?: string;
  initialDeposit?: number;
  rfc?: string;
}

export interface UpdateUserResponse {
  id: number;
  message: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  id: number;
  message: string;
}
