/**
 * src/types/i18n.types.ts
 *
 * Localization type definitions.
 *
 * SupportedLocale  — union of all supported language codes
 * TranslationKey   — all valid translation keys (compile-time safety)
 *
 * Adding a new language:
 *   1. Add the code to SupportedLocale
 *   2. Add it to SUPPORTED_LOCALES array
 *   3. Create src/i18n/locales/<code>.ts
 *   4. Register it in src/i18n/index.ts
 */

export type SupportedLocale = 'en' | 'tr';

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['en', 'tr'] as const;

export function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * All valid translation keys.
 * Adding a new key here forces you to add it in every locale file (TypeScript will error).
 */
export type TranslationKey =
  // ── Validation ────────────────────────────────────────────────────────────
  | 'validation.failed'
  | 'validation.email.invalid'
  | 'validation.password.required'
  | 'validation.password.tooShort'
  | 'validation.password.tooLong'
  | 'validation.password.needsUppercase'
  | 'validation.password.needsLowercase'
  | 'validation.password.needsNumber'
  | 'validation.password.needsSpecial'
  | 'validation.name.tooShort'
  | 'validation.name.tooLong'
  | 'validation.refreshToken.required'

  // ── Auth Success ──────────────────────────────────────────────────────────
  | 'auth.register.success'
  | 'auth.login.success'
  | 'auth.logout.success'
  | 'auth.me.success'
  | 'auth.refresh.success'

  // ── Auth Errors ───────────────────────────────────────────────────────────
  | 'auth.emailInUse'
  | 'auth.signupFailed'
  | 'auth.loginFailed'
  | 'auth.invalidCredentials'
  | 'auth.emailConfirmationRequired'
  | 'auth.invalidToken'
  | 'auth.missingToken'
  | 'auth.profileNotFound'
  | 'auth.invalidRefreshToken'
  | 'auth.refreshFailed'
  | 'auth.unauthenticated'

  // ── System Errors ─────────────────────────────────────────────────────────
  | 'error.internalError'
  | 'error.notFound'
  | 'error.forbidden'
  | 'error.insufficientRole'
  | 'error.routeNotFound'
  | 'error.rateLimitExceeded'
  | 'error.badRequest'

  // ── Profile Success ───────────────────────────────────────────────────────
  | 'profile.getSuccess'
  | 'profile.updateSuccess'
  | 'profile.deleteSuccess'

  // ── Profile Errors ────────────────────────────────────────────────────────
  | 'profile.notFound'
  | 'profile.usernameInUse'
  | 'profile.unauthorized'
  | 'profile.isPrivate'

  // ── Friends Success & Errors ──────────────────────────────────────────────
  | 'friends.requestSent'
  | 'friends.requestAccepted'
  | 'friends.requestRejected'
  | 'friends.unfriended'
  | 'friends.cannotAddSelf'
  | 'friends.alreadyFriends'
  | 'friends.requestAlreadySent'
  | 'friends.requestNotFound'

  // ── News & Admin ──────────────────────────────────────────────────────────
  | 'news.created'
  | 'news.updated'
  | 'news.deleted'
  | 'news.notFound'
  | 'admin.unauthorized'
  | 'admin.userUpdated';

/**
 * The shape every locale file must satisfy.
 */
export type TranslationMap = Record<TranslationKey, string>;
