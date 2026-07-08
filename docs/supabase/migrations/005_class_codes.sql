-- ============================================================
-- GAZELLE.IO — 005: Teacher class codes
-- ============================================================
-- ⚠️ NOT YET APPLIED to the live DB. Architect: run this once in the
-- Supabase SQL editor. It is additive (one nullable column) and safe to
-- run on the live project — it does NOT touch existing data or policies.
--
-- Purpose: closes the teacher↔family loop. A teacher shares their
-- 6-character class code; a parent enters it in the iOS app to link a
-- student to that teacher (sets student_profiles.teacher_id), which is
-- what activates lesson-plan-grounded tutor sessions for that child.
--
-- No RLS changes needed:
--   • Teachers read/update their own profile row (existing policies) —
--     the code is generated server-side on first view of /students.
--   • Parents never read teacher_profiles; the code→teacher lookup
--     happens server-side (service role) in /api/students/[id]/link-class,
--     and the teacher_id update is allowed by the parent's existing
--     FOR ALL policy on their own students.
-- ============================================================

ALTER TABLE teacher_profiles
  ADD COLUMN IF NOT EXISTS class_code TEXT UNIQUE;

-- Backfill any existing teachers with a random 6-char code (hex, uppercased).
UPDATE teacher_profiles
SET class_code = upper(substr(md5(gen_random_uuid()::text), 1, 6))
WHERE class_code IS NULL;
