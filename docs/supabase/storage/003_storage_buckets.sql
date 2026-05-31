-- ============================================================
-- GAZELLE.IO — Storage Bucket Setup
-- Run in Supabase SQL editor after RLS policies
-- (Fully recovered from the planning conversation.)
-- ============================================================

-- Lesson plan attachments (teacher uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-attachments',
  'lesson-attachments',
  false,
  10485760,  -- 10MB max
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
);

-- Curriculum source documents (Apify scraped content, stored for audit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'curriculum-sources',
  'curriculum-sources',
  false,
  52428800,  -- 50MB max
  ARRAY['application/json', 'text/plain', 'text/html']
);

-- ============================================================
-- STORAGE RLS
-- ============================================================

-- Teachers can upload/read their own lesson attachments
CREATE POLICY "teacher_lesson_attachments"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'lesson-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Curriculum sources: service role only
-- No public policies on curriculum-sources bucket
