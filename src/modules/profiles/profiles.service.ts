/**
 * src/modules/profiles/profiles.service.ts
 *
 * Business logic for the profiles module.
 *
 * Privacy rules:
 *   - Owner always sees full profile
 *   - Strangers see full profile if isPrivate = false
 *   - Strangers see only { id, username, avatarUrl, bio, isVerified, isPrivate }
 *     if isPrivate = true
 */

import { ProfilesRepository } from './profiles.repository';
import type { Profile, PrivateProfileView, UpdateProfileInput } from '../../types/auth.types';
import type { SupportedLocale } from '../../types/i18n.types';
import { isSupportedLocale } from '../../types/i18n.types';
import { NotFoundError } from '../../utils/errors';
import { getSupabaseAdmin } from '../../config/supabase';

// ─── Private profile shape ────────────────────────────────────────────────────

function toPrivateView(profile: Profile): PrivateProfileView {
  return {
    id: profile.id,
    username: profile.username,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
    isVerified: profile.isVerified,
    isPrivate: true,
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class ProfilesService {
  constructor(private readonly repo: ProfilesRepository) {}

  /**
   * Get own profile — always returns full data.
   */
  async getMe(userId: string): Promise<Profile> {
    return this.repo.getById(userId);
  }

  /**
   * Get a profile by UUID.
   * Applies privacy filtering if the viewer is not the owner.
   */
  async getById(
    targetId: string,
    viewerId: string | null,
  ): Promise<Profile | PrivateProfileView> {
    const profile = await this.repo.findById(targetId);

    if (!profile) {
      throw new NotFoundError('Profile', 'PROFILE_NOT_FOUND');
    }

    // Owner always sees full profile
    if (viewerId === profile.id) return profile;

    // Private profile → limited view for non-owners
    if (profile.isPrivate) return toPrivateView(profile);

    return profile;
  }

  /**
   * Get a profile by username (@handle).
   * Applies the same privacy rules as getById.
   */
  async getByUsername(
    username: string,
    viewerId: string | null,
  ): Promise<Profile | PrivateProfileView> {
    const profile = await this.repo.findByUsername(username);

    if (!profile) {
      throw new NotFoundError('Profile', 'PROFILE_NOT_FOUND');
    }

    if (viewerId === profile.id) return profile;
    if (profile.isPrivate) return toPrivateView(profile);

    return profile;
  }

  /**
   * Update own profile.
   * Only the authenticated user can update their own profile.
   * role, is_verified, verified_at are explicitly excluded.
   */
  async update(
    userId: string,
    input: UpdateProfileInput,
    _locale?: SupportedLocale,
  ): Promise<Profile> {
    // Map camelCase input to snake_case DB columns
    // Only include fields that were actually provided (undefined = skip)
    const dbUpdate: Record<string, unknown> = {};

    if (input.name !== undefined)      dbUpdate['name']        = input.name;
    if (input.username !== undefined)  dbUpdate['username']    = input.username?.toLowerCase() ?? null;
    if (input.bio !== undefined)       dbUpdate['bio']         = input.bio;
    if (input.avatarUrl !== undefined) dbUpdate['avatar_url']  = input.avatarUrl;
    if (input.websiteUrl !== undefined) dbUpdate['website_url'] = input.websiteUrl;
    if (input.location !== undefined)  dbUpdate['location']    = input.location;
    if (input.isPrivate !== undefined) dbUpdate['is_private']  = input.isPrivate;
    if (input.locale !== undefined && isSupportedLocale(input.locale)) {
      dbUpdate['locale'] = input.locale;
    }

    // Never allow updating role or verified status through this method
    // (enforced by validator too, but belt-and-suspenders)
    delete dbUpdate['role'];
    delete dbUpdate['is_verified'];
    delete dbUpdate['verified_at'];

    return this.repo.update(userId, dbUpdate as Parameters<typeof this.repo.update>[1]);
  }

  /**
   * Soft-delete own account.
   * Also invalidates the Supabase Auth session.
   */
  async deleteMe(userId: string): Promise<void> {
    // Verify profile exists before deleting
    await this.repo.getById(userId);

    // Soft delete the profile row
    await this.repo.softDelete(userId);

    // Delete the Supabase Auth user to prevent re-login
    const { error } = await getSupabaseAdmin().auth.admin.deleteUser(userId);
    if (error) {
      console.warn('[ProfilesService.deleteMe] Failed to delete auth user:', error.message);
      // Don't throw — profile is already soft-deleted, auth cleanup is best-effort
    }
  }
}
