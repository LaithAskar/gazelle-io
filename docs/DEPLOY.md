# Gazelle.io — Deploying the Web Dashboard to Vercel

The teacher dashboard (`apps/web`) deploys to Vercel from the GitHub repo
(`LaithAskar/gazelle-io`). This is a Turborepo + pnpm monorepo, so the key is
pointing Vercel at the `apps/web` subdirectory.

## 1. Import the repo
1. Go to **vercel.com → Add New… → Project**.
2. Import **LaithAskar/gazelle-io** (authorize GitHub if prompted).
3. **Root Directory:** click *Edit* and select **`apps/web`**.
4. Framework preset auto-detects **Next.js**. Leave build/install commands at
   their defaults — Vercel installs the pnpm workspace from the repo root.

## 2. Environment variables
Add these in the import screen (or Project → Settings → Environment Variables).
Values are in your local `.env.local` — do NOT commit them.

| Name | Notes |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** — never prefix with NEXT_PUBLIC |
| `ANTHROPIC_API_KEY` | server only |
| `VOYAGE_API_KEY` | server only |
| `APIFY_API_KEY` | optional (post-MVP) |

Set them for **Production** (and Preview if you want PR previews).

## 3. Deploy
Click **Deploy**. First build takes a few minutes. The current Vercel project is
`gazelle-io-web`, so the public production URL should be
`https://gazelle-io-web.vercel.app` unless you add a custom domain.

### Confirm Fluid Compute is on (free-plan timeout fix)
Lesson generation takes ~15–30s (Claude + Voyage). The Hobby default function
limit is 10s, but **Fluid Compute** raises it to **60s** — and it's the default
for new projects (since Apr 2025). The agent routes already set `maxDuration=60`.
- Verify at **Project → Settings → Functions → Fluid Compute = Enabled**.
- If it's off, toggle it on and redeploy. (This is why we did NOT need Vercel Pro
  or an async-generation refactor.)

## 4. Point Supabase Auth at the deployed URL
In the Supabase dashboard → **Authentication → URL Configuration**:
- **Site URL:** `https://<your-vercel-domain>`
- **Redirect URLs:** add `https://<your-vercel-domain>/**`

(Currently set to `http://localhost:3000` for local dev — add the prod URL; keep
localhost for continued local work.)

## 5. Smoke-test production
- Visit the URL → public landing page should load; protected pages should redirect to `/auth`.
- If the URL returns `MIDDLEWARE_INVOCATION_FAILED`, confirm the Production env vars above exist in Vercel.
- If preview/deployment URLs redirect to `vercel.com/sso-api`, Vercel Deployment Protection is on; disable it for public demos or use the production domain.
- Sign up → land on the dashboard.
- Create a lesson plan → approve → confirm the question bank generates.

## Notes
- The agents run in Vercel **Node.js** serverless functions (API routes). Lesson
  generation makes Anthropic + Voyage calls; keep an eye on function duration on
  the Hobby plan (10s) — if generation times out, raise it on Pro or move
  generation to a background job (see the Curriculum-agent timeout note in
  CLAUDE.md / the build brief).
- Rotate any keys that were shared in plaintext before going to real users.
