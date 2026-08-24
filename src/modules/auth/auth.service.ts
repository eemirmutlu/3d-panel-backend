/**
 * src/modules/auth/auth.service.ts
 *
 * Business logic layer for authentication.
 * Now locale-aware: saves locale to profile on register/login.
 */

import { getSupabaseAnon, getSupabaseAdmin } from '../../config/supabase';
import { AuthRepository } from './auth.repository';
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  AuthResult,
  AuthTokens,
  Profile,
} from '../../types/auth.types';
import type { SupportedLocale } from '../../types/i18n.types';
import {
  AuthenticationError,
  ConflictError,
  InternalError,
} from '../../utils/errors';

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  /**
   * Register a new user.
   * Saves the locale preference to the profile.
   */
  async register(input: RegisterInput, locale: SupportedLocale = 'en'): Promise<AuthResult> {
    const existing = await this.authRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists', 'EMAIL_IN_USE');
    }

    // 1. Create user via Supabase Admin API (email_confirm: true bypasses Supabase SMTP rate limits)
    const { data: adminAuthData, error: createError } = await getSupabaseAdmin().auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { name: input.name },
    });

    if (createError) {
      const message = createError.message;
      if (message.toLowerCase().includes('already registered') || message.toLowerCase().includes('already exists')) {
        throw new ConflictError('An account with this email already exists', 'EMAIL_IN_USE');
      }
      throw new AuthenticationError(message, 'SIGNUP_FAILED');
    }

    const authUser = adminAuthData.user;
    const profileLocale: SupportedLocale = input.locale ?? locale;

    // 2. Create application-level profile row
    let profile: Profile;
    try {
      profile = await this.authRepository.createProfile({
        id: authUser.id,
        email: input.email.toLowerCase(),
        name: input.name,
        role: 'user',
        locale: profileLocale,
      });
    } catch (profileError) {
      await getSupabaseAdmin().auth.admin.deleteUser(authUser.id);
      throw profileError;
    }

    // 3. Obtain session tokens for the new user
    const { data: sessionData, error: loginError } = await getSupabaseAnon().auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (loginError || !sessionData.session) {
      await getSupabaseAdmin().auth.admin.deleteUser(authUser.id);
      throw new AuthenticationError('Failed to generate session tokens', 'SIGNUP_FAILED');
    }

    return { user: profile, tokens: this.buildTokens(sessionData.session) };
  }

  /**
   * Login and update the stored locale if it changed.
   */
  async login(input: LoginInput, locale: SupportedLocale = 'en'): Promise<AuthResult> {
    const { data, error } = await getSupabaseAnon().auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      throw new AuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!data.user || !data.session) {
      throw new AuthenticationError('Login failed unexpectedly', 'LOGIN_FAILED');
    }

    const profile = await this.authRepository.getById(data.user.id);

    // Update locale in profile if it changed
    const newLocale: SupportedLocale = input.locale ?? locale;
    if (profile.locale !== newLocale) {
      await this.authRepository.updateLocale(data.user.id, newLocale);
      profile.locale = newLocale;
    }

    return { user: profile, tokens: this.buildTokens(data.session) };
  }

  async logout(accessToken: string): Promise<void> {
    const { error } = await getSupabaseAdmin().auth.admin.signOut(accessToken);
    if (error) {
      console.warn('[AuthService.logout] Supabase signOut warning:', error.message);
    }
  }

  async getMe(userId: string): Promise<Profile> {
    return this.authRepository.getById(userId);
  }

  async refreshToken(input: RefreshTokenInput): Promise<AuthTokens> {
    const { data, error } = await getSupabaseAnon().auth.refreshSession({
      refresh_token: input.refreshToken,
    });

    if (error) {
      throw new AuthenticationError(
        'Invalid or expired refresh token',
        'INVALID_REFRESH_TOKEN',
      );
    }

    if (!data.session) {
      throw new AuthenticationError('Could not refresh session', 'REFRESH_FAILED');
    }

    return this.buildTokens(data.session);
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private buildTokens(session: {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
    expires_in?: number;
  }): AuthTokens {
    if (!session.access_token || !session.refresh_token) {
      throw new InternalError('Session tokens are missing');
    }

    const expiresAt =
      session.expires_at ?? Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600);

    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt,
      tokenType: 'bearer',
    };
  }
}
