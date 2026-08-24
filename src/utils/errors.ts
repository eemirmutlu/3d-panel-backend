/**
 * src/utils/errors.ts
 *
 * Custom error hierarchy.
 *
 * All application errors extend AppError, which carries:
 *  - statusCode: HTTP status to respond with
 *  - code:       Machine-readable error identifier (used in responses)
 *  - isOperational: Distinguishes expected errors from programming bugs.
 *                   Operational errors are shown to clients; unexpected errors
 *                   log stack traces and return a generic 500.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Maintains proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── 400 Bad Request ────────────────────────────────────────────────────────

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', code = 'BAD_REQUEST') {
    super(message, 400, code);
  }
}

// ─── 401 Unauthorized ───────────────────────────────────────────────────────

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', code = 'UNAUTHENTICATED') {
    super(message, 401, code);
  }
}

// ─── 403 Forbidden ──────────────────────────────────────────────────────────

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

// ─── 404 Not Found ──────────────────────────────────────────────────────────

export class NotFoundError extends AppError {
  constructor(resource = 'Resource', code = 'NOT_FOUND') {
    super(`${resource} not found`, 404, code);
  }
}

// ─── 409 Conflict ───────────────────────────────────────────────────────────

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', code = 'CONFLICT') {
    super(message, 409, code);
  }
}

// ─── 422 Unprocessable Entity ───────────────────────────────────────────────

export class ValidationError extends AppError {
  public readonly errors: unknown[];

  constructor(message = 'Validation failed', errors: unknown[] = [], code = 'VALIDATION_ERROR') {
    super(message, 422, code);
    this.errors = errors;
  }
}

// ─── 500 Internal Server Error ──────────────────────────────────────────────

export class InternalError extends AppError {
  constructor(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    // isOperational = false → this will be treated as a programmer error
    super(message, 500, code, false);
  }
}

// ─── Type Guard ─────────────────────────────────────────────────────────────

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
