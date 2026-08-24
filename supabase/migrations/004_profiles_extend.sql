-- =============================================================================
-- Migration: 004_profiles_extend.sql
--
-- Extends profiles table with:
--   - username (unique @handle)
--   - bio, website_url, location
--   - is_verified + verified_at (blue tick)
--   - is_private (profile privacy)
--
-- Also enables Supabase Realtime on profiles table.
--
-- Run after: 003_media_url_storage.sql
-- =============================================================================

-- =============================================================================
-- 1. ADD NEW COLUMNS
-- =============================================================================

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS username    TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS bio         TEXT,
    ADD COLUMN IF NOT EXISTS website_url TEXT,
    ADD COLUMN IF NOT EXISTS location    TEXT,
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_private  BOOLEAN NOT NULL DEFAULT FALSE;

-- =============================================================================
-- 2. CONSTRAINTS
-- =============================================================================

-- Username format: lowercase letters, numbers, underscore, 1-30 chars
-- NULL is allowed (user hasn't set a username yet)
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_username_format;

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_username_format
    CHECK (username IS NULL OR username ~ '^[a-z0-9_]{1,30}$');

-- Bio length limit
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_bio_length;

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_bio_length
    CHECK (bio IS NULL OR char_length(bio) <= 500);

-- Location length limit
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_location_length
    CHECK (location IS NULL OR char_length(location) <= 100);

-- verified_at must be set when is_verified is true
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_verified_consistency
    CHECK (
        (is_verified = FALSE AND verified_at IS NULL) OR
        (is_verified = TRUE AND verified_at IS NOT NULL)
    );

-- =============================================================================
-- 3. INDEX — username lookups
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_username
    ON public.profiles(username)
    WHERE username IS NOT NULL;

-- =============================================================================
-- 4. REALTIME — enable full row broadcasting
--
-- REPLICA IDENTITY FULL makes Supabase Realtime broadcast the full row
-- (before + after) on UPDATE and DELETE events.
--
-- Frontend subscribes directly:
--   supabase.channel('x')
--     .on('postgres_changes', { table: 'profiles', filter: `id=eq.${userId}` }, cb)
--     .subscribe()
-- =============================================================================

ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Enable publication for realtime (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;
END $$;

-- =============================================================================
-- 5. UPDATE RLS POLICIES
--
-- Public profiles: anyone can read all fields
-- Private profiles: only owner or admin can read full data
-- The filtering of private profiles is done in the API layer (service).
-- RLS only enforces write access here.
-- =============================================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Anyone can read profiles (privacy filtering done at API layer)
CREATE POLICY "Profiles are publicly readable"
    ON public.profiles
    FOR SELECT
    USING (deleted_at IS NULL);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
