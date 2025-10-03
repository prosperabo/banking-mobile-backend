export interface ApiResponse<T> {
  text: string;
  timestamp: string;
  endpoint: string;
  error: object | null;
  payload: T;
}
