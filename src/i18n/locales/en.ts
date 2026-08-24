/**
 * src/i18n/locales/en.ts
 *
 * English translations.
 * This is the default / fallback locale.
 */

import type { TranslationMap } from '../../types/i18n.types';

const en: TranslationMap = {
  // ── Validation ─────────────────────────────────────────────────────────────
  'validation.failed': 'Validation failed',
  'validation.email.invalid': 'Invalid email address',
  'validation.password.required': 'Password is required',
  'validation.password.tooShort': 'Password must be at least 8 characters',
  'validation.password.tooLong': 'Password must not exceed 72 characters',
  'validation.password.needsUppercase': 'Password must contain at least one uppercase letter',
  'validation.password.needsLowercase': 'Password must contain at least one lowercase letter',
  'validation.password.needsNumber': 'Password must contain at least one number',
  'validation.password.needsSpecial': 'Password must contain at least one special character',
  'validation.name.tooShort': 'Name must be at least 2 characters',
  'validation.name.tooLong': 'Name must not exceed 100 characters',
  'validation.refreshToken.required': 'Refresh token is required',

  // ── Auth Success ───────────────────────────────────────────────────────────
  'auth.register.success': 'Account created successfully',
  'auth.login.success': 'Logged in successfully',
  'auth.logout.success': 'Logged out successfully',
  'auth.me.success': 'User profile retrieved',
  'auth.refresh.success': 'Token refreshed successfully',

  // ── Auth Errors ────────────────────────────────────────────────────────────
  'auth.emailInUse': 'An account with this email already exists',
  'auth.signupFailed': 'Registration failed',
  'auth.loginFailed': 'Login failed unexpectedly',
  'auth.invalidCredentials': 'Invalid email or password',
  'auth.emailConfirmationRequired':
    'Registration requires email confirmation. Please check your inbox.',
  'auth.invalidToken': 'Invalid or expired access token',
  'auth.missingToken': 'Access token is required',
  'auth.profileNotFound': 'User profile not found',
  'auth.invalidRefreshToken': 'Invalid or expired refresh token',
  'auth.refreshFailed': 'Could not refresh session',
  'auth.unauthenticated': 'Authentication required',

  // ── System Errors ──────────────────────────────────────────────────────────
  'error.internalError': 'Internal server error',
  'error.notFound': 'Resource not found',
  'error.forbidden': 'Access denied',
  'error.insufficientRole': 'You do not have permission to perform this action',
  'error.routeNotFound': 'The requested endpoint does not exist',
  'error.rateLimitExceeded': 'Too many requests, please try again later',
  'error.badRequest': 'Bad request',

  // ── Profile Success ────────────────────────────────────────────────────────
  'profile.getSuccess': 'Profile retrieved',
  'profile.updateSuccess': 'Profile updated successfully',
  'profile.deleteSuccess': 'Account deleted successfully',

  // ── Profile Errors ────────────────────────────────────────────────────────
  'profile.notFound': 'Profile not found',
  'profile.usernameInUse': 'This username is already taken',
  'profile.unauthorized': 'You are not authorized to modify this profile',
  'profile.isPrivate': 'This profile is private',
};

export default en;
