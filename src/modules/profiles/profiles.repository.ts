/**
 * src/modules/profiles/profiles.repository.ts
 *
 * Data access layer for the profiles table (profile module).
 * Separate from auth.repository to keep modules isolated.
 */

import { getSupabaseAdmin } from '../../config/supabase';
import { type Profile, type UserRole } from '../../types/auth.types';
import { ConflictError, InternalError, NotFoundError } from '../../utils/errors';
import { type TablesUpdate } from '../../types/database.types';
import { isSupportedLocale } from '../../types/i18n.types';

// ─── Raw DB Row ───────────────────────────────────────────────────────────────

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
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapRow(row: ProfileRow): Profile {
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_COLUMNS = [
  'id', 'email', 'name', 'username', 'bio',
  'avatar_url', 'website_url', 'location',
  'role', 'locale', 'is_verified', 'verified_at',
  'is_private', 'deleted_at', 'created_at', 'updated_at',
].join(', ');

// ─── Repository ───────────────────────────────────────────────────────────────

export class ProfilesRepository {
  private get db() {
    return getSupabaseAdmin();
  }

  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await this.db
      .from('profiles')
      .select(SELECT_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new InternalError(`Failed to fetch profile: ${error.message}`);
    }

    return data ? mapRow(data as unknown as ProfileRow) : null;
  }

  async findByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await this.db
      .from('profiles')
      .select(SELECT_COLUMNS)
      .eq('username', username.toLowerCase())
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new InternalError(`Failed to fetch profile by username: ${error.message}`);
    }

    return data ? mapRow(data as unknown as ProfileRow) : null;
  }

  async getById(id: string): Promise<Profile> {
    const profile = await this.findById(id);
    if (!profile) throw new NotFoundError('Profile', 'PROFILE_NOT_FOUND');
    return profile;
  }

  async update(id: string, data: TablesUpdate<'profiles'>): Promise<Profile> {
    const { data: row, error } = await this.db
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() } as TablesUpdate<'profiles'>)
      .eq('id', id)
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      // Unique constraint on username
      if (error.code === '23505' && error.message.includes('username')) {
        throw new ConflictError('This username is already taken', 'USERNAME_IN_USE');
      }
      throw new InternalError(`Failed to update profile: ${error.message}`);
    }

    if (!row) throw new InternalError('Profile update returned no data');
    return mapRow(row as unknown as ProfileRow);
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await this.db
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() } as TablesUpdate<'profiles'>)
      .eq('id', id);

    if (error) {
      throw new InternalError(`Failed to delete profile: ${error.message}`);
    }
  }

  async listAll(limit = 50): Promise<Profile[]> {
    const { data, error } = await this.db
      .from('profiles')
      .select(SELECT_COLUMNS)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new InternalError(`Failed to list profiles: ${error.message}`);
    }

    return (data || []).map((row) => mapRow(row as unknown as ProfileRow));
  }
}
