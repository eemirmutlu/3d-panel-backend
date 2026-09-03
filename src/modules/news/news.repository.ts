/**
 * src/modules/news/news.repository.ts
 *
 * Data access layer for the news table.
 */

import { getSupabaseAdmin } from '../../config/supabase';
import type { NewsArticle, CreateNewsInput, UpdateNewsInput } from '../../types/news.types';
import type { PublicProfileView, UserRole } from '../../types/auth.types';
import { InternalError } from '../../utils/errors';

interface JoinedAuthorRow {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  website_url: string | null;
  location: string | null;
  role: string;
  is_verified: boolean;
  verified_at: string | null;
  is_private: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

function mapAuthor(row: JoinedAuthorRow): PublicProfileView {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    websiteUrl: row.website_url,
    location: row.location,
    role: row.role as UserRole,
    isVerified: row.is_verified,
    verifiedAt: row.verified_at,
    isPrivate: false,
    isAdmin: !!(row.is_admin || row.role === 'admin'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapNews(row: any): NewsArticle {
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    contentHtml: row.content_html,
    coverImageUrl: row.cover_image_url,
    imageUrls: Array.isArray(row.image_urls) ? row.image_urls : [],
    isPublished: row.is_published,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: row.author ? mapAuthor(row.author) : undefined,
  };
}

export class NewsRepository {
  private get db() {
    return getSupabaseAdmin();
  }

  async listPublished(limit = 20, offset = 0): Promise<NewsArticle[]> {
    const { data, error } = await this.db
      .from('news')
      .select(`
        *,
        author:profiles!news_author_id_fkey (
          id, name, username, bio, avatar_url, website_url, location, role, is_verified, verified_at, is_private, is_admin, created_at, updated_at
        )
      `)
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new InternalError(`Failed to fetch news feed: ${error.message}`);
    }

    return (data || []).map(mapNews);
  }

  async findByIdOrSlug(idOrSlug: string): Promise<NewsArticle | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    let query = this.db.from('news').select(`
      *,
      author:profiles!news_author_id_fkey (
        id, name, username, bio, avatar_url, website_url, location, role, is_verified, verified_at, is_private, is_admin, created_at, updated_at
      )
    `);

    if (isUuid) {
      query = query.eq('id', idOrSlug);
    } else {
      query = query.eq('slug', idOrSlug.toLowerCase());
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw new InternalError(`Failed to fetch news article: ${error.message}`);
    }

    return data ? mapNews(data) : null;
  }

  async create(authorId: string, input: CreateNewsInput & { slug: string }): Promise<NewsArticle> {
    const { data, error } = await this.db
      .from('news')
      .insert({
        author_id: authorId,
        title: input.title,
        slug: input.slug,
        summary: input.summary ?? null,
        content_html: input.contentHtml,
        cover_image_url: input.coverImageUrl ?? null,
        image_urls: input.imageUrls ?? [],
        is_published: input.isPublished ?? true,
      })
      .select('*')
      .single();

    if (error) {
      throw new InternalError(`Failed to create news article: ${error.message}`);
    }

    return mapNews(data);
  }

  async update(id: string, input: UpdateNewsInput): Promise<NewsArticle> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) updateData['title'] = input.title;
    if (input.slug !== undefined) updateData['slug'] = input.slug.toLowerCase();
    if (input.summary !== undefined) updateData['summary'] = input.summary;
    if (input.contentHtml !== undefined) updateData['content_html'] = input.contentHtml;
    if (input.coverImageUrl !== undefined) updateData['cover_image_url'] = input.coverImageUrl;
    if (input.imageUrls !== undefined) updateData['image_urls'] = input.imageUrls;
    if (input.isPublished !== undefined) updateData['is_published'] = input.isPublished;

    const { data, error } = await this.db
      .from('news')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new InternalError(`Failed to update news article: ${error.message}`);
    }

    return mapNews(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('news').delete().eq('id', id);
    if (error) {
      throw new InternalError(`Failed to delete news article: ${error.message}`);
    }
  }

  async listAllForAdmin(): Promise<NewsArticle[]> {
    const { data, error } = await this.db
      .from('news')
      .select(`
        *,
        author:profiles!news_author_id_fkey (
          id, name, username, bio, avatar_url, website_url, location, role, is_verified, verified_at, is_private, is_admin, created_at, updated_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalError(`Failed to list all news for admin: ${error.message}`);
    }

    return (data || []).map(mapNews);
  }
}
