# Screenshot checklist

Use demo-safe data only. Do not capture `.env.local`, access tokens, API keys, Supabase provider dashboards, real student details, real emails, terminal logs with secrets, or browser devtools responses that may contain tokens.

## Capture setup

- Browser width: capture at desktop width around 1440px and one mobile/narrow crop if time allows.
- Use a clean browser profile or hide bookmarks/extensions.
- Prefer neutral demo names:
  - Teacher: `Demo Teacher`
  - Learner: `Maya` or `Alex`
  - Topic: `Fractions as parts of a whole`
- Crop out local URLs if they distract; keep enough UI chrome only when useful for credibility.
- Filename convention: `gazelle-01-landing-hero.png`, `gazelle-02-dashboard.png`, etc.

## Priority screenshots for landing/GitHub/LinkedIn

### 1. Landing hero

- Route: `/`
- Capture: full hero section with Gazelle logo, "Portfolio demo · K-6 adaptive learning," primary headline, CTA buttons, and dashboard preview card.
- Use for: LinkedIn hero image, GitHub README top image, portfolio project card.
- Talking point: honest demo positioning plus polished product framing.

### 2. Landing three-audience section

- Route: `/`, section: "Built for three audiences"
- Capture: all three cards for Teachers, Parents, Students.
- Use for: carousel slide explaining product users.
- Talking point: one system designed around different levels of detail for adults and children.

### 3. Landing workflow/agent architecture section

- Route: `/`, section around how it works / flow steps.
- Capture: steps showing teacher target, agent retrieval, reviewable lesson drafts, deterministic tutor filtering, and insights.
- Use for: technical carousel slide.
- Talking point: RAG + reviewable AI workflow, not a black-box chatbot.

### 4. Landing demo status/safety section

- Route: `/`, demo status/safety area.
- Capture: copy that states portfolio/demo limitations and safety checks.
- Use for: README or portfolio proof of honest launch language.
- Talking point: avoids false traction, App Store, or adoption claims.

### 5. Teacher dashboard

- Route: `/dashboard`
- Capture: welcome header, "Recent lessons," "Weekly insight," and "New lesson plan" button.
- Use for: GitHub README, LinkedIn carousel.
- Talking point: teacher command center with lesson drafts and insight generation.

### 6. New lesson plan form

- Route: `/lessons/new`
- Fill before capture:
  - Topic: `Fractions as parts of a whole`
  - Grade: `Grade 3`
  - Subject: `Math`
  - Objectives: `Students identify equal parts and explain numerator/denominator meaning.`
  - Duration: `45`
- Capture: full form and helper text: "Planner grounds your plan in Common Core standards..."
- Use for: technical demo proof.
- Talking point: structured inputs constrain the agent and make output reviewable.

### 7. Lesson detail / generated draft

- Route: `/lessons/[id]` after generating or using demo seed data.
- Capture: title, status badge, lesson sections, and approval/review controls if present.
- Use for: before/after story after Planner generation.
- Talking point: AI-assisted lesson creation remains behind teacher review.

### 8. Lesson list

- Route: `/lessons`
- Capture: table with title, grade, subject, and status.
- Use for: product completeness slide.
- Talking point: generated artifacts become organized dashboard records.

### 9. Students page

- Route: `/students`
- Capture: table if demo students exist; otherwise capture empty state.
- Use for: boundary/data-model explanation.
- Talking point: students are parent-created profiles, not child-owned auth accounts.

## iOS screenshots

Use simulator/device screenshots with demo-only data. Avoid capturing notification banners or real Apple ID/account details.

### 10. Parent auth screen

- Capture: sign-in/sign-up screen and parent-control copy.
- Use for: explaining privacy model.
- Talking point: parents authenticate; students do not need email accounts.

### 11. Parent profile setup

- Capture: parent profile fields and save action.
- Use for: onboarding slide.
- Talking point: adult-owned setup before learner profiles.

### 12. Add learner profile

- Capture: first-name-only learner profile, grade, pace, optional notes.
- Use for: parent/student flow slide.
- Talking point: child profile data is scoped to a parent account.

### 13. Student home/practice entry

- Capture: start-practice CTA and warm, short-session framing.
- Use for: student experience slide.
- Talking point: short adaptive practice rather than high-pressure testing.

### 14. Tutor question

- Capture: prompt, answer choices, difficulty label.
- Use for: core product slide.
- Talking point: no answer key is shown in the iOS question surface.

### 15. Tutor feedback

- Capture: child-safe feedback after an answer.
- Use for: safety/UX slide.
- Talking point: feedback should be supportive and filtered before display.

### 16. Session summary/progress

- Capture: parent-readable progress/session summary.
- Use for: parent value slide.
- Talking point: parents see digestible summaries, not raw model logs.

### 17. Settings/data controls

- Capture: settings or data deletion copy.
- Use for: trust/safety slide.
- Talking point: child profile deletion exists; full account deletion needs approved backend/support process before public release.

## Recommended LinkedIn carousel order

1. Landing hero: "Built a K-6 adaptive learning demo."
2. Architecture/workflow: "Not a chatbot: RAG + review queues + role-specific UX."
3. Teacher dashboard: "Teacher-facing planning and insights."
4. Lesson generation form/detail: "Planner agent drafts, teacher reviews."
5. iOS parent/student flow: "Parent-owned accounts, student profiles."
6. Tutor screen: "Short practice loops; answers hidden up front."
7. Safety/demo-status slide: "Portfolio demo, honest boundaries."

## README image recommendations

If images are later added to the repo, place them under `docs/assets/` and reference them as:

```md
![Gazelle.io landing page](docs/assets/gazelle-01-landing-hero.png)
![Gazelle.io teacher dashboard](docs/assets/gazelle-05-dashboard.png)
```

Do not add screenshots containing secrets, real student names, real accounts, or unapproved external service dashboards.
