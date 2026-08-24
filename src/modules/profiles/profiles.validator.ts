/**
 * src/modules/profiles/profiles.validator.ts
 *
 * Zod schemas for profile update requests.
 *
 * NOTE: role, is_verified, verified_at are NOT included — these are admin-only fields.
 */

import { z } from 'zod';
import { SUPPORTED_LOCALES } from '../../types/i18n.types';

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'validation.name.tooShort')
    .max(100, 'validation.name.tooLong')
    .trim()
    .optional(),

  username: z
    .string()
    .min(1)
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores')
    .trim()
    .nullable()
    .optional(),

  bio: z
    .string()
    .max(500, 'Bio must not exceed 500 characters')
    .trim()
    .nullable()
    .optional(),

  avatarUrl: z
    .string()
    .url('Avatar URL must be a valid URL')
    .nullable()
    .optional(),

  websiteUrl: z
    .string()
    .url('Website URL must be a valid URL')
    .nullable()
    .optional(),

  location: z
    .string()
    .max(100, 'Location must not exceed 100 characters')
    .trim()
    .nullable()
    .optional(),

  isPrivate: z
    .boolean()
    .optional(),

  locale: z
    .enum(SUPPORTED_LOCALES as [string, ...string[]])
    .optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
