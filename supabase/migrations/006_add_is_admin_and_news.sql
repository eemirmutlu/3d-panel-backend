-- =============================================================================
-- Migration: 006_add_is_admin_and_news.sql
--
-- Adds `is_admin` column to profiles table.
-- Creates `news` table for public news/announcements with multi-image support
-- and rich HTML formatted content.
-- =============================================================================

-- 1. Add `is_admin` column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Sync existing admin role to is_admin = true
UPDATE public.profiles SET is_admin = TRUE WHERE role = 'admin';

-- 2. Create `news` table
CREATE TABLE IF NOT EXISTS public.news (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    summary         TEXT,
    content_html    TEXT NOT NULL,
    cover_image_url TEXT,
    image_urls      TEXT[] DEFAULT '{}',
    is_published    BOOLEAN NOT NULL DEFAULT TRUE,
    published_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_news_published ON public.news(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_slug ON public.news(slug);

-- RLS Policies for News
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published news" ON public.news;
CREATE POLICY "Public can view published news"
    ON public.news
    FOR SELECT
    USING (is_published = TRUE OR auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = TRUE));

DROP POLICY IF EXISTS "Admins can manage news" ON public.news;
CREATE POLICY "Admins can manage news"
    ON public.news
    FOR ALL
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = TRUE));
