# Launch copy drafts

These are drafts for sharing the Gazelle.io portfolio/demo build. Do not post until screenshots, repo state, and wording are reviewed. Keep the claims honest: no production users, App Store release, paying customers, school adoption, or compliance certification unless that evidence exists later.

## LinkedIn launch post — technical version

I built Gazelle.io, a portfolio/demo project for a K-6 adaptive learning platform.

The goal was to model what an AI-assisted learning product could look like when the architecture is built around three different users:

- teachers planning lessons and reviewing AI output
- parents managing student profiles and understanding progress
- students practicing through short, age-appropriate tutor loops

The stack:

- Next.js 14 + TypeScript teacher dashboard
- SwiftUI iOS parent/student surface
- Supabase Auth, Postgres, RLS, Storage, and pgvector
- Mastra-based Tutor, Planner, and Curriculum agent packages
- RAG over open curriculum-oriented content

The part I cared most about was the safety and data-boundary design. Students are profiles under parent-owned accounts, not separate child auth users. Service-role Supabase access stays server-side. Tutor questions are designed to hide correct answers up front. Agent outputs are treated as reviewable artifacts rather than automatically trusted content.

This is not a claimed school rollout or App Store launch. It is a demo build meant to show product thinking, full-stack implementation, and practical AI architecture for an education use case.

If you are hiring for product-minded full-stack, AI, or developer tooling work, I would be happy to walk through the architecture and tradeoffs.

## LinkedIn launch post — product/story version

I built Gazelle.io as a portfolio/demo project exploring a question I care about:

What would an AI learning product look like if it was designed for teachers, parents, and students from the beginning?

Gazelle.io connects three surfaces:

1. A teacher dashboard for lesson planning and weekly insights.
2. A parent-owned iOS flow for student profiles and progress summaries.
3. A student tutor experience built around short, calm practice sessions.

Under the hood, it uses Next.js, SwiftUI, Supabase/Postgres/RLS/pgvector, and Mastra-based agent workflows for planning, tutoring, and curriculum insights.

The key design choice: AI output should be reviewable and bounded. Lesson plans are drafts. Tutor responses are filtered before display. Student data stays scoped through parent-owned boundaries. The demo is intentionally clear about what it is and is not — a portfolio build, not a live district deployment.

I learned a lot building across product UX, data modeling, agent workflows, retrieval, and privacy boundaries. Open to feedback from educators, parents, and engineering teams working on thoughtful AI products.

## Shorter LinkedIn post

I built Gazelle.io, a portfolio/demo K-6 adaptive learning platform.

It combines:

- Next.js teacher dashboard
- SwiftUI parent/student iOS surface
- Supabase Auth/Postgres/RLS/pgvector
- Mastra Tutor, Planner, and Curriculum agent workflows
- RAG over curriculum-oriented content

The demo focuses on reviewable AI: teachers approve lesson drafts, parents own student profiles, tutor questions hide correct answers up front, and privileged data access stays server-side.

No traction claims, no App Store claim, no school adoption claim — just an honest full-stack AI product demo built to show architecture, product thinking, and implementation depth.

Happy to share the walkthrough with teams hiring for full-stack, AI, or product engineering roles.

## Portfolio project blurb

Gazelle.io is a portfolio/demo K-6 adaptive learning platform with a Next.js teacher dashboard, SwiftUI parent/student app surface, Supabase Postgres/RLS/pgvector data foundation, and Mastra-based Tutor, Planner, and Curriculum agent workflows. The project emphasizes reviewable AI output, parent-owned student data boundaries, and practical safety constraints instead of claiming production adoption.

## GitHub repo description

Portfolio/demo K-6 adaptive learning platform: Next.js teacher dashboard, SwiftUI parent/student surface, Supabase RLS/pgvector, and Mastra Tutor/Planner/Curriculum agents.

## Recruiter DM — concise

Hi [Name] — I recently built Gazelle.io, a portfolio/demo K-6 adaptive learning platform that combines a Next.js teacher dashboard, SwiftUI iOS surface, Supabase RLS/pgvector, and Mastra-based AI agents for tutoring, lesson planning, and curriculum insights.

I focused on practical AI product architecture: reviewable outputs, parent-scoped student data, server-side privileged access, and clear demo boundaries. If your team is hiring for full-stack/product-minded AI engineering, I would be glad to share a short walkthrough.

## Recruiter DM — shorter

Hi [Name] — I built Gazelle.io, a full-stack AI education demo with Next.js, SwiftUI, Supabase RLS/pgvector, and Mastra agent workflows. It focuses on reviewable AI outputs and parent-scoped student data rather than black-box chatbot behavior. If your team is hiring for full-stack or AI product engineering, I would love to share a quick walkthrough.

## Hiring manager email intro

Subject: Full-stack AI product demo — Gazelle.io

Hi [Name],

I wanted to share Gazelle.io, a portfolio/demo K-6 adaptive learning platform I built to show full-stack AI product engineering depth.

The project includes a Next.js teacher dashboard, SwiftUI parent/student surface, Supabase Auth/Postgres/RLS/pgvector, and Mastra-based Tutor, Planner, and Curriculum agent workflows. The architecture emphasizes reviewable AI artifacts, parent-owned student data boundaries, and server-side handling of privileged access.

This is an honest demo build, not a claimed production rollout. I would be happy to walk through the product decisions, code structure, and safety tradeoffs if relevant to your team.

Best,
Laith

## Social thread / carousel captions

### Slide 1

Built Gazelle.io: a K-6 adaptive learning platform demo connecting teachers, parents, and students.

### Slide 2

Teacher dashboard: lesson drafts, review flow, student context, and weekly insight generation.

### Slide 3

Agent architecture: Planner, Tutor, and Curriculum workflows backed by Supabase Postgres/RLS and pgvector retrieval.

### Slide 4

Safety boundary: AI outputs are reviewable artifacts, not automatically trusted content.

### Slide 5

Parent/student model: parents own accounts; students are scoped profiles, not child auth users.

### Slide 6

Tutor flow: short practice loops, age-appropriate feedback, and no correct answers exposed up front.

### Slide 7

Honest launch status: portfolio/demo build, no App Store or school adoption claims.

## Phrases to reuse

- "reviewable AI artifacts, not automatically trusted content"
- "parent-owned student data boundaries"
- "practical AI architecture for a sensitive education use case"
- "demo build with honest launch boundaries"
- "role-specific UX for teachers, parents, and students"

## Phrases to avoid unless evidence is added

- "used by schools"
- "trusted by parents"
- "launched on the App Store"
- "serving students"
- "production-ready compliance"
- "COPPA compliant" or "FERPA compliant"
- "customers" or "users" in a traction sense
