/**
 * src/types/news.types.ts
 *
 * Domain types for News and Announcements module.
 */

import type { PublicProfileView } from './auth.types';

export interface NewsArticle {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  summary: string | null;
  contentHtml: string;
  coverImageUrl: string | null;
  imageUrls: string[];
  isPublished: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  author?: PublicProfileView | undefined;
}

export interface CreateNewsInput {
  title: string;
  slug?: string | undefined;
  summary?: string | undefined;
  contentHtml: string;
  coverImageUrl?: string | undefined;
  imageUrls?: string[] | undefined;
  isPublished?: boolean | undefined;
}

export interface UpdateNewsInput {
  title?: string | undefined;
  slug?: string | undefined;
  summary?: string | undefined;
  contentHtml?: string | undefined;
  coverImageUrl?: string | undefined;
  imageUrls?: string[] | undefined;
  isPublished?: boolean | undefined;
}
