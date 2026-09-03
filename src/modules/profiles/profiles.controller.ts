/**
 * src/modules/profiles/profiles.controller.ts
 *
 * HTTP layer for the profiles module.
 * Zero business logic — delegates everything to ProfilesService.
 */

import { type Request, type Response, type NextFunction } from 'express';
import { ProfilesService } from './profiles.service';
import { ProfilesRepository } from './profiles.repository';
import { sendSuccess } from '../../utils/api-response';
import { t } from '../../i18n';
import type { UpdateProfileDto } from './profiles.validator';
import type { UpdateProfileInput } from '../../types/auth.types';
import { isSupportedLocale } from '../../types/i18n.types';

const profilesService = new ProfilesService(new ProfilesRepository());

export const profilesController = {
  /**
   * GET /api/v1/profiles/me
   * Returns the authenticated user's full profile.
   * User ID never appears in the URL.
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await profilesService.getMe(req.user!.id);
      sendSuccess(res, profile, t('profile.getSuccess', req.locale));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/profiles/:userId
   * Public endpoint — applies privacy filtering for private profiles.
   * req.user may or may not be set.
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params as { userId: string };
      const viewerId = req.user?.id ?? null;
      const profile = await profilesService.getById(userId, viewerId);
      sendSuccess(res, profile, t('profile.getSuccess', req.locale));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/profiles/username/:username
   * Public endpoint — applies privacy filtering for private profiles.
   */
  async getByUsername(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username } = req.params as { username: string };
      const viewerId = req.user?.id ?? null;
      const profile = await profilesService.getByUsername(username, viewerId);
      sendSuccess(res, profile, t('profile.getSuccess', req.locale));
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/profiles/me
   * Updates the authenticated user's own profile.
   * req.user.id is the authoritative source — body cannot override it.
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as UpdateProfileDto;
      const dtoLocale = isSupportedLocale(dto.locale ?? '') ? (dto.locale as import('../../types/i18n.types').SupportedLocale) : undefined;

      const input: UpdateProfileInput = {
        name: dto.name,
        username: dto.username,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
        websiteUrl: dto.websiteUrl,
        location: dto.location,
        isPrivate: dto.isPrivate,
        locale: dtoLocale,
      };

      const updated = await profilesService.update(req.user!.id, input, req.locale);
      const responseLocale = updated.locale ?? req.locale;
      sendSuccess(res, updated, t('profile.updateSuccess', responseLocale));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/profiles
   * Public directory endpoint — returns all registered profiles.
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const viewerId = req.user?.id ?? null;
      const profiles = await profilesService.listProfiles(viewerId);
      sendSuccess(res, profiles);
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/profiles/me
   * Soft-deletes the authenticated user's own account.
   */
  async deleteMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await profilesService.deleteMe(req.user!.id);
      sendSuccess(res, null, t('profile.deleteSuccess', req.locale));
    } catch (error) {
      next(error);
    }
  },
};
