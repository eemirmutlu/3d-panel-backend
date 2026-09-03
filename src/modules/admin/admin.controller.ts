/**
 * src/modules/admin/admin.controller.ts
 *
 * Dedicated HTTP layer for CRM Admin operations.
 * Strictly protected by `authenticate` + `requireAdmin` middleware guards.
 */

import { type Request, type Response, type NextFunction } from 'express';
import { ProfilesRepository } from '../profiles/profiles.repository';
import { newsService } from '../news/news.controller';
import { sendSuccess, sendCreated } from '../../utils/api-response';
import { t } from '../../i18n';

const profilesRepo = new ProfilesRepository();

export const adminController = {
  /**
   * GET /api/v1/admin/users
   * Admin CRM: List all users with full admin details (including private emails, roles, isAdmin).
   */
  async listUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await profilesRepo.listAll(100);
      sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/admin/users/:userId
   * Admin CRM: Update user role, isAdmin, or isVerified status
   */
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params as { userId: string };
      const { role, isAdmin, isVerified } = req.body as {
        role?: 'user' | 'admin' | 'moderator';
        isAdmin?: boolean;
        isVerified?: boolean;
      };

      const updateData: Record<string, unknown> = {};
      if (role !== undefined) updateData['role'] = role;
      if (isAdmin !== undefined) updateData['is_admin'] = isAdmin;
      if (isVerified !== undefined) {
        updateData['is_verified'] = isVerified;
        updateData['verified_at'] = isVerified ? new Date().toISOString() : null;
      }

      const updated = await profilesRepo.update(userId, updateData as any);
      sendSuccess(res, updated, t('admin.userUpdated', req.locale));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/news
   * Admin CRM: List all news articles (including draft/unpublished)
   */
  async listAllNews(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const news = await newsService.listAllNewsForAdmin();
      sendSuccess(res, news);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/admin/news
   * Admin CRM: Publish new article with HTML formatting & multi-image support
   */
  async createNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, summary, contentHtml, coverImageUrl, imageUrls, isPublished, slug } = req.body;
      const article = await newsService.createNews(req.user!.id, {
        title,
        summary,
        contentHtml,
        coverImageUrl,
        imageUrls: Array.isArray(imageUrls) ? imageUrls : (imageUrls ? [imageUrls] : []),
        isPublished: isPublished ?? true,
        slug,
      });
      sendCreated(res, article, t('news.created', req.locale));
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/v1/admin/news/:id
   * Admin CRM: Update news article
   */
  async updateNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { title, summary, contentHtml, coverImageUrl, imageUrls, isPublished, slug } = req.body;
      const article = await newsService.updateNews(id, {
        title,
        summary,
        contentHtml,
        coverImageUrl,
        imageUrls: imageUrls !== undefined ? (Array.isArray(imageUrls) ? imageUrls : [imageUrls]) : undefined,
        isPublished,
        slug,
      });
      sendSuccess(res, article, t('news.updated', req.locale));
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/admin/news/:id
   * Admin CRM: Delete news article
   */
  async deleteNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      await newsService.deleteNews(id);
      sendSuccess(res, null, t('news.deleted', req.locale));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/admin/upload
   * Admin CRM: Upload computer file (Base64/DataURL) to Supabase Storage
   */
  async uploadMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fileData, fileName, mimeType } = req.body as {
        fileData: string;
        fileName?: string;
        mimeType?: string;
      };

      if (!fileData) {
        sendSuccess(res, { url: '' });
        return;
      }

      const matches = fileData.match(/^data:(.+);base64,(.+)$/);
      let buffer: Buffer;
      let contentType = mimeType || 'image/png';

      if (matches) {
        contentType = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(fileData, 'base64');
      }

      const safeFileName = `${Date.now()}_${(fileName || 'file.png').replace(/[^a-zA-Z0-9._-]/g, '')}`;
      const filePath = `news/${safeFileName}`;

      const { getSupabaseAdmin } = await import('../../config/supabase');
      const supabase = getSupabaseAdmin();
      const bucketName = 'media';

      const { error } = await supabase.storage.from(bucketName).upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

      if (error) {
        // Fallback to DataURL if storage bucket isn't initialized
        sendSuccess(res, { url: fileData }, 'File uploaded (DataURL mode)');
        return;
      }

      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      sendSuccess(res, { url: publicUrlData.publicUrl }, 'File uploaded to Supabase Storage');
    } catch (error) {
      next(error);
    }
  },
};
