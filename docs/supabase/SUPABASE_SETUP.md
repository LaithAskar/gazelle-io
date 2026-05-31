# Gazelle.io — Supabase Setup Instructions
Follow this exactly, in order. Don't skip steps.
> If your Supabase project is already initialized (the architect reported running these previously), do NOT re-run the migrations. Instead, use this guide to *verify* the setup is intact — see Step 6 and the "Verifying an existing project" note at the bottom.
---
## Step 1 — Create Supabase Project
1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Settings:
   - **Name:** gazelle-io
   - **Database Password:** generate a strong one, save it somewhere safe
   - **Region:** US East (closest to majority of initial users)
   - **Plan:** Free tier is fine for MVP
4. Wait for project to initialize (~2 min)
---
## Step 2 — Get Your Keys
Go to **Settings → API** and copy:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   ← NEVER expose this client-side
```

Save these in:
- `.env.local` for the Next.js web app
- Vercel environment variables (before deploy)
- Xcode Secrets / Config.xcconfig for iOS (anon key only)
---
## Step 3 — Run Migrations
Go to **SQL Editor** in the Supabase dashboard. Run in this exact order:
1. Paste contents of `migrations/001_initial_schema.sql` → Run
2. Paste contents of `rls/002_rls_policies.sql` → Run
3. Paste contents of `storage/003_storage_buckets.sql` → Run
Check for errors after each. If any fail, do not proceed.
---
## Step 4 — Configure Auth
Go to **Authentication → Settings**:
- Enable the **Email** provider
- Disable email confirmations for MVP (faster dev cycle; enable before public launch)
- Set Site URL to `http://localhost:3000` for dev; update to the Vercel URL after deploy
- Add redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://your-vercel-url.vercel.app/auth/callback`
---
## Step 5 — Verify Vector Extension
Go to **Database → Extensions**, confirm `vector` is enabled. If not, enable it before agents try to write embeddings.
---
## Step 6 — Verify RLS is Working
In SQL Editor, run this sanity check:

```sql
-- Should return policies for all major tables
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

You should see policies on: users, teacher_profiles, parent_profiles, student_profiles, lesson_plans, questions, sessions, session_responses, insight_reports.
---
## Step 7 — Environment Variables Checklist
Before any agent or app code runs, confirm these exist:
### Next.js / Vercel

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
APIFY_API_KEY=
```

### iOS (Xcode)

```
SUPABASE_URL=
SUPABASE_ANON_KEY=     ← anon key only, never service role on device
```

---
## What the Agents Use
| Agent | Supabase Access | Key Tables |
|-------|----------------|------------|
| Tutor | Service role (via Edge Function) | sessions, session_responses, student_profiles, questions |
| Planner | Service role (via API route) | lesson_plans, questions, curriculum_standards, curriculum_knowledge |
| Curriculum | Service role (via Edge Function, scheduled) | curriculum_standards, curriculum_knowledge, sessions, insight_reports |
All agents use the **service role key server-side only**. Never in Swift / client code.
---
## Verifying an Existing Project (instead of re-running migrations)
If the database is already set up, confirm it from the command line rather than re-applying SQL:

```bash
# Install the Supabase CLI if needed, then link to your project
supabase link --project-ref <your-project-ref>
# Dump the live schema — this becomes the authoritative 001_initial_schema.sql
supabase db dump --schema public > docs/supabase/migrations/001_initial_schema.sql
# Confirm the vector extension and tables exist
supabase db dump --schema public | grep -E "CREATE TABLE|CREATE EXTENSION"
```

If the dump returns the expected tables, Supabase is live and set up. If it errors or returns nothing, the setup did not persist and you'll need to run the migrations from scratch — flag this to the architect before doing so.
---
## Done
Once all steps complete (or the existing setup is verified), confirm with the architect before handing to any agent.
