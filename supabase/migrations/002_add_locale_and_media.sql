-- =============================================================================
-- Migration: 002_add_locale_and_media.sql
--
-- Adds:
--   1. `locale` column to the profiles table
--   2. `media` table for base64-encoded file storage
--   3. `media_meta` view (metadata without the large data column)
--
-- Run after: 001_create_profiles.sql
-- =============================================================================

-- =============================================================================
-- 1. PROFILES — Add locale column
-- =============================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en'
    CHECK (locale IN ('en', 'tr'));

-- Update existing rows that may have no locale set
UPDATE public.profiles SET locale = 'en' WHERE locale IS NULL;

-- Update the auto-create trigger to include locale from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, locale)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'locale', 'en')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 2. MEDIA TABLE
--
-- Stores files as base64-encoded TEXT.
--
-- ⚠️  PERFORMANCE WARNING:
--   - Images: acceptable (< 5 MB → < 6.7 MB base64)
--   - Videos: problematic (50 MB → ~67 MB TEXT per row)
--     Recommendation: Use Supabase Storage for videos and store the URL here.
--
-- The `media_meta` view allows querying file metadata without
-- loading the base64 data into memory.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.media (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Owner of this file
    uploader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- File type classification
    type        TEXT NOT NULL CHECK (type IN ('image', 'video', 'document')),

    -- MIME type, e.g. 'image/jpeg', 'video/mp4'
    mime_type   TEXT NOT NULL,

    -- Original filename (optional, for display purposes only)
    file_name   TEXT,

    -- Original file size in bytes (before base64 encoding)
    size_bytes  INTEGER CHECK (size_bytes > 0),

    -- base64-encoded file content
    -- For images:  full base64 string
    -- For videos:  full base64 string (⚠️ see warning above)
    data        TEXT NOT NULL,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fetching a user's media files
CREATE INDEX IF NOT EXISTS idx_media_uploader_id ON public.media(uploader_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON public.media(type);

-- =============================================================================
-- 3. MEDIA_META VIEW
--
-- Queries metadata without loading the large `data` column.
-- Use this for listing/searching files. Only fetch `data` when needed.
-- =============================================================================

CREATE OR REPLACE VIEW public.media_meta AS
SELECT
    id,
    uploader_id,
    type,
    mime_type,
    file_name,
    size_bytes,
    created_at
FROM public.media;

-- =============================================================================
-- 4. RLS for media table
-- =============================================================================

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Users can view their own media
CREATE POLICY "Users can view their own media"
    ON public.media
    FOR SELECT
    USING (auth.uid() = uploader_id);

-- Users can upload their own media
CREATE POLICY "Users can insert their own media"
    ON public.media
    FOR INSERT
    WITH CHECK (auth.uid() = uploader_id);

-- Users can delete their own media
CREATE POLICY "Users can delete their own media"
    ON public.media
    FOR DELETE
    USING (auth.uid() = uploader_id);
