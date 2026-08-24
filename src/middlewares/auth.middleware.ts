/**
 * src/middlewares/auth.middleware.ts
 *
 * JWT authentication + RBAC middleware.
 * Updated to populate req.user.locale from the user's profile.
 */

import { type Request, type Response, type NextFunction } from 'express';
import { getSupabaseAdmin } from '../config/supabase';
import { AuthenticationError, ForbiddenError } from '../utils/errors';
import type { AuthenticatedUser, UserRole } from '../types/auth.types';
import type { SupportedLocale } from '../types/i18n.types';
import { isSupportedLocale } from '../types/i18n.types';
import { extractExplicitLocale } from './i18n.middleware';

interface ProfileRoleRow {
  role: string;
  locale: string;
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

/**
 * Middleware: verify the Bearer JWT and populate req.user.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      throw new AuthenticationError('Access token is required', 'MISSING_TOKEN');
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new AuthenticationError('Invalid or expired access token', 'INVALID_TOKEN');
    }

    const supabaseUser = data.user;

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role, locale')
      .eq('id', supabaseUser.id)
      .single();

    if (profileError || !profileData) {
      throw new AuthenticationError('User profile not found', 'PROFILE_NOT_FOUND');
    }

    const profile = profileData as unknown as ProfileRoleRow;
    const profileLocale: SupportedLocale = isSupportedLocale(profile.locale)
      ? profile.locale
      : 'en';

    // If request explicitly specified a locale in body/header, keep it; otherwise fall back to profile.locale
    const explicitLocale = extractExplicitLocale(req);
    req.locale = explicitLocale ?? profileLocale;

    const authenticatedUser: AuthenticatedUser = {
      id: supabaseUser.id,
      email: supabaseUser.email ?? '',
      role: (profile.role as UserRole) ?? 'user',
      locale: profileLocale,
    };

    req.user = authenticatedUser;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware factory: restrict access to specific roles.
 * Must be chained AFTER authenticate.
 *
 * @example
 *   router.get('/admin', authenticate, authorize('admin'), handler)
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('Authentication required', 'UNAUTHENTICATED'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          `Access denied. Required roles: ${allowedRoles.join(', ')}`,
          'INSUFFICIENT_ROLE',
        ),
      );
      return;
    }

    next();
  };
}
