/**
 * src/types/auth.types.ts
 *
 * Shared TypeScript types for the authentication and profile domains.
 */

import type { SupportedLocale } from './i18n.types';

// ─── Domain Types ────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'admin' | 'moderator';

/**
 * Full profile — returned to the profile owner and for public profiles.
 */
export interface Profile {
  id: string;
  email: string;
  name: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  websiteUrl: string | null;
  location: string | null;
  role: UserRole;
  locale: SupportedLocale;
  isVerified: boolean;
  verifiedAt: string | null;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Public profile view — returned for public profiles (isPrivate = false)
 * when requested by non-owners.
 *
 * Does NOT include private user fields like `email` or `locale`.
 */
export interface PublicProfileView {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  websiteUrl: string | null;
  location: string | null;
  role: UserRole;
  isVerified: boolean;
  verifiedAt: string | null;
  isPrivate: false;
  createdAt: string;
  updatedAt: string;
}

/**
 * Limited profile view — returned when the requesting user is not the owner
 * and the profile has `isPrivate = true`.
 *
 * Only shows the minimum necessary to identify the user.
 */
export interface PrivateProfileView {
  id: string;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  isPrivate: true;
}

// ─── Request / Input Types ───────────────────────────────────────────────────

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  locale?: SupportedLocale | undefined;
}

export interface LoginInput {
  email: string;
  password: string;
  locale?: SupportedLocale | undefined;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface UpdateProfileInput {
  name?: string | undefined;
  username?: string | null | undefined;
  bio?: string | null | undefined;
  avatarUrl?: string | null | undefined;
  websiteUrl?: string | null | undefined;
  location?: string | null | undefined;
  isPrivate?: boolean | undefined;
  locale?: SupportedLocale | undefined;
}

// ─── Response / Output Types ─────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: 'bearer';
}

export interface AuthResult {
  user: Profile;
  tokens: AuthTokens;
}

// ─── Authenticated Request Context ───────────────────────────────────────────

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  locale: SupportedLocale;
}
