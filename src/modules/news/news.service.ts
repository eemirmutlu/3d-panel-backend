/**
 * src/modules/news/news.service.ts
 *
 * Business logic layer for News and Announcements module.
 */

import { NewsRepository } from './news.repository';
import type { NewsArticle, CreateNewsInput, UpdateNewsInput } from '../../types/news.types';
import { NotFoundError } from '../../utils/errors';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class NewsService {
  constructor(private readonly repo: NewsRepository) {}

  /**
   * Public: List published news feed
   */
  async listPublishedNews(limit = 20, offset = 0): Promise<NewsArticle[]> {
    return this.repo.listPublished(limit, offset);
  }

  /**
   * Public: Get published news article detail by ID or Slug
   */
  async getNewsByIdOrSlug(idOrSlug: string): Promise<NewsArticle> {
    const article = await this.repo.findByIdOrSlug(idOrSlug);
    if (!article || !article.isPublished) {
      throw new NotFoundError('News article', 'NEWS_NOT_FOUND');
    }
    return article;
  }

  /**
   * Admin CRM: Create news article with HTML content and multi-image support
   */
  async createNews(authorId: string, input: CreateNewsInput): Promise<NewsArticle> {
    const baseSlug = input.slug ? slugify(input.slug) : slugify(input.title);
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    return this.repo.create(authorId, {
      ...input,
      slug: uniqueSlug,
    });
  }

  /**
   * Admin CRM: Update news article
   */
  async updateNews(id: string, input: UpdateNewsInput): Promise<NewsArticle> {
    const article = await this.repo.findByIdOrSlug(id);
    if (!article) {
      throw new NotFoundError('News article', 'NEWS_NOT_FOUND');
    }

    let slug = input.slug;
    if (slug) {
      slug = slugify(slug);
    }

    return this.repo.update(article.id, {
      ...input,
      slug,
    });
  }

  /**
   * Admin CRM: Delete news article
   */
  async deleteNews(id: string): Promise<void> {
    const article = await this.repo.findByIdOrSlug(id);
    if (!article) {
      throw new NotFoundError('News article', 'NEWS_NOT_FOUND');
    }
    await this.repo.delete(article.id);
  }

  /**
   * Admin CRM: List all news articles including drafts
   */
  async listAllNewsForAdmin(): Promise<NewsArticle[]> {
    return this.repo.listAllForAdmin();
  }
}
