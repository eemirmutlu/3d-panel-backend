/**
 * src/i18n/index.ts
 *
 * Translation engine.
 *
 * Usage:
 *   import { t, tError } from '../i18n';
 *
 *   t('auth.login.success', 'tr')  → "Başarıyla giriş yapıldı"
 *   tError('EMAIL_IN_USE', 'tr')   → "Bu e-posta adresiyle zaten bir hesap mevcut"
 */

import en from './locales/en';
import tr from './locales/tr';
import {
  type SupportedLocale,
  type TranslationKey,
  DEFAULT_LOCALE,
} from '../types/i18n.types';

// ── Locale registry ────────────────────────────────────────────────────────────
// To add a new language: import it and add it here.

const locales: Record<SupportedLocale, typeof en> = { en, tr };

// ── Error code → TranslationKey map ───────────────────────────────────────────
// Maps machine-readable error codes (from AppError.code) to translation keys.
// This lets the error middleware translate errors without changing how they are thrown.

const errorCodeToKey: Partial<Record<string, TranslationKey>> = {
  // Auth errors
  EMAIL_IN_USE: 'auth.emailInUse',
  SIGNUP_FAILED: 'auth.signupFailed',
  LOGIN_FAILED: 'auth.loginFailed',
  INVALID_CREDENTIALS: 'auth.invalidCredentials',
  EMAIL_CONFIRMATION_REQUIRED: 'auth.emailConfirmationRequired',
  INVALID_TOKEN: 'auth.invalidToken',
  MISSING_TOKEN: 'auth.missingToken',
  INVALID_REFRESH_TOKEN: 'auth.invalidRefreshToken',
  REFRESH_FAILED: 'auth.refreshFailed',
  UNAUTHENTICATED: 'auth.unauthenticated',
  USER_NOT_FOUND: 'error.notFound',

  // System errors
  INTERNAL_ERROR: 'error.internalError',
  NOT_FOUND: 'error.notFound',
  FORBIDDEN: 'error.forbidden',
  INSUFFICIENT_ROLE: 'error.insufficientRole',
  ROUTE_NOT_FOUND: 'error.routeNotFound',
  RATE_LIMIT_EXCEEDED: 'error.rateLimitExceeded',
  BAD_REQUEST: 'error.badRequest',

  // Profile errors
  PROFILE_NOT_FOUND: 'profile.notFound',
  USERNAME_IN_USE: 'profile.usernameInUse',
  PROFILE_UNAUTHORIZED: 'profile.unauthorized',
  PROFILE_IS_PRIVATE: 'profile.isPrivate',
};

// ── Core translate function ────────────────────────────────────────────────────

/**
 * Translates a key to the given locale.
 * Falls back to English if the key is missing in the locale.
 * Falls back to the key itself if even English doesn't have it.
 */
export function t(key: TranslationKey, locale: SupportedLocale = DEFAULT_LOCALE): string {
  const map = locales[locale] ?? locales[DEFAULT_LOCALE];
  return map[key] ?? locales[DEFAULT_LOCALE][key] ?? key;
}

/**
 * Translates an AppError error code to a localized message.
 * Returns null if the code has no translation (caller uses the original message).
 */
export function tError(code: string, locale: SupportedLocale = DEFAULT_LOCALE): string | null {
  const key = errorCodeToKey[code];
  if (!key) return null;
  return t(key, locale);
}

/**
 * Checks if a string is a known TranslationKey (for Zod validation messages).
 */
export function isTranslationKey(value: string): value is TranslationKey {
  return value in locales[DEFAULT_LOCALE];
}

/**
 * Translates a string that may or may not be a TranslationKey.
 * If it's a known key, translates it. Otherwise returns as-is.
 */
export function tOrRaw(value: string, locale: SupportedLocale = DEFAULT_LOCALE): string {
  if (isTranslationKey(value)) {
    return t(value, locale);
  }
  return value;
}
