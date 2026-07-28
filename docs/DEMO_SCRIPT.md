# Gazelle.io demo script

Status: portfolio/demo build. Do not present this as a live school rollout, App Store release, paid product, or adoption claim.

## 60-90 second walkthrough script

**0:00-0:10 — Set context**
"Gazelle.io is a K-6 adaptive learning platform demo I built to connect the three people around a child's learning: teachers, parents, and students. The repo includes a Next.js teacher dashboard, a SwiftUI parent/student surface, Supabase data/auth/RLS foundations, pgvector retrieval, and Mastra-based agent workflows."

**0:10-0:25 — Show the landing page**
"The landing page is intentionally honest: this is a portfolio demo, not a claimed district deployment. The product story is that teachers plan with guardrails, parents understand progress, and students get short practice loops designed for their attention span."

**0:25-0:45 — Open the teacher dashboard**
"On the web side, a teacher can sign in, view recent lesson drafts, generate a new lesson plan, and request weekly insights. The important technical choice is that the AI output is not treated as automatically publishable — generated plans and tutor artifacts go through logged, reviewable states."

**0:45-1:05 — Show lesson generation/review path**
"The Planner route takes grade, subject, topic, objectives, and duration, then grounds the draft against Common Core-oriented curriculum content. The system keeps privileged Supabase access server-side and stores reviewable artifacts rather than exposing agent internals to the browser."

**1:05-1:20 — Explain parent/student iOS flow**
"The iOS app is designed around parent-owned accounts. Students are profiles under a parent, not separate child auth users. Tutor sessions return prompts, answer choices, and difficulty labels, but not correct answers up front. Feedback is meant to be filtered and child-safe."

**1:20-1:30 — Close with architecture**
"The demo is strongest as an architecture walkthrough: Next.js and SwiftUI frontends, Supabase RLS boundaries, pgvector retrieval, and separate Tutor, Planner, and Curriculum agents that can coordinate through shared data without leaking secrets client-side."

## Step-by-step demo route

### Preparation

1. Use a local or approved preview environment only.
2. Confirm `.env.local` is not open on screen and no terminal output contains secrets.
3. Use seeded/demo-only data. Avoid real student names, emails, tokens, or school identifiers in screenshots.
4. Keep the README line visible if needed: this is a portfolio/demo build.

### Web dashboard route

1. Start at `/`.
   - Point out: "Portfolio demo · K-6 adaptive learning" and the explicit demo status language.
   - Mention: no production/adoption claims.
2. Scroll through the landing page sections.
   - Built for teachers, parents, students.
   - Agent/RAG flow.
   - Safety and demo-status sections.
3. Open `/auth`.
   - Say this is the teacher auth entry point.
   - Do not show real credentials.
4. After sign-in, open `/dashboard`.
   - Show recent lessons and weekly insight cards.
   - If empty, frame empty states as intentional first-run behavior.
5. Open `/lessons/new`.
   - Use sample input:
     - Topic: `Fractions as parts of a whole`
     - Grade: `Grade 3`
     - Subject: `Math`
     - Objectives: `Students identify equal parts and explain numerator/denominator meaning.`
     - Duration: `45`
   - Explain this calls the Planner agent and saves a draft for review.
6. Open the generated lesson detail page if available.
   - Show draft status, structured plan sections, and approval/review language.
   - Do not claim the plan was used in a real classroom.
7. Open `/lessons`.
   - Show status badges and lesson list organization.
8. Open `/students`.
   - Explain students are parent-created profiles linked to teacher context.
   - If empty, say linked-student demo data is not required to understand the architecture.

### iOS route

Use simulator/device or screenshots from the SwiftUI surface.

1. Auth screen.
   - Parent-owned account model; no student logins.
2. Parent profile setup.
   - Parent controls data and child profiles.
3. Add/edit learner profile.
   - Use first name only, grade K-6, pace label, optional notes.
4. Home screen.
   - Short practice session framing.
5. Tutor screen.
   - Show prompt, choices, difficulty, and supportive feedback.
   - Call out that `correctAnswer` is not part of the iOS question model.
6. Progress/session summary.
   - Parent-readable summary, not raw provider output.
7. Settings/data controls.
   - Child profile deletion is available; full parent account deletion requires backend/support process before public shipping.

## Demo guardrails

- Do say: "portfolio demo," "local/preview build," "reviewable AI workflow," "parent-scoped APIs," "server-side service-role usage."
- Do not say: "launched to schools," "used by students," "App Store app," "customers," "compliance certified," or "production-ready for children" unless evidence and approvals are added later.
- Keep secret-bearing files, `.env.local`, Supabase dashboards, provider dashboards, and real logs out of screenshots.
