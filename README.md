# Gazelle.io

Gazelle.io is an AI-powered adaptive learning platform for K-6 students (ages 5-12). It is structured as a monorepo with a Next.js teacher dashboard, a SwiftUI student/parent iOS surface, Supabase/Postgres/RLS/pgvector data foundations, and Mastra-based agent packages for tutoring, lesson planning, and curriculum insights.

This repository is a portfolio/demo build. It should not be described as having production users, paid customers, a deployed iOS app, or classroom adoption unless that evidence is added to the repo.

## What is demoable today

- Public landing page for recruiter/demo context at the web app root.
- Teacher dashboard routes for auth, lessons, students, lesson generation/review, and weekly insights.
- Server-side API routes that keep agent execution and privileged Supabase access out of client code.
- SwiftUI iOS project surface for parent auth, student profiles, tutor sessions, summaries, and settings/data deletion flows.
- Safety-oriented integration contract covering parent-owned student/session APIs, answer hiding, and fail-closed Tutor behavior.

## Architecture at a glance

| Area | Implementation |
| --- | --- |
| Web dashboard | Next.js 14, React, TypeScript, Tailwind |
| iOS app surface | Swift, SwiftUI |
| Data/auth/storage | Supabase Postgres, Auth, Storage, RLS |
| Retrieval | Supabase pgvector with Voyage `voyage-3.5` embeddings |
| Agents | Mastra packages for Tutor, Planner, and Curriculum workflows |
| Monorepo | Turborepo with pnpm workspaces |

## Monorepo layout

```
apps/
  web/                 # Next.js 14 teacher dashboard and public landing page
  ios/                 # SwiftUI student/parent app surface
packages/
  shared/              # Shared TypeScript types
  db/                  # Supabase client + typed queries
  rag/                 # Chunk, embed, ingest, and semantic search pipeline
  agents/
    core/              # Shared agent model/client/filter/logging utilities
    tutor/             # Student-facing Tutor workflow
    planner/           # Teacher-facing lesson planning workflow
    curriculum/        # Curriculum ingestion and insight workflow
scripts/
  apify/               # Curriculum scraping jobs for approved sources only
docs/                  # Spec, build brief, deployment notes, Supabase setup + SQL
```

## Local setup

1. `cp .env.example .env.local` and fill in local values. Never commit `.env.local`.
2. `pnpm install` from the repository root.
3. Do not re-run Supabase migrations against the live project. The schema/RLS/storage files in `docs/supabase/` are the reference artifacts.

## Useful verification commands

Run from the repository root:

```sh
pnpm verify:phase5
pnpm --filter @gazelle/web type-check
pnpm --filter @gazelle/agent-tutor type-check
```

For a broader local pass:

```sh
pnpm type-check
pnpm build
```

## Safety and product boundaries

- Service-role Supabase access is server-side only.
- Students do not own auth accounts; parent-owned boundaries protect student/session data.
- Tutor questions sent to iOS omit `correctAnswer`.
- Agent outputs are designed to be logged, reviewed, and filtered before user-facing use.
- No monetization logic is part of v1.
- Common Core is the MVP curriculum target; TEKS and additional standards are post-MVP.

## Primary docs

- `AGENTS.md` / `CLAUDE.md` — current project context and locked decisions.
- `docs/spec.md` — product specification.
- `docs/cowork-brief.md` — phase-by-phase build contract.
- `docs/PHASE5_IOS_VALIDATION.md` — manual iOS and API validation checklist.
- `docs/DEPLOY.md` — deployment notes.
