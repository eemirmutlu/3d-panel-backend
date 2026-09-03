/**
 * src/modules/auth/auth.repository.ts
 *
 * Data access layer for the profiles table.
 */

import { getSupabaseAdmin } from '../../config/supabase';
import { type Profile, type UserRole } from '../../types/auth.types';
import { ConflictError, InternalError, NotFoundError } from '../../utils/errors';
import { type TablesInsert } from '../../types/database.types';
import type { SupportedLocale } from '../../types/i18n.types';
import { isSupportedLocale } from '../../types/i18n.types';

// ─── Raw DB row (snake_case) ──────────────────────────────────────────────────

interface ProfileRow {
  id: string;
  email: string;
  name: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  website_url: string | null;
  location: string | null;
  role: string;
  locale: string;
  is_verified: boolean;
  verified_at: string | null;
  is_private: boolean;
  is_admin?: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Mapper ──────────────────────────────────────────────────────────────────

function mapRowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    username: row.username,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    websiteUrl: row.website_url,
    location: row.location,
    role: row.role as UserRole,
    locale: isSupportedLocale(row.locale) ? row.locale : 'en',
    isVerified: row.is_verified,
    verifiedAt: row.verified_at,
    isPrivate: row.is_private,
    isAdmin: !!(row.is_admin || row.role === 'admin'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_COLUMNS =
  'id, email, name, username, bio, avatar_url, website_url, location, role, locale, is_verified, verified_at, is_private, is_admin, deleted_at, created_at, updated_at';

// ─── Repository ──────────────────────────────────────────────────────────────

export class AuthRepository {
  private get db() {
    return getSupabaseAdmin();
  }

  async createProfile(data: TablesInsert<'profiles'>): Promise<Profile> {
    const { data: row, error } = await this.db
      .from('profiles')
      .upsert(data, { onConflict: 'id' })
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictError('A user with this email already exists', 'EMAIL_IN_USE');
      }
      throw new InternalError(`Failed to create profile: ${error.message}`);
    }

    if (!row) throw new InternalError('Profile creation returned no data');

    return mapRowToProfile(row as unknown as ProfileRow);
  }

  async findById(id: string): Promise<Profile | null> {
    const { data: row, error } = await this.db
      .from('profiles')
      .select(SELECT_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new InternalError(`Failed to fetch profile: ${error.message}`);
    }

    return row ? mapRowToProfile(row as unknown as ProfileRow) : null;
  }

  async findByEmail(email: string): Promise<Profile | null> {
    const { data: row, error } = await this.db
      .from('profiles')
      .select(SELECT_COLUMNS)
      .eq('email', email.toLowerCase())
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new InternalError(`Failed to fetch profile by email: ${error.message}`);
    }

    return row ? mapRowToProfile(row as unknown as ProfileRow) : null;
  }

  async getById(id: string): Promise<Profile> {
    const profile = await this.findById(id);
    if (!profile) throw new NotFoundError('User', 'USER_NOT_FOUND');
    return profile;
  }

  /**
   * Updates the user's preferred locale in their profile.
   */
  async updateLocale(id: string, locale: SupportedLocale): Promise<void> {
    const { error } = await this.db
      .from('profiles')
      .update({ locale } as TablesInsert<'profiles'>)
      .eq('id', id);

    if (error) {
      throw new InternalError(`Failed to update locale: ${error.message}`);
    }
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await this.db
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() } as TablesInsert<'profiles'>)
      .eq('id', id);

    if (error) {
      throw new InternalError(`Failed to delete profile: ${error.message}`);
    }
  }
}
