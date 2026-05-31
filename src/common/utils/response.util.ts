import { ResponseStatus } from "../enums/response-status.enum";

export interface ApiResponse<T = unknown> {
  status: ResponseStatus;
  data: T;
  message?: string;
  timestamp: string;
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    status: ResponseStatus.SUCCESS,
    data,
    ...(message && { message }),
    timestamp: new Date().toISOString(),
  };
}

export function errorResponse(
  message: string,
  data: unknown = null,
): ApiResponse {
  return {
    status: ResponseStatus.ERROR,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}
