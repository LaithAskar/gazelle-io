# Gazelle.io Launch QA Checklist

Status date: 2026-06-23
Scope: launch readiness, privacy, API boundaries, public env handling, student answer hiding, and manual verification steps.
Constraints: no deploy/push, no dependency changes, no Supabase migrations/schema/RLS changes, and no secret exposure.

## Verification summary from this pass

### Static review completed

- Reviewed all current web API route handlers under `apps/web/app/api`:
  - `parent/profile`
  - `students`
  - `students/[id]`
  - `sessions`
  - `sessions/start`
  - `sessions/respond`
  - `sessions/end`
  - `lessons/generate`
  - `lessons/[id]/approve`
  - `insights`
- Reviewed Supabase client boundaries:
  - browser/web client uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - request-scoped API client accepts iOS bearer-token auth and still uses the anon key, not the service-role key.
  - service-role usage is isolated to server/agent paths and the `sessions/respond` approved-question lookup.
- Reviewed iOS client/model surface:
  - iOS config uses API base URL, Supabase URL, and Supabase anon key only.
  - iOS `TutorQuestion` model has `prompt`, optional `choices`, and `difficulty`; no `correctAnswer` field.
  - iOS API requests send the parent access token via the standard authorization header.
- Static searches found no `SUPABASE_SERVICE_ROLE_KEY`, provider server API keys, or correct-answer fields in Swift files or web `.tsx` files.
- `pnpm type-check` passed.

### Findings

- ✅ Parent/student APIs are explicitly parent-scoped before reads, writes, deletes, session starts, answer submissions, and session ending.
- ✅ `/api/sessions/start` serializes only `prompt`, optional `choices`, and `difficulty`; it does not return `correctAnswer`.
- ✅ `/api/sessions/respond` re-loads the approved tutor question server-side from `agent_logs` using service role after verifying parent-owned student/session pairing.
- ✅ Tutor initial-question failures are fail-closed by flagging/ending the created session before surfacing a failure.
- ✅ Teacher dashboard API routes use `getCurrentTeacher()` and teacher ownership/RLS checks for lesson/insight flows.
- ✅ Client-facing public env usage appears limited to Supabase URL/anon key and API base URL.
- ⚠️ Full parent account deletion is not implemented in-app; current iOS copy correctly says full parent account deletion needs an approved backend/support process before public shipping.
- ⚠️ No explicit application-level rate limiting was found on public API routes. This is acceptable for local/demo launch, but should be revisited before broader public release.
- ⚠️ Manual cross-account API tests still need to be run against a local/staging server with two real test parent accounts; static review cannot prove live RLS/auth behavior by itself.

## Pre-launch hard gates

Do not launch publicly until all hard gates are checked.

- [ ] No real secrets are committed or printed in logs.
- [ ] `.env.local` remains gitignored and uncommitted.
- [ ] iOS app/config contains only:
  - [ ] API base URL
  - [ ] Supabase URL
  - [ ] Supabase anon key
- [ ] iOS app/config does **not** contain:
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `ANTHROPIC_API_KEY`
  - [ ] `VOYAGE_API_KEY`
  - [ ] `APIFY_API_KEY`
  - [ ] answer keys/correct answers
- [ ] No schema/RLS migrations are rerun for launch QA.
- [ ] Vercel/Supabase deploy changes are not made without explicit approval.

## Automated verification commands

Run from repo root:

```sh
pnpm verify:phase5
pnpm type-check
pnpm build
```

Expected result: all pass.

Commands run during this pass:

```sh
pnpm type-check
```

Observed result: passed; 9/9 Turborepo type-check tasks successful from cache.

## Static privacy/API-boundary checks

Use code search, not `.env` printing, for these checks.

- [ ] Search Swift files for server-only keys and answer fields:
  - expected: no matches for service-role/provider keys or correct-answer fields.
- [ ] Search web `.tsx` files for server-only keys, `createServiceRoleClient`, and correct-answer fields:
  - expected: no matches.
- [ ] Confirm `apps/web/lib/supabase/client.ts` uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Confirm `apps/web/lib/supabase/server.ts#createRequestClient` uses anon key plus request bearer token, not service role.
- [ ] Confirm `packages/db/src/server.ts#createServiceRoleClient` remains server-only and is not imported by client components.
- [ ] Confirm iOS `TutorQuestion` does not decode/store `correctAnswer`.

## Manual API verification matrix

Recommended setup:

1. Start a local Next.js API server with approved local env values.
2. Create/sign in two parent test users: Parent A and Parent B.
3. Create at least one student under each parent.
4. Use real Supabase parent access tokens in the standard authorization header.
5. Do not paste tokens into committed files or screenshots.

### Parent profile

- [ ] Unauthenticated `GET /api/parent/profile` returns `401`.
- [ ] Authenticated parent without profile can create one via `POST /api/parent/profile`.
- [ ] Parent can update only their own profile name.
- [ ] Response includes user id/email and parent profile only; no server config/secrets.

### Students

- [ ] Unauthenticated `GET /api/students` returns `401`.
- [ ] Parent A can create a valid student with grade `0-6`, age `4-13`, and pace `slow|steady|fast`.
- [ ] Invalid student payloads return `400`:
  - missing/blank name
  - grade outside `0-6`
  - age outside `4-13`
  - non-array subject lists
- [ ] Parent A list returns only Parent A students.
- [ ] Parent B list returns only Parent B students.
- [ ] Parent A `PATCH /api/students/{parentBStudentId}` returns `403` or `404` and does not mutate Parent B data.
- [ ] Parent A `DELETE /api/students/{parentBStudentId}` returns `403` or `404` and does not delete Parent B data.
- [ ] Parent A can delete Parent A student only after confirming destructive action in the app.

### Sessions list

- [ ] Unauthenticated `GET /api/sessions` returns `401`.
- [ ] Parent A `GET /api/sessions` returns sessions only for Parent A-owned students.
- [ ] Parent A `GET /api/sessions?studentId={parentBStudentId}` returns `403` or `404`.
- [ ] Session list response does not include raw agent logs, answer keys, or provider metadata.

### Tutor session start

- [ ] Unauthenticated `POST /api/sessions/start` returns `401`.
- [ ] Missing/blank `studentId` returns `400`.
- [ ] Parent A cannot start a session for Parent B student; expected `403` or `404`.
- [ ] Parent A can start a session for Parent A student.
- [ ] Successful response includes only:
  - [ ] `sessionId`
  - [ ] `questionId`
  - [ ] `question.prompt`
  - [ ] optional `question.choices`
  - [ ] `question.difficulty`
- [ ] Successful response does **not** include:
  - [ ] `correctAnswer`
  - [ ] `correct_answer`
  - [ ] raw `agent_logs.output`
  - [ ] moderation/filter metadata
  - [ ] server/provider config
- [ ] If initial tutor generation/review fails after session creation, the session is marked `flagged`, gets `ended_at`, and has a structured summary rather than showing unapproved content.

### Tutor answer submission

- [ ] Unauthenticated `POST /api/sessions/respond` returns `401`.
- [ ] Missing `sessionId`, `studentId`, `questionId`, or answer returns `400`.
- [ ] Answers over 500 trimmed characters return `400`.
- [ ] Parent A cannot submit for Parent B student/session; expected `403` or `404`.
- [ ] Parent A cannot submit a mismatched Parent A student id with a different student's session id; expected `403`.
- [ ] Unknown/unapproved/wrong-session `questionId` returns `404`.
- [ ] Valid submission returns only `isCorrect`, `feedback`, and `nextDifficulty`.
- [ ] Valid submission response does not include `correctAnswer` or raw agent log output.
- [ ] Rejected feedback is replaced with the safe fallback message before reaching the child.

### Tutor session end

- [ ] Unauthenticated `POST /api/sessions/end` returns `401`.
- [ ] Missing/blank `sessionId` returns `400`.
- [ ] Parent A cannot end Parent B session; expected `403` or `404`.
- [ ] Parent A can end Parent A session.
- [ ] End response includes a structured parent-facing session summary.
- [ ] End response does not include raw tutor prompts, answer keys, provider metadata, or secrets.

### Teacher dashboard APIs

- [ ] Unauthenticated teacher routes return `401` or redirect via middleware for page routes.
- [ ] Teacher can generate a lesson only after sign-in and teacher profile resolution.
- [ ] Generated lesson is saved as draft/pending-review flow; do not imply automatic classroom publishing.
- [ ] Teacher can approve only their own lesson id.
- [ ] Question-bank generation failure during approval is non-fatal and does not expose provider errors/secrets.
- [ ] Insights route is teacher-authenticated and returns only the report id from the API route.

## Manual iOS QA

- [ ] Fresh install launches without signed-in state.
- [ ] Parent sign-up/sign-in succeeds with Supabase anon-key auth only.
- [ ] Student account creation is not available; students remain parent-owned profiles.
- [ ] Parent profile creation/update works.
- [ ] Student create/edit/delete works and reflects server state after refresh.
- [ ] Tutor start screen displays only prompt/choices/difficulty.
- [ ] Tutor screen never displays or logs `correctAnswer`.
- [ ] Submit answer shows child-safe feedback.
- [ ] Parent dashboard/history shows summaries without raw chat transcripts.
- [ ] Settings/data deletion copy clearly distinguishes child profile deletion from full parent account deletion.
- [ ] Network inspector/debug logs do not show server-only keys or answer keys.

## Launch-readiness gaps to resolve or consciously accept

- [ ] Decide whether demo launch is local/video-only, staging URL, or public Vercel URL.
- [ ] If public Vercel URL: complete `docs/DEPLOY.md` smoke test with explicit approval.
- [ ] Add/confirm support process for full parent account deletion before real public users.
- [ ] Decide whether to add rate limiting or keep launch limited/private.
- [ ] Prepare deterministic demo data/screenshots without exposing real student data.
- [ ] Re-run the automated checks immediately before any deploy/share.
