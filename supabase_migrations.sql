-- Run these in your Supabase SQL editor in order.
-- NOTE: Embeddings use Google text-embedding-004 → 768 dimensions (not 1536).

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Posts table (768-dim embeddings for Google text-embedding-004)
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  topic TEXT NOT NULL,
  tone TEXT NOT NULL,
  cta TEXT,
  length TEXT DEFAULT 'medium',
  include_hashtags BOOLEAN DEFAULT TRUE,
  draft_a TEXT,
  draft_b TEXT,
  final_post TEXT NOT NULL,
  winning_variant TEXT,
  virality_score_a FLOAT,
  virality_score_b FLOAT,
  critique_a JSONB DEFAULT '{}',
  critique_b JSONB DEFAULT '{}',
  embedding VECTOR(768),
  impressions INT DEFAULT 0,
  reactions INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  reposts INT DEFAULT 0,
  engagement_score FLOAT DEFAULT 0,
  research_context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS posts_embedding_idx ON posts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS posts_tone_idx ON posts (tone);
CREATE INDEX IF NOT EXISTS posts_engagement_idx ON posts (engagement_score DESC);
CREATE INDEX IF NOT EXISTS posts_created_idx ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS posts_not_deleted_idx ON posts (deleted_at) WHERE deleted_at IS NULL;

-- 4. Disable RLS (backend uses service key)
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- 5. Similarity search RPC function (768 dims)
CREATE OR REPLACE FUNCTION match_posts(
  query_embedding VECTOR(768),
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  session_id UUID,
  topic TEXT,
  tone TEXT,
  cta TEXT,
  length TEXT,
  include_hashtags BOOLEAN,
  draft_a TEXT,
  draft_b TEXT,
  final_post TEXT,
  winning_variant TEXT,
  virality_score_a FLOAT,
  virality_score_b FLOAT,
  critique_a JSONB,
  critique_b JSONB,
  impressions INT,
  reactions INT,
  comments INT,
  shares INT,
  reposts INT,
  engagement_score FLOAT,
  research_context TEXT,
  created_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id, session_id, topic, tone, cta, length, include_hashtags,
    draft_a, draft_b, final_post, winning_variant,
    virality_score_a, virality_score_b,
    critique_a, critique_b,
    impressions, reactions, comments, shares, reposts,
    engagement_score, research_context,
    created_at, deleted_at,
    1 - (embedding <=> query_embedding) AS similarity
  FROM posts
  WHERE deleted_at IS NULL
    AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================
-- V2 MIGRATIONS — run these after the v1 migrations above
-- ============================================================

-- 6. Add business impact columns to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS business_impact_score FLOAT DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS business_impact_rationale TEXT DEFAULT '';

-- 7. Topics table
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  rationale TEXT,
  suggested_tone TEXT DEFAULT 'thought-leadership',
  priority_score INT DEFAULT 5,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ DEFAULT NULL,
  post_id UUID REFERENCES posts(id) DEFAULT NULL
);

ALTER TABLE topics DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS topics_status_idx ON topics (status);
CREATE INDEX IF NOT EXISTS topics_created_idx ON topics (created_at DESC);

-- ============================================================
-- If you already ran the old migration with VECTOR(1536), run this to migrate:
-- ALTER TABLE posts ALTER COLUMN embedding TYPE VECTOR(768) USING NULL;
-- DROP FUNCTION IF EXISTS match_posts(VECTOR(1536), INT);
-- Then re-create the function above and the ivfflat index.
