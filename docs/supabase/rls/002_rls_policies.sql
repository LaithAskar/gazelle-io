-- ============================================================
-- GAZELLE.IO — Row Level Security Policies  (AUTHORITATIVE DRAFT)
-- ============================================================
-- This is the COPPA boundary. Review EVERY policy before applying.
-- STATUS: pending architect review. Run AFTER 001_initial_schema.sql.
--
-- KEY PRINCIPLE: the service_role key BYPASSES RLS entirely. All three
-- agents run server-side with the service role, so they are unaffected
-- by these policies. RLS here governs CLIENT access only — what an
-- authenticated parent or teacher can see/do from the iOS app or web.
-- Students have NO auth account, so there are no student-role policies;
-- student data is reached only through the owning parent's session or
-- server-side via the service role.
-- ============================================================

-- ---- Enable RLS on every public table ----
ALTER TABLE users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_standards  ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_knowledge  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_responses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_reports       ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- SECURITY DEFINER so they read the profile tables without tripping
-- those tables' own RLS (prevents recursive policy evaluation).
-- ============================================================
CREATE OR REPLACE FUNCTION current_teacher_id()
RETURNS UUID AS $$
  SELECT id FROM teacher_profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION current_parent_id()
RETURNS UUID AS $$
  SELECT id FROM parent_profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- USERS — own record only
-- ============================================================
CREATE POLICY "users_select_own" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- TEACHER PROFILES — own profile only
-- ============================================================
CREATE POLICY "teacher_select_own" ON teacher_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "teacher_insert_own" ON teacher_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "teacher_update_own" ON teacher_profiles FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- PARENT PROFILES — own profile only
-- ============================================================
CREATE POLICY "parent_select_own" ON parent_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "parent_insert_own" ON parent_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "parent_update_own" ON parent_profiles FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- STUDENT PROFILES — core COPPA boundary
--  • Parent: full control over their OWN children
--  • Teacher: READ-ONLY for students linked to them
-- ============================================================
CREATE POLICY "student_parent_all" ON student_profiles FOR ALL
  USING (parent_id = current_parent_id())
  WITH CHECK (parent_id = current_parent_id());

CREATE POLICY "student_teacher_read" ON student_profiles FOR SELECT
  USING (teacher_id = current_teacher_id());

-- ============================================================
-- CURRICULUM STANDARDS — readable by any authenticated user
-- (public-domain Common Core; writes are service-role only)
-- ============================================================
CREATE POLICY "standards_read_authenticated" ON curriculum_standards FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- CURRICULUM KNOWLEDGE — service-role only.
-- RLS enabled with NO client policy = no client can read/write.
-- Agents (Planner/Tutor/Curriculum) reach it via the service role.
-- ============================================================
-- (intentionally no policies)

-- ============================================================
-- LESSON PLANS — teacher owns their own
-- ============================================================
CREATE POLICY "lesson_plans_teacher_all" ON lesson_plans FOR ALL
  USING (teacher_id = current_teacher_id())
  WITH CHECK (teacher_id = current_teacher_id());

-- ============================================================
-- QUESTIONS — scoped to the owning lesson plan's teacher
-- (students read questions only via the server-side Tutor / service role)
-- ============================================================
CREATE POLICY "questions_teacher_all" ON questions FOR ALL
  USING (lesson_plan_id IN (SELECT id FROM lesson_plans WHERE teacher_id = current_teacher_id()))
  WITH CHECK (lesson_plan_id IN (SELECT id FROM lesson_plans WHERE teacher_id = current_teacher_id()));

-- ============================================================
-- SESSIONS — read-only for the people allowed to see a child
--  • Parent: their own children's sessions
--  • Teacher: linked students' sessions
-- (writes happen server-side via the Tutor agent / service role)
-- ============================================================
CREATE POLICY "sessions_parent_read" ON sessions FOR SELECT
  USING (student_id IN (SELECT id FROM student_profiles WHERE parent_id = current_parent_id()));

CREATE POLICY "sessions_teacher_read" ON sessions FOR SELECT
  USING (student_id IN (SELECT id FROM student_profiles WHERE teacher_id = current_teacher_id()));

-- ============================================================
-- SESSION RESPONSES — same visibility as the parent session
-- ============================================================
CREATE POLICY "responses_parent_read" ON session_responses FOR SELECT
  USING (session_id IN (
    SELECT s.id FROM sessions s
    JOIN student_profiles sp ON sp.id = s.student_id
    WHERE sp.parent_id = current_parent_id()
  ));

CREATE POLICY "responses_teacher_read" ON session_responses FOR SELECT
  USING (session_id IN (
    SELECT s.id FROM sessions s
    JOIN student_profiles sp ON sp.id = s.student_id
    WHERE sp.teacher_id = current_teacher_id()
  ));

-- ============================================================
-- AGENT LOGS — service-role / architect only. No client policies.
-- The pending→approved review flow runs server-side.
-- ============================================================
-- (intentionally no policies)

-- ============================================================
-- INSIGHT REPORTS — teacher reads only their own class reports
-- (aggregated, no individual PII by construction in 001)
-- ============================================================
CREATE POLICY "insight_reports_teacher_read" ON insight_reports FOR SELECT
  USING (teacher_id = current_teacher_id());
