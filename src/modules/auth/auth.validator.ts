/**
 * src/modules/auth/auth.validator.ts
 *
 * Zod schemas for authentication request bodies.
 *
 * Error messages are TranslationKeys — they are translated at the
 * validation middleware layer using req.locale.
 */

import { z } from 'zod';
import { SUPPORTED_LOCALES } from '../../types/i18n.types';

// ─── Field Constraints ────────────────────────────────────────────────────────

const emailSchema = z
  .string()
  .email('validation.email.invalid')
  .toLowerCase()
  .trim();

const passwordSchema = z
  .string()
  .min(1, 'validation.password.required')
  .min(8, 'validation.password.tooShort')
  .max(72, 'validation.password.tooLong')
  .regex(/[A-Z]/, 'validation.password.needsUppercase')
  .regex(/[a-z]/, 'validation.password.needsLowercase')
  .regex(/[0-9]/, 'validation.password.needsNumber')
  .regex(/[^A-Za-z0-9]/, 'validation.password.needsSpecial');

const nameSchema = z
  .string()
  .min(2, 'validation.name.tooShort')
  .max(100, 'validation.name.tooLong')
  .trim();

const localeSchema = z
  .enum(SUPPORTED_LOCALES as [string, ...string[]])
  .optional();

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  locale: localeSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'validation.password.required'),
  locale: localeSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'validation.refreshToken.required'),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
