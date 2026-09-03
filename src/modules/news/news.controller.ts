/**
 * src/modules/news/news.controller.ts
 *
 * Public HTTP layer for News & Announcements module.
 * No authentication required to read published news!
 */

import { type Request, type Response, type NextFunction } from 'express';
import { NewsService } from './news.service';
import { NewsRepository } from './news.repository';
import { sendSuccess } from '../../utils/api-response';

const newsService = new NewsService(new NewsRepository());

export { newsService };

export const newsController = {
  /**
   * GET /api/v1/news
   * Public: List published news feed
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query['limit'] as string || '20', 10);
      const offset = parseInt(req.query['offset'] as string || '0', 10);
      const news = await newsService.listPublishedNews(limit, offset);
      sendSuccess(res, news);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/news/:idOrSlug
   * Public: Get news article detail
   */
  async getDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idOrSlug } = req.params as { idOrSlug: string };
      const article = await newsService.getNewsByIdOrSlug(idOrSlug);
      sendSuccess(res, article);
    } catch (error) {
      next(error);
    }
  },
};
