-- =============================================================================
-- Migration: 001_create_profiles.sql
--
-- Creates the application-level user profiles table and wires it to
-- Supabase Auth (auth.users) via a trigger.
--
-- Architecture note:
--   - auth.users  → managed by Supabase Auth (passwords, OAuth, MFA, etc.)
--   - profiles    → managed by this application (name, role, avatar, etc.)
--   - profiles.id = auth.users.id  (UUID, same value)
--
-- Future tables will reference profiles.id as their user FK:
--   posts.author_id   → profiles.id
--   comments.user_id  → profiles.id
--   notifications.user_id → profiles.id
-- =============================================================================

-- Enable UUID extension (already enabled on Supabase by default, but safe to run)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUM: user_role
-- =============================================================================

CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');

-- =============================================================================
-- TABLE: profiles
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    -- Primary key mirrors auth.users.id — no separate UUID generation needed
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    email           TEXT        NOT NULL UNIQUE,
    name            TEXT        NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
    avatar_url      TEXT,
    role            user_role   NOT NULL DEFAULT 'user',

    -- Soft delete — preserves historical data (e.g., authored posts remain)
    deleted_at      TIMESTAMPTZ,

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email       ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role        ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at  ON public.profiles(deleted_at) WHERE deleted_at IS NULL;

-- =============================================================================
-- TRIGGER: auto-update updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- TRIGGER: auto-create profile on Supabase Auth sign-up
--
-- When a user registers via Supabase Auth, this trigger automatically
-- creates the corresponding profile row. This keeps the two tables in sync
-- without requiring an explicit API call.
--
-- Note: The trigger reads the name from auth.users.raw_user_meta_data,
-- which is populated by the `options.data` field in supabase.auth.signUp().
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING; -- Idempotent: safe to re-run
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger fires after every new auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view their own profile
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id AND deleted_at IS NULL);

-- Policy: Authenticated users can update their own profile
-- (role changes must go through the service role / admin API)
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        -- Prevent self-elevation: users cannot change their own role
        AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    );

-- Policy: Service role has full access (used by our backend with service key)
-- Note: Service role bypasses RLS by default — this is here for documentation clarity.

-- =============================================================================
-- FUTURE TABLES (reference only — implement in later migrations)
-- =============================================================================

-- These tables are NOT created here. They are listed to document the
-- ID-based relational architecture for future migrations.

-- posts
--   id           UUID PK DEFAULT uuid_generate_v4()
--   author_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT
--   slug         TEXT UNIQUE NOT NULL
--   title        TEXT NOT NULL
--   content      TEXT
--   published_at TIMESTAMPTZ
--   deleted_at   TIMESTAMPTZ
--   created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
--   updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()

-- categories
--   id   UUID PK DEFAULT uuid_generate_v4()
--   slug TEXT UNIQUE NOT NULL
--   name TEXT NOT NULL

-- tags
--   id   UUID PK DEFAULT uuid_generate_v4()
--   slug TEXT UNIQUE NOT NULL
--   name TEXT NOT NULL

-- post_tags (junction)
--   post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE
--   tag_id  UUID NOT NULL REFERENCES tags(id)  ON DELETE CASCADE
--   PRIMARY KEY (post_id, tag_id)

-- comments
--   id                UUID PK DEFAULT uuid_generate_v4()
--   post_id           UUID NOT NULL REFERENCES posts(id)     ON DELETE CASCADE
--   user_id           UUID NOT NULL REFERENCES profiles(id)  ON DELETE SET NULL
--   parent_comment_id UUID REFERENCES comments(id)           ON DELETE CASCADE
--   content           TEXT NOT NULL
--   deleted_at        TIMESTAMPTZ
--   created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
--   updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()

-- notifications
--   id         UUID PK DEFAULT uuid_generate_v4()
--   user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
--   type       TEXT NOT NULL
--   payload    JSONB
--   read_at    TIMESTAMPTZ
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

-- bookmarks
--   id         UUID PK DEFAULT uuid_generate_v4()
--   user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
--   post_id    UUID NOT NULL REFERENCES posts(id)    ON DELETE CASCADE
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
--   UNIQUE (user_id, post_id)

-- subscriptions
--   id         UUID PK DEFAULT uuid_generate_v4()
--   user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
--   plan       TEXT NOT NULL
--   expires_at TIMESTAMPTZ
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
--   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
