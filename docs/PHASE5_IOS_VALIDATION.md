# Phase 5 iOS validation checklist

Use this checklist for local Xcode/manual validation before any deploy or TestFlight work. Do not use production keys beyond the approved anon key/API base URL configuration.

## Required configuration

- iOS config contains only public/client-safe values:
  - Supabase URL
  - Supabase anon key
  - API base URL for the local/staging Next.js API
- iOS config does not contain:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ANTHROPIC_API_KEY`
  - `VOYAGE_API_KEY`
  - answer keys/correct answers
  - private server config
- Student access is through the parent-owned account/session only. Do not create student auth accounts.

## Parent/student routes

- Parent can sign in and load `/api/parent/profile`.
- Parent can create a student profile through `/api/students`.
- Parent can list only their own students.
- Parent cannot fetch or mutate another parent's student by ID.
- Deleting/editing student data remains parent-scoped.

## Tutor session routes

- Starting a session requires an authenticated parent.
- Starting a session for a student not owned by the parent returns `403` or `404`; it must not leak another student's data.
- Successful `/api/sessions/start` response includes:
  - `sessionId`
  - `questionId`
  - `question.prompt`
  - optional `question.choices`
  - `question.difficulty`
- Successful `/api/sessions/start` response must not include `correctAnswer`.
- Initial Tutor question behavior remains fail-closed:
  - agent output is written to `agent_logs` as pending before filtering,
  - strict filter approves/rejects before iOS receives it,
  - if generation/review fails after session creation, the session is marked `flagged` with `ended_at` and a structured summary.
- Submitting an answer requires the same parent-owned student/session pairing.
- Tutor feedback shown to the student is strict-filtered first; rejected feedback uses the safe fallback message.
- Ending a session requires the parent to own the session's student and returns a parent-facing structured summary.

## COPPA/data-retention guardrails

- No raw student chat transcript is stored.
- Session response rows store only structured data needed for progress and parent summaries.
- Parent remains the owner of student profile/session data.
- Student-facing API responses do not include private agent config, answer keys, service keys, or raw moderation metadata.

## Local verification commands

From the repository root:

```sh
pnpm verify:phase5
pnpm type-check
pnpm build
```

Optional manual API pass with a local Next.js server:

```sh
pnpm --filter @gazelle/web dev
```

Then exercise the iOS screens against the local API and repeat the checklist above in Xcode's network console/debug logs.
