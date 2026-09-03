/**
 * src/modules/friends/friends.controller.ts
 *
 * HTTP controller layer for friendships / follow API.
 */

import { type Request, type Response, type NextFunction } from 'express';
import { FriendsService } from './friends.service';
import { FriendsRepository } from './friends.repository';
import { ProfilesRepository } from '../profiles/profiles.repository';
import { sendSuccess, sendCreated } from '../../utils/api-response';
import { t } from '../../i18n';

const friendsService = new FriendsService(
  new FriendsRepository(),
  new ProfilesRepository(),
);

export { friendsService };

export const friendsController = {
  /**
   * POST /api/v1/friends/request/:targetUserId
   */
  async sendRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { targetUserId } = req.params as { targetUserId: string };
      const friendship = await friendsService.sendRequest(req.user!.id, targetUserId);
      sendCreated(res, friendship, t('friends.requestSent', req.locale));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/friends/accept/:requestId
   */
  async acceptRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { requestId } = req.params as { requestId: string };
      const friendship = await friendsService.acceptRequest(req.user!.id, requestId);
      sendSuccess(res, friendship, t('friends.requestAccepted', req.locale));
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/friends/reject/:requestId
   */
  async rejectRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { requestId } = req.params as { requestId: string };
      await friendsService.rejectRequest(req.user!.id, requestId);
      sendSuccess(res, null, t('friends.requestRejected', req.locale));
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/friends/unfriend/:targetUserId
   */
  async unfriend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { targetUserId } = req.params as { targetUserId: string };
      await friendsService.unfriend(req.user!.id, targetUserId);
      sendSuccess(res, null, t('friends.unfriended', req.locale));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/friends/status/:targetUserId
   */
  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { targetUserId } = req.params as { targetUserId: string };
      const status = await friendsService.getRelationStatus(req.user!.id, targetUserId);
      sendSuccess(res, status);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/friends/requests
   */
  async getIncomingRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requests = await friendsService.getIncomingRequests(req.user!.id);
      sendSuccess(res, requests);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/friends/sent-requests
   */
  async getSentRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requests = await friendsService.getSentRequests(req.user!.id);
      sendSuccess(res, requests);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/friends/list/:userId
   */
  async getFriendsList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params as { userId: string };
      const friends = await friendsService.getFriendsList(userId);
      sendSuccess(res, friends);
    } catch (error) {
      next(error);
    }
  },
};
