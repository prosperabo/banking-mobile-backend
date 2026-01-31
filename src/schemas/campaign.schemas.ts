import { ApiResponse } from './api.backoffice.schemas';

// Backoffice API schemas
export interface AssignCustomersParams {
  program_code: string;
  customer_ids: number[];
}

export interface AssignCustomersResponsePayload {
  program_id: number;
  new_assigned_customers: number[];
  update_assignments_customers: number[];
}

export type AssignCustomersResponse =
  ApiResponse<AssignCustomersResponsePayload>;

// Application API schemas
export interface AssignUsersToProgram {
  program_code: string;
  customer_ids: number[];
}

export interface AssignUsersToProgramResponse {
  program_id: number;
  assigned_customers: number[];
  new_assigned_customers: number[];
  update_assignments_customers: number[];
}
