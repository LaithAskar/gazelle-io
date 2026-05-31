-- ============================================================
-- GAZELLE.IO — Initial Schema Migration  (AUTHORITATIVE DRAFT)
-- ============================================================
-- Authored from docs/spec.md Section 4 + COPPA rules.
-- STATUS: pending architect review. Do NOT apply to the live DB
-- until Laith has reviewed every line. Run order: 001 → 002 → 003.
--
-- Decisions / inferences are tagged  [DECISION]  — confirm each.
-- ============================================================

-- ---- Extensions ----
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";   -- pgvector, for RAG embeddings (NOT currently enabled on live project)

-- ---- updated_at helper ----
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- USERS
-- [DECISION] id references auth.users(id) (Supabase standard) rather
-- than generating its own UUID — this is what makes the RLS check
-- `id = auth.uid()` work. The app (packages/db) inserts the public.users
-- row on signup with the chosen role. Students get NO row here (no auth).
-- ============================================================
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('parent', 'teacher')),  -- [DECISION] 'student' removed: students have no auth account (COPPA). spec listed it but no student ever logs in.
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TEACHER PROFILES
-- ============================================================
CREATE TABLE teacher_profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  school      TEXT,
  state       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PARENT PROFILES
-- ============================================================
CREATE TABLE parent_profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STUDENT PROFILES  (owned by parent; no auth account)
-- [DECISION] grade CHECK is 0–6, where 0 = Kindergarten, to honor the
-- "Full K-6" range in CLAUDE.md. The spec's partial SQL said 1–6, which
-- excluded Kindergarten — flagged as a conflict. age CHECK 4–13.
-- COPPA: ON DELETE CASCADE from parent guarantees a parent deletion
-- wipes all child records.
-- ============================================================
CREATE TABLE student_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id           UUID NOT NULL REFERENCES parent_profiles(id) ON DELETE CASCADE,
  teacher_id          UUID REFERENCES teacher_profiles(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  grade               INT NOT NULL CHECK (grade BETWEEN 0 AND 6),   -- [DECISION] 0 = K
  age                 INT CHECK (age BETWEEN 4 AND 13),
  pace                TEXT DEFAULT 'medium' CHECK (pace IN ('slow', 'medium', 'fast')),
  strength_subjects   TEXT[] DEFAULT '{}',
  struggle_subjects   TEXT[] DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER student_profiles_updated_at BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_student_parent  ON student_profiles(parent_id);
CREATE INDEX idx_student_teacher ON student_profiles(teacher_id);

-- ============================================================
-- CURRICULUM STANDARDS  (Common Core, from approved sources)
-- ============================================================
CREATE TABLE curriculum_standards (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source        TEXT NOT NULL DEFAULT 'common_core',
  grade         INT NOT NULL CHECK (grade BETWEEN 0 AND 6),
  subject       TEXT NOT NULL,
  code          TEXT NOT NULL,        -- e.g. CCSS.MATH.CONTENT.3.OA.A.1
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (source, code)
);
CREATE INDEX idx_standards_grade_subject ON curriculum_standards(grade, subject);

-- ============================================================
-- CURRICULUM KNOWLEDGE  (RAG chunks + embeddings)
-- [CONFIRMED] embedding is VECTOR(1024) — Voyage AI `voyage-3.5`
-- (1024 dims), Anthropic's recommended embedding provider.
-- Supersedes the spec's "Anthropic embeddings API" (which does not exist).
-- Requires VOYAGE_API_KEY in env. Changing models later that output a
-- different dimension requires dropping/rebuilding this column + index.
-- ============================================================
CREATE TABLE curriculum_knowledge (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  standard_id   UUID REFERENCES curriculum_standards(id) ON DELETE SET NULL,
  source        TEXT NOT NULL,
  source_url    TEXT,
  grade         INT CHECK (grade BETWEEN 0 AND 6),
  subject       TEXT,
  content       TEXT NOT NULL,        -- the ~500-token chunk
  token_count   INT,
  embedding     VECTOR(1024),         -- Voyage voyage-3.5 (1024 dims)
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_knowledge_grade_subject ON curriculum_knowledge(grade, subject);
CREATE INDEX idx_knowledge_embedding ON curriculum_knowledge
  USING hnsw (embedding vector_cosine_ops);   -- [DECISION] HNSW + cosine

-- ============================================================
-- LESSON PLANS
-- status: draft → approved → active.  Planner always saves 'draft'.
-- [DECISION] content is JSONB (hook → instruction → practice → assessment).
-- ============================================================
CREATE TABLE lesson_plans (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id        UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  grade             INT NOT NULL CHECK (grade BETWEEN 0 AND 6),
  subject           TEXT NOT NULL,
  objectives        TEXT,
  duration_minutes  INT,
  content           JSONB NOT NULL DEFAULT '{}',
  standard_ids      UUID[] DEFAULT '{}',
  status            TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'approved', 'active')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER lesson_plans_updated_at BEFORE UPDATE ON lesson_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_lesson_plans_teacher ON lesson_plans(teacher_id);

-- ============================================================
-- QUESTIONS  (generated bank, tied to a lesson plan)
-- ============================================================
CREATE TABLE questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_plan_id  UUID NOT NULL REFERENCES lesson_plans(id) ON DELETE CASCADE,
  grade           INT CHECK (grade BETWEEN 0 AND 6),
  subject         TEXT,
  prompt          TEXT NOT NULL,
  question_type   TEXT,                 -- [DECISION] e.g. multiple_choice | short_answer
  choices         JSONB,                -- for multiple choice
  correct_answer  TEXT,
  difficulty      TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_questions_lesson ON questions(lesson_plan_id);

-- ============================================================
-- SESSIONS  (student practice sessions)
-- [DECISION] summary is JSONB — the structured parent-facing summary.
-- No raw chat is ever stored (COPPA).
-- ============================================================
CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  lesson_plan_id  UUID REFERENCES lesson_plans(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'in_progress'
                    CHECK (status IN ('in_progress', 'completed', 'flagged')),
  summary         JSONB,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sessions_student ON sessions(student_id);

-- ============================================================
-- SESSION RESPONSES  (structured answers — NO raw chat)
-- ============================================================
CREATE TABLE session_responses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question_id   UUID REFERENCES questions(id) ON DELETE SET NULL,
  is_correct    BOOLEAN,
  difficulty    TEXT,
  response_data JSONB,                  -- structured only
  responded_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_responses_session ON session_responses(session_id);

-- ============================================================
-- AGENT LOGS  (every agent output: pending → approved before surfacing)
-- [DECISION] added 'rejected' status for outputs that fail the filter.
-- Service-role only — no client RLS policies (see 002).
-- ============================================================
CREATE TABLE agent_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent         TEXT NOT NULL CHECK (agent IN ('tutor', 'planner', 'curriculum')),
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
  teacher_id    UUID REFERENCES teacher_profiles(id) ON DELETE SET NULL,
  student_id    UUID REFERENCES student_profiles(id) ON DELETE SET NULL,
  session_id    UUID REFERENCES sessions(id) ON DELETE SET NULL,
  input         JSONB,
  output        JSONB,
  filter_result JSONB,
  reason        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ
);
CREATE INDEX idx_agent_logs_status ON agent_logs(status);
CREATE INDEX idx_agent_logs_agent  ON agent_logs(agent);

-- ============================================================
-- INSIGHT REPORTS  (weekly, class-level, aggregated — NO individual PII)
-- ============================================================
CREATE TABLE insight_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id      UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  timeframe_start DATE,
  timeframe_end   DATE,
  report          JSONB NOT NULL,       -- aggregated only
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_insight_reports_teacher ON insight_reports(teacher_id);
