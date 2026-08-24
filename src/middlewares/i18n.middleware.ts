/**
 * src/middlewares/i18n.middleware.ts
 *
 * Locale detection middleware.
 *
 * Detects the user's preferred language from (in priority order):
 *   1. Request body field: `locale` (e.g. login/register payload)
 *   2. `Accept-Language` HTTP header
 *   3. Default: 'en'
 *
 * Sets `req.locale` for use by controllers, services, and error handler.
 *
 * Must be registered BEFORE routes in app.ts.
 */

import { type Request, type Response, type NextFunction } from 'express';
import {
  type SupportedLocale,
  DEFAULT_LOCALE,
  isSupportedLocale,
} from '../types/i18n.types';

/**
 * Parses the Accept-Language header and returns the best matching supported locale.
 * Example: "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7" → "tr"
 */
function parseAcceptLanguage(header: string | undefined): SupportedLocale | null {
  if (!header) return null;

  // Split by comma, parse language tags and quality values
  const langs = header
    .split(',')
    .map((part) => {
      const [lang, q] = part.trim().split(';q=');
      const code = lang?.split('-')[0]?.toLowerCase().trim();
      const quality = q ? parseFloat(q) : 1.0;
      return { code: code ?? '', quality };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { code } of langs) {
    if (isSupportedLocale(code)) return code;
  }

  return null;
}

/**
 * Extracts locale from request body if present.
 * Safe — does not throw if body is malformed.
 */
function extractBodyLocale(req: Request): SupportedLocale | null {
  const body = req.body as Record<string, unknown> | undefined;
  const locale = body?.['locale'];
  if (typeof locale === 'string' && isSupportedLocale(locale)) return locale;
  return null;
}

/**
 * Extracts explicit locale from request body or Accept-Language header.
 * Returns null if neither provided a supported locale.
 */
export function extractExplicitLocale(req: Request): SupportedLocale | null {
  return extractBodyLocale(req) ?? parseAcceptLanguage(req.headers['accept-language']);
}

/**
 * i18n middleware — must run after body parsing, before routes.
 */
export function i18nMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const locale: SupportedLocale = extractExplicitLocale(req) ?? DEFAULT_LOCALE;
  req.locale = locale;
  next();
}
