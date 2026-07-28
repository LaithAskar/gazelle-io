# Gazelle.io Launch and Next Phase Plan

Status date: 2026-06-23
Owner/architect: Laith
Repo rules: no schema/RLS changes, no new libraries/tools, no deploy/push/posting without explicit approval.

## Current verified state

- Verification scope: launch-polish web/docs changes based on the current default branch; uncompiled iOS edits are excluded from this change set.
- `pnpm verify:phase5` passes.
- `pnpm type-check` passes after adding a typed placeholder for the deferred Apify package.
- `pnpm build` passes for the Next.js web app.
- Public landing page exists at `/`.
- Teacher dashboard routes exist for auth, dashboard, lessons, lesson creation/review, lesson approval, students, and insights.
- iOS SwiftUI surface exists for parent auth, student profiles, tutor sessions, parent summaries, settings, and data deletion flows.
- Phase 5 API integration contract checks parent/student ownership, answer hiding, and rejected initial-question cleanup.

## Product positioning for launch

Use the honest positioning:

> Gazelle.io is a portfolio/demo build of an AI-powered K-6 adaptive learning platform. It demonstrates a real Next.js teacher dashboard, SwiftUI student/parent app surface, Supabase/RLS/pgvector data boundaries, and guarded AI agent workflows for tutoring, lesson planning, and curriculum insight.

Do not claim:

- production users
- paid customers
- App Store availability
- school/classroom adoption
- measured learning outcomes
- COPPA certification/legal compliance beyond implemented design guardrails

## Tool/app assessment

### PostHog

Verdict: high value after launch, but do not add before first deploy unless approved.

Why useful:
- Product analytics, funnels, session replay, feature flags, surveys, and error-style product debugging.
- Great for seeing whether visitors understand the landing page and whether dashboard users reach lesson generation.

Gazelle-specific caution:
- No third-party analytics on student data by default.
- If added, instrument only public marketing pages and teacher dashboard events first.
- Disable/mask session replay on authenticated/student-adjacent routes unless privacy settings are fully reviewed.

Recommended first events:
- `landing_viewed`
- `cta_teacher_signin_clicked`
- `auth_signup_started`
- `teacher_dashboard_viewed`
- `lesson_generation_started`
- `lesson_generation_succeeded`
- `lesson_approved`

### Mobbin

Verdict: high value for iOS and dashboard UX research.

Use for:
- onboarding flows
- parent dashboard patterns
- settings/data deletion flows
- child profile creation
- session summary screens
- teacher dashboard empty states

Do not copy visuals directly. Use it to extract proven flow patterns and interaction conventions.

### Refero

Verdict: high value as a web/mobile reference source, especially if using the MCP later.

Use for:
- landing page structure
- SaaS dashboard layout references
- mobile onboarding references
- modern empty states

Best use: cite 3-5 observed patterns before redesigning a screen, then document which patterns were adapted and why.

### Dribbble UI/UX

Verdict: medium value.

Good for mood, color, illustration, and hero-section inspiration. Weaker for real product UX because many shots are concept art, not production flows. Use it sparingly so Gazelle stays credible and functional.

### Aceternity UI

Verdict: medium value now; useful only for the public landing page if approved.

Why not default:
- The build contract says Tailwind only and no unapproved libraries.
- Aceternity often implies extra animated React/Framer Motion-style components.
- The teacher dashboard should stay professional and functional, not flashy.

Allowed direction without adding a dependency:
- Borrow design ideas manually using existing Tailwind.
- Use subtle gradients/cards on the public landing page only.
- Avoid animated effects on dashboard/student education flows.

### Godly / Recent

Verdict: low-to-medium value.

Use for landing-page inspiration only. It is broad web-design inspiration, not product-flow research. Helpful for polish, not core MVP execution.

### Conductor

Verdict: low value for this week unless you already have access.

Conductor is enterprise SEO/AEO/content intelligence. It is overkill before Gazelle has a deployed public URL, clear launch content, and baseline analytics. Revisit after launch if SEO/content becomes a serious acquisition channel.

## Best next phase before launch

Goal: make Gazelle credible, demoable, and promotable within 7-14 days.

### Phase 6A — Demo readiness and QA

1. Create a deterministic demo script:
   - landing page
   - teacher signup/signin
   - dashboard
   - generate lesson
   - approve lesson
   - show question bank
   - show students/insights
   - show iOS screens locally or as screenshots/video

2. Add demo-safe seed data path:
   - Keep real secrets out of repo.
   - Prefer a script or documented manual setup using existing schema only.
   - No migration reruns.

3. Add a QA checklist:
   - auth redirects
   - lesson generation success/failure
   - dashboard empty states
   - iOS API base URL config
   - parent-owned student/session access
   - no `correctAnswer` returned to iOS
   - no service-role key in client code

4. Record proof assets:
   - 60-90 second product walkthrough video
   - 3-5 screenshots: landing, dashboard, lesson generation, lesson approval/question bank, iOS parent/student screen
   - architecture diagram image or README section

### Phase 6B — Landing page polish

Keep it honest and recruiter/demo focused.

Must add/improve:
- A clearer above-the-fold value statement: “AI lesson planning + adaptive student practice, with guarded agent outputs.”
- A “How it works” section with Teacher → Planner → Approval → Student Tutor → Parent Summary.
- A “Built with engineering judgment” section: Supabase RLS, pgvector RAG, agent output review, no raw child chat logs.
- A “Demo status” section that explicitly says portfolio/demo build and lists what is implemented.
- A link to GitHub if the repo is public and safe to show.
- Optional: waitlist/contact form only if deployment and storage target are approved.

Avoid:
- over-animated marketing UI
- claims about outcomes or schools
- gamified kids visuals that imply a finished consumer product

### Phase 6C — Deployment smoke test

Requires explicit approval before doing it.

1. Deploy `apps/web` to Vercel per `docs/DEPLOY.md`.
2. Set environment variables in Vercel.
3. Confirm Fluid Compute is enabled.
4. Set Supabase auth Site URL/Redirect URLs to the deployed domain.
5. Smoke test:
   - landing loads
   - auth works
   - dashboard protected route works
   - lesson generation completes under timeout
   - approve flow creates question bank
   - no server secrets appear in client bundle/source

### Phase 6D — Optional analytics

Requires explicit approval because it adds a new external tool.

If approved, add PostHog only to:
- public landing page
- teacher dashboard event milestones

Do not enable student-flow replay or collect child/student identifiers.

## Launch/promotion plan

### Best channel mix

1. LinkedIn — highest ROI for Laith
   - Audience: recruiters, engineers, classmates, startup people.
   - Best angle: “I built a full-stack AI education platform demo with guarded agent outputs.”
   - Include demo video, 3 technical bullets, and what you learned.

2. GitHub README/repo polish
   - Recruiters and engineers will inspect this after LinkedIn.
   - Keep it honest: portfolio/demo build, not production traction.
   - Include architecture, verification commands, screenshots, and safety constraints.

3. Personal portfolio/resume
   - Add as a flagship project.
   - Emphasize architecture: Next.js, SwiftUI, Supabase RLS, pgvector RAG, Mastra agents, privacy guardrails.

4. X/Twitter or Bluesky — optional
   - Good if you want builder feedback.
   - Less directly useful for jobs than LinkedIn unless you already have tech followers.

5. Reddit/Hacker News/Product Hunt — not first
   - Use only after demo is deployed, stable, and has a crisp story.
   - Avoid pitching it as a real child-facing product until privacy/legal/reliability are much stronger.

### Launch sequence

Day 1-2:
- Complete QA and landing polish.
- Produce demo script.
- Record video/screenshots.

Day 3:
- Deploy web app with approved env setup.
- Smoke test production.
- Fix launch blockers.

Day 4:
- Update README and LinkedIn project entry.
- Draft LinkedIn post.
- Ask 3-5 trusted people for feedback privately.

Day 5:
- Public LinkedIn launch post.
- Pin/add to portfolio/resume.
- Send directly to selected recruiters/engineers as a project update, not spam.

Week 2:
- Iterate based on feedback.
- Add PostHog if approved and privacy-scoped.
- Publish a technical follow-up: “How I built guarded AI agents for a K-6 learning platform demo.”

## LinkedIn launch post draft

I’ve been building Gazelle.io, a portfolio/demo project for an AI-powered K-6 adaptive learning platform.

The goal was not just “chatbot for education.” I wanted to build a realistic full-stack system around guarded AI workflows:

- Next.js teacher dashboard for lesson planning and review
- SwiftUI student/parent app surface
- Supabase Auth/Postgres/RLS/storage with parent-owned student data boundaries
- pgvector + Voyage embeddings for curriculum RAG
- Mastra agents for lesson planning, tutoring, and curriculum insights
- agent outputs logged/reviewed/filtered before being shown

The biggest thing I learned: the hard part is not calling an LLM. The hard part is designing the product boundaries around it — especially when the domain involves kids, privacy, and teacher/parent review.

This is still a demo build, not a production classroom product, but it has been a strong way to practice AI product architecture, safety constraints, and full-stack implementation.

Demo/GitHub: [link]

## Launch blockers to resolve before public promotion

- Confirm web deployment URL works.
- Confirm Supabase auth redirect URLs include production domain.
- Confirm no secrets are exposed in client code or repo.
- Confirm lesson generation works in production within Vercel function limits.
- Confirm the README and landing page do not overclaim traction, compliance, or App Store availability.
- Decide whether GitHub repo is safe/public before linking it.
- Investigate local signup/account-creation error reported in Safari as `Load failed`; likely occurs during the client-side Supabase auth/profile bootstrap path and needs browser-console/network evidence before fixing.

## Later design caveats from Laith

- Reduce the generic dark-blue/teal “AI app” gradient look. Explore a warmer, education-specific palette that still feels modern: off-white, ink, soft green/blue accents, subtle paper/card textures, less neon glow.
- Keep the frontend sleek and digestible, but make it feel less like a generic AI SaaS template and more like a trusted parent/teacher/student learning product.
