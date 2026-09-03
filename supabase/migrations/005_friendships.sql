-- =============================================================================
-- Migration: 005_friendships.sql
--
-- Creates friendships table for Facebook-style friend/follow relationships.
-- Statuses: 'pending' (request sent), 'accepted' (friends), 'blocked' (blocked)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.friendships (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status       TEXT NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT friendships_status_check CHECK (status IN ('pending', 'accepted', 'blocked')),
    CONSTRAINT friendships_no_self_add CHECK (requester_id <> addressee_id),
    CONSTRAINT friendships_unique_pair UNIQUE (requester_id, addressee_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Friendships readable by involved users" ON public.friendships;
CREATE POLICY "Friendships readable by involved users"
    ON public.friendships
    FOR SELECT
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id OR status = 'accepted');

DROP POLICY IF EXISTS "Users can create friend requests" ON public.friendships;
CREATE POLICY "Users can create friend requests"
    ON public.friendships
    FOR INSERT
    WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Involved users can update friendship status" ON public.friendships;
CREATE POLICY "Involved users can update friendship status"
    ON public.friendships
    FOR UPDATE
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "Involved users can delete friendship" ON public.friendships;
CREATE POLICY "Involved users can delete friendship"
    ON public.friendships
    FOR DELETE
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
