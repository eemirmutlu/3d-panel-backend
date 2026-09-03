/**
 * src/types/friends.types.ts
 *
 * Domain types for friendships and follow relationships.
 */

import type { PublicProfileView } from './auth.types';

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export type RelationState =
  | 'none'             // No relationship exists
  | 'self'             // Looking at own profile
  | 'pending_sent'     // Authenticated user sent request to target
  | 'pending_received' // Target user sent request to authenticated user
  | 'accepted'         // Connected as friends / following
  | 'blocked';         // Blocked

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FriendRequestItem {
  id: string;
  status: FriendshipStatus;
  createdAt: string;
  user: PublicProfileView;
}

export interface FriendRelationStatusResponse {
  relation: RelationState;
  requestId: string | null;
}
