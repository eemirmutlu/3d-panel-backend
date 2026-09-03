/**
 * src/modules/friends/friends.repository.ts
 *
 * Data access layer for the friendships table.
 */

import { getSupabaseAdmin } from '../../config/supabase';
import type { Friendship, FriendRequestItem, FriendshipStatus } from '../../types/friends.types';
import type { PublicProfileView, UserRole } from '../../types/auth.types';
import { InternalError } from '../../utils/errors';

interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface JoinedProfileRow {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  website_url: string | null;
  location: string | null;
  role: string;
  is_verified: boolean;
  verified_at: string | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

function mapFriendship(row: FriendshipRow): Friendship {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status as FriendshipStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPublicProfile(row: JoinedProfileRow): PublicProfileView {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    websiteUrl: row.website_url,
    location: row.location,
    role: row.role as UserRole,
    isVerified: row.is_verified,
    verifiedAt: row.verified_at,
    isPrivate: false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class FriendsRepository {
  private get db() {
    return getSupabaseAdmin();
  }

  async findPair(userA: string, userB: string): Promise<Friendship | null> {
    const { data, error } = await this.db
      .from('friendships')
      .select('*')
      .or(`and(requester_id.eq.${userA},addressee_id.eq.${userB}),and(requester_id.eq.${userB},addressee_id.eq.${userA})`)
      .maybeSingle();

    if (error) {
      throw new InternalError(`Failed to fetch friendship status: ${error.message}`);
    }

    return data ? mapFriendship(data as unknown as FriendshipRow) : null;
  }

  async findById(id: string): Promise<Friendship | null> {
    const { data, error } = await this.db
      .from('friendships')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalError(`Failed to fetch friendship request: ${error.message}`);
    }

    return data ? mapFriendship(data as unknown as FriendshipRow) : null;
  }

  async createRequest(requesterId: string, addresseeId: string): Promise<Friendship> {
    const { data, error } = await this.db
      .from('friendships')
      .insert({
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) {
      throw new InternalError(`Failed to create friend request: ${error.message}`);
    }

    return mapFriendship(data as unknown as FriendshipRow);
  }

  async updateStatus(id: string, status: FriendshipStatus): Promise<Friendship> {
    const { data, error } = await this.db
      .from('friendships')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new InternalError(`Failed to update friendship status: ${error.message}`);
    }

    return mapFriendship(data as unknown as FriendshipRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db
      .from('friendships')
      .delete()
      .eq('id', id);

    if (error) {
      throw new InternalError(`Failed to remove friendship: ${error.message}`);
    }
  }

  /**
   * Get incoming pending friend requests for a user
   */
  async getIncomingRequests(userId: string): Promise<FriendRequestItem[]> {
    const { data, error } = await this.db
      .from('friendships')
      .select(`
        id,
        status,
        created_at,
        profiles!friendships_requester_id_fkey (
          id, name, username, bio, avatar_url, website_url, location, role, is_verified, verified_at, is_private, created_at, updated_at
        )
      `)
      .eq('addressee_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalError(`Failed to fetch incoming friend requests: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      status: row.status as FriendshipStatus,
      createdAt: row.created_at,
      user: mapPublicProfile(row.profiles as JoinedProfileRow),
    }));
  }

  /**
   * Get outgoing pending friend requests sent by a user
   */
  async getSentRequests(userId: string): Promise<FriendRequestItem[]> {
    const { data, error } = await this.db
      .from('friendships')
      .select(`
        id,
        status,
        created_at,
        profiles!friendships_addressee_id_fkey (
          id, name, username, bio, avatar_url, website_url, location, role, is_verified, verified_at, is_private, created_at, updated_at
        )
      `)
      .eq('requester_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalError(`Failed to fetch sent friend requests: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      status: row.status as FriendshipStatus,
      createdAt: row.created_at,
      user: mapPublicProfile(row.profiles as JoinedProfileRow),
    }));
  }

  /**
   * Get accepted friends list for a user
   */
  async getFriendsList(userId: string): Promise<PublicProfileView[]> {
    // Fetch all accepted relationships involving this user
    const { data, error } = await this.db
      .from('friendships')
      .select(`
        requester_id,
        addressee_id,
        requester:profiles!friendships_requester_id_fkey (
          id, name, username, bio, avatar_url, website_url, location, role, is_verified, verified_at, is_private, created_at, updated_at
        ),
        addressee:profiles!friendships_addressee_id_fkey (
          id, name, username, bio, avatar_url, website_url, location, role, is_verified, verified_at, is_private, created_at, updated_at
        )
      `)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) {
      throw new InternalError(`Failed to fetch friends list: ${error.message}`);
    }

    const friends: PublicProfileView[] = [];
    for (const row of data || []) {
      const friendRow = row.requester_id === userId ? row.addressee : row.requester;
      if (friendRow) {
        friends.push(mapPublicProfile(friendRow as unknown as JoinedProfileRow));
      }
    }

    return friends;
  }
}
