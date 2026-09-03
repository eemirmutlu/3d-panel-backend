/**
 * src/modules/friends/friends.service.ts
 *
 * Business logic for friendships / follow relationships.
 */

import { FriendsRepository } from './friends.repository';
import { ProfilesRepository } from '../profiles/profiles.repository';
import type {
  Friendship,
  FriendRequestItem,
  FriendRelationStatusResponse,
} from '../../types/friends.types';
import type { PublicProfileView } from '../../types/auth.types';
import { BadRequestError, ConflictError, NotFoundError, ForbiddenError } from '../../utils/errors';

export class FriendsService {
  constructor(
    private readonly repo: FriendsRepository,
    private readonly profilesRepo: ProfilesRepository,
  ) {}

  /**
   * Helper: check if two users are accepted friends.
   */
  async areFriends(userA: string, userB: string): Promise<boolean> {
    if (!userA || !userB || userA === userB) return false;
    const pair = await this.repo.findPair(userA, userB);
    return pair?.status === 'accepted';
  }

  /**
   * Send a friend / follow request to targetUserId.
   */
  async sendRequest(requesterId: string, targetUserId: string): Promise<Friendship> {
    if (requesterId === targetUserId) {
      throw new BadRequestError('You cannot send a friend request to yourself', 'CANNOT_ADD_SELF');
    }

    // Verify target user exists
    const targetProfile = await this.profilesRepo.findById(targetUserId);
    if (!targetProfile) {
      throw new NotFoundError('User profile', 'PROFILE_NOT_FOUND');
    }

    // Check existing relationship
    const existing = await this.repo.findPair(requesterId, targetUserId);
    if (existing) {
      if (existing.status === 'accepted') {
        throw new ConflictError('You are already friends with this user', 'ALREADY_FRIENDS');
      }
      if (existing.status === 'pending') {
        throw new ConflictError('A friend request is already pending', 'REQUEST_ALREADY_SENT');
      }
      if (existing.status === 'blocked') {
        throw new ForbiddenError('Unable to send request', 'PROFILE_UNAUTHORIZED');
      }
    }

    return this.repo.createRequest(requesterId, targetUserId);
  }

  /**
   * Accept an incoming friend request.
   * Only the addressee (receiver) of the request can accept it.
   */
  async acceptRequest(userId: string, requestId: string): Promise<Friendship> {
    const request = await this.repo.findById(requestId);
    if (!request) {
      throw new NotFoundError('Friend request', 'REQUEST_NOT_FOUND');
    }

    if (request.addresseeId !== userId) {
      throw new ForbiddenError('You are not authorized to accept this request', 'PROFILE_UNAUTHORIZED');
    }

    if (request.status === 'accepted') {
      return request;
    }

    return this.repo.updateStatus(requestId, 'accepted');
  }

  /**
   * Reject / Cancel a friend request.
   * Either the requester or addressee can cancel/reject a request.
   */
  async rejectRequest(userId: string, requestId: string): Promise<void> {
    const request = await this.repo.findById(requestId);
    if (!request) {
      throw new NotFoundError('Friend request', 'REQUEST_NOT_FOUND');
    }

    if (request.requesterId !== userId && request.addresseeId !== userId) {
      throw new ForbiddenError('You are not authorized to modify this request', 'PROFILE_UNAUTHORIZED');
    }

    await this.repo.delete(requestId);
  }

  /**
   * Remove friend (unfriend).
   */
  async unfriend(userId: string, targetUserId: string): Promise<void> {
    const pair = await this.repo.findPair(userId, targetUserId);
    if (!pair) {
      throw new NotFoundError('Friendship relationship', 'REQUEST_NOT_FOUND');
    }

    await this.repo.delete(pair.id);
  }

  /**
   * Get relationship status between authenticated user and target profile.
   */
  async getRelationStatus(userId: string, targetUserId: string): Promise<FriendRelationStatusResponse> {
    if (userId === targetUserId) {
      return { relation: 'self', requestId: null };
    }

    const pair = await this.repo.findPair(userId, targetUserId);
    if (!pair) {
      return { relation: 'none', requestId: null };
    }

    if (pair.status === 'accepted') {
      return { relation: 'accepted', requestId: pair.id };
    }

    if (pair.status === 'blocked') {
      return { relation: 'blocked', requestId: pair.id };
    }

    if (pair.status === 'pending') {
      const relation = pair.requesterId === userId ? 'pending_sent' : 'pending_received';
      return { relation, requestId: pair.id };
    }

    return { relation: 'none', requestId: null };
  }

  /**
   * Get incoming pending requests for authenticated user.
   */
  async getIncomingRequests(userId: string): Promise<FriendRequestItem[]> {
    return this.repo.getIncomingRequests(userId);
  }

  /**
   * Get sent pending requests by authenticated user.
   */
  async getSentRequests(userId: string): Promise<FriendRequestItem[]> {
    return this.repo.getSentRequests(userId);
  }

  /**
   * Get accepted friends list for a user.
   */
  async getFriendsList(userId: string): Promise<PublicProfileView[]> {
    // Verify target user exists
    await this.profilesRepo.getById(userId);
    return this.repo.getFriendsList(userId);
  }
}
