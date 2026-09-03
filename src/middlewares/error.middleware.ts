/**
 * src/middlewares/error.middleware.ts
 *
 * Global error handling middleware — now locale-aware.
 *
 * Uses req.locale (set by i18n middleware) to translate error messages.
 * AppError.code is mapped to a TranslationKey via tError().
 * If no translation exists for a code, the original English message is used.
 */

import { type Request, type Response, type NextFunction } from 'express';
import { isAppError, ValidationError } from '../utils/errors';
import { tError, t } from '../i18n';
import { env } from '../config/env';
import type { SupportedLocale } from '../types/i18n.types';

interface ErrorBody {
  success: false;
  message: string;
  error: {
    code: string;
    details?: unknown;
    stack?: string;
  };
  errors?: unknown[];
}

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const isDev =
    env.nodeEnv === 'development' &&
    process.env['NODE_ENV'] !== 'production' &&
    process.env['VERCEL_ENV'] !== 'production';
  const locale: SupportedLocale = req.locale ?? 'en';

  // ── Operational AppError ─────────────────────────────────────────────────

  if (isAppError(err)) {
    // Try to translate by error code; fall back to original message
    const message = tError(err.code, locale) ?? err.message;

    const body: ErrorBody = {
      success: false,
      message,
      error: {
        code: err.code,
        ...(isDev && err.stack ? { stack: err.stack } : {}),
      },
    };

    if (err instanceof ValidationError) {
      body.errors = err.errors;
    }

    res.status(err.statusCode).json(body);
    return;
  }

  // ── Unknown / programmer error ────────────────────────────────────────────

  console.error('[UnhandledError]', {
    path: req.path,
    method: req.method,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });

  const message = isDev && err instanceof Error
    ? err.message
    : t('error.internalError', locale);

  const body: ErrorBody = {
    success: false,
    message,
    error: {
      code: 'INTERNAL_ERROR',
      ...(isDev && err instanceof Error ? { stack: err.stack } : {}),
    },
  };

  res.status(500).json(body);
}

/**
 * 404 handler — catches requests to unknown routes.
 */
export function notFoundMiddleware(req: Request, res: Response, _next: NextFunction): void {
  const locale: SupportedLocale = req.locale ?? 'en';
  res.status(404).json({
    success: false,
    message: `${t('error.routeNotFound', locale)}: ${req.method} ${req.path}`,
    error: { code: 'ROUTE_NOT_FOUND' },
  });
  void _next;
}
