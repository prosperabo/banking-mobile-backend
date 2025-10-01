export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  response: {
    customer_oauth_token: string;
    expiration_timestamp: string;
    customer_refresh_token: string;
    refresh_expiration_timestamp: string;
    client_state_ret: number;
  };
  err: string | null;
}
