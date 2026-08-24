-- =============================================================================
-- Migration: 003_media_url_storage.sql
--
-- Replaces the base64 media table with a URL-based approach.
-- Files are stored in Supabase Storage (or any object storage).
-- Only the public URL and metadata are kept in PostgreSQL.
--
-- Run after: 002_add_locale_and_media.sql
-- =============================================================================

-- Drop the old view first (depends on media table)
DROP VIEW IF EXISTS public.media_meta;

-- Drop the old table (base64 approach)
DROP TABLE IF EXISTS public.media;

-- =============================================================================
-- NEW MEDIA TABLE — URL-based
--
-- Files are uploaded to Supabase Storage.
-- This table stores the resulting URL and metadata only.
--
-- Supabase Storage setup (one-time, in Dashboard):
--   Storage → New bucket → "media" → Public: true (or false for private)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.media (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Owner of this file
    uploader_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- File classification
    type         TEXT NOT NULL CHECK (type IN ('image', 'video', 'gif', 'document')),

    -- MIME type, e.g. 'image/jpeg', 'video/mp4', 'image/gif'
    mime_type    TEXT NOT NULL,

    -- Original filename (for display purposes)
    file_name    TEXT,

    -- Original file size in bytes
    size_bytes   INTEGER CHECK (size_bytes > 0),

    -- Public URL returned by Supabase Storage after upload
    -- Example: https://xxx.supabase.co/storage/v1/object/public/media/users/uuid/photo.jpg
    url          TEXT NOT NULL,

    -- Internal storage path (needed for deletion via Storage API)
    -- Example: users/ae6c00fe/photo.jpg
    storage_path TEXT NOT NULL,

    -- Which storage bucket the file lives in
    bucket       TEXT NOT NULL DEFAULT 'media',

    -- Optional: alt text / caption for accessibility and SEO
    alt_text     TEXT,

    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_media_uploader_id ON public.media(uploader_id);
CREATE INDEX IF NOT EXISTS idx_media_type        ON public.media(type);

-- =============================================================================
-- MEDIA_META VIEW — same columns, no change needed since `data` column is gone
-- =============================================================================

CREATE OR REPLACE VIEW public.media_meta AS
SELECT
    id,
    uploader_id,
    type,
    mime_type,
    file_name,
    size_bytes,
    url,
    storage_path,
    bucket,
    alt_text,
    created_at
FROM public.media;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Public media can be viewed by anyone (bucket is public anyway)
CREATE POLICY "Public media is viewable by all"
    ON public.media
    FOR SELECT
    USING (true);

-- Users can only insert their own media
CREATE POLICY "Users can insert their own media"
    ON public.media
    FOR INSERT
    WITH CHECK (auth.uid() = uploader_id);

-- Users can only delete their own media
CREATE POLICY "Users can delete their own media"
    ON public.media
    FOR DELETE
    USING (auth.uid() = uploader_id);

-- Users can update metadata (alt_text, file_name) for their own media
CREATE POLICY "Users can update their own media metadata"
    ON public.media
    FOR UPDATE
    USING (auth.uid() = uploader_id)
    WITH CHECK (auth.uid() = uploader_id);
