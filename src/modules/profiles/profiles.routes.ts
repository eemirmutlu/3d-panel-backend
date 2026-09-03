/**
 * src/modules/profiles/profiles.routes.ts
 *
 * Profile module routes.
 *
 * IMPORTANT: Route order matters!
 * `/me` and `/username/:username` MUST come before `/:userId`
 * otherwise Express would match 'me' and 'username' as userId values.
 */

import { Router } from 'express';
import { profilesController } from './profiles.controller';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { updateProfileSchema } from './profiles.validator';

const router = Router();

// ── Directory route ───────────────────────────────────────────────────────────

/**
 * GET /api/v1/profiles
 * Fetch all registered profiles (Directory).
 */
router.get('/', optionalAuthenticate, profilesController.list);

// ── Own profile (no userId in URL) ────────────────────────────────────────────

/**
 * GET /api/v1/profiles/me
 * Returns the authenticated user's full profile.
 */
router.get('/me', authenticate, profilesController.getMe);

/**
 * PATCH /api/v1/profiles/me
 * PUT /api/v1/profiles/me
 * Updates the authenticated user's profile.
 */
router.patch(
  '/me',
  authenticate,
  validate(updateProfileSchema),
  profilesController.update,
);

router.put(
  '/me',
  authenticate,
  validate(updateProfileSchema),
  profilesController.update,
);

/**
 * POST /api/v1/profiles/me/admin-toggle
 * Test endpoint: toggles own isAdmin status.
 */
router.post('/me/admin-toggle', authenticate, profilesController.toggleAdminSelf);

/**
 * DELETE /api/v1/profiles/me
 * Soft-deletes the authenticated user's account.
 */
router.delete('/me', authenticate, profilesController.deleteMe);

// ── Public routes ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/profiles/username/:username
 * Fetch a profile by @username. Applies privacy filtering.
 * Optional auth: if provided, owner sees full profile.
 */
router.get('/username/:username', profilesController.getByUsername);

/**
 * GET /api/v1/profiles/:userId
 * Fetch a profile by UUID. Applies privacy filtering.
 * Optional auth: if provided, owner sees full profile.
 *
 * NOTE: This route must come LAST to avoid catching 'me' and 'username'.
 */
router.get('/:userId', profilesController.getById);

export default router;
