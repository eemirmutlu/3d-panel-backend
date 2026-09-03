/**
 * src/modules/friends/friends.routes.ts
 *
 * Express router definitions for the friends / follow module.
 */

import { Router } from 'express';
import { friendsController } from './friends.controller';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Protected endpoints (Requires JWT)
router.post('/request/:targetUserId', authenticate, friendsController.sendRequest);
router.post('/accept/:requestId', authenticate, friendsController.acceptRequest);
router.delete('/reject/:requestId', authenticate, friendsController.rejectRequest);
router.delete('/unfriend/:targetUserId', authenticate, friendsController.unfriend);
router.get('/status/:targetUserId', authenticate, friendsController.getStatus);
router.get('/requests', authenticate, friendsController.getIncomingRequests);
router.get('/sent-requests', authenticate, friendsController.getSentRequests);

// Public / Semi-public endpoint
router.get('/list/:userId', optionalAuthenticate, friendsController.getFriendsList);

export default router;
