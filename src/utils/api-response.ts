/**
 * src/utils/api-response.ts
 *
 * Standardised API response helpers.
 * All endpoints must use these helpers so every response follows
 * the same shape — clients can always depend on { success, data, message }.
 */

import { type Response } from 'express';

// ─── Response Shapes ────────────────────────────────────────────────────────

export interface SuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: unknown;
  };
}

export interface ValidationErrorResponse {
  success: false;
  message: string;
  errors: unknown[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Sends a successful JSON response.
 *
 * @param res     Express Response object
 * @param data    Response payload
 * @param message Human-readable message
 * @param status  HTTP status code (default: 200)
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  status = 200,
): void {
  const body: SuccessResponse<T> = { success: true, message, data };
  res.status(status).json(body);
}

/**
 * Sends a created (201) JSON response.
 */
export function sendCreated<T>(res: Response, data: T, message = 'Created successfully'): void {
  sendSuccess(res, data, message, 201);
}

/**
 * Sends an error JSON response.
 *
 * @param res     Express Response object
 * @param message Human-readable error message
 * @param code    Machine-readable error code
 * @param status  HTTP status code (default: 500)
 * @param details Additional error context (only in non-production)
 */
export function sendError(
  res: Response,
  message: string,
  code: string,
  status = 500,
  details?: unknown,
): void {
  const body: ErrorResponse = {
    success: false,
    message,
    error: {
      code,
      ...(details !== undefined && { details }),
    },
  };
  res.status(status).json(body);
}

/**
 * Sends a validation error JSON response (422).
 */
export function sendValidationError(
  res: Response,
  errors: unknown[],
  message = 'Validation failed',
): void {
  const body: ValidationErrorResponse = { success: false, message, errors };
  res.status(422).json(body);
}
