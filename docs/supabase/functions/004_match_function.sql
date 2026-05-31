-- ============================================================
-- GAZELLE.IO — RAG similarity search function
-- Run AFTER 001–003. Additive only (no data changes).
-- ============================================================
-- Cosine-similarity search over curriculum_knowledge embeddings.
-- Called server-side by the agents via the service role (curriculum_knowledge
-- has RLS enabled with no client policies, so only the service role sees rows).
-- Dimension MUST match the embedding column: vector(1024) = Voyage voyage-3.5.
-- ============================================================

CREATE OR REPLACE FUNCTION match_curriculum_knowledge(
  query_embedding VECTOR(1024),
  match_count     INT DEFAULT 5,
  filter_grade    INT DEFAULT NULL,
  filter_subject  TEXT DEFAULT NULL
)
RETURNS TABLE (
  id          UUID,
  content     TEXT,
  grade       INT,
  subject     TEXT,
  source      TEXT,
  standard_id UUID,
  similarity  FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ck.id,
    ck.content,
    ck.grade,
    ck.subject,
    ck.source,
    ck.standard_id,
    1 - (ck.embedding <=> query_embedding) AS similarity
  FROM curriculum_knowledge ck
  WHERE ck.embedding IS NOT NULL
    AND (filter_grade   IS NULL OR ck.grade   = filter_grade)
    AND (filter_subject IS NULL OR ck.subject = filter_subject)
  ORDER BY ck.embedding <=> query_embedding
  LIMIT match_count;
$$;
