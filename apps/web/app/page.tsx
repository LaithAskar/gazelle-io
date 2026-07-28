import Link from "next/link";

const audienceCards = [
  {
    role: "Teachers",
    eyebrow: "Plan with guardrails",
    title: "Move from objective to reviewable lesson draft.",
    detail:
      "Enter grade, subject, and learning goals. Gazelle drafts a structured plan that stays behind a teacher review step before classroom use.",
    accent: "bg-emerald-500",
  },
  {
    role: "Parents",
    eyebrow: "Understand progress",
    title: "A calmer way to see what a child is practicing.",
    detail:
      "The product model centers parent-owned student profiles, clear session history, and simple signals about strengths and next practice areas.",
    accent: "bg-sky-500",
  },
  {
    role: "Students",
    eyebrow: "Practice at their level",
    title: "Short tutoring loops designed for K-6 attention spans.",
    detail:
      "Tutor sessions are intended to adapt one step at a time, hide correct answers up front, and keep feedback age-appropriate.",
    accent: "bg-amber-400",
  },
];

const flowSteps = [
  {
    step: "01",
    title: "Teacher sets the target",
    detail: "Pick grade, subject, objective, and constraints for a lesson or practice sequence.",
  },
  {
    step: "02",
    title: "Agents retrieve context",
    detail: "Planner, Tutor, and Curriculum workflows are designed around Supabase pgvector RAG over open curriculum content.",
  },
  {
    step: "03",
    title: "Guardrails review output",
    detail: "Lesson drafts stay reviewable, while tutor output passes a deterministic content filter before it is shown to learners.",
  },
  {
    step: "04",
    title: "Insights become easier to read",
    detail: "The dashboard organizes progress and lesson artifacts into digestible cards for a demo walkthrough.",
  },
];

const stackItems = [
  "Next.js 14 + TypeScript web dashboard",
  "SwiftUI iOS surface planned for student and parent flows",
  "Supabase Auth, Postgres, RLS, Storage, and pgvector",
  "Mastra agents for Tutor, Planner, and Curriculum workflows",
];

const safetyChecks = [
  "Parent-scoped student/session APIs",
  "No service-role key in client surfaces",
  "Tutor start responses hide correct answers",
  "Rejected initial questions fail closed",
];

const demoNotes = [
  "Built as an honest portfolio/demo surface — not a live school rollout claim.",
  "No App Store, paid customer, compliance certification, or adoption claim is made here.",
  "The strongest proof is the repository architecture and working dashboard paths.",
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
      {children}
    </p>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f1e8] text-stone-950">
      <section className="relative isolate border-b border-stone-200 bg-[#f7f1e8] text-stone-950">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_12%,rgba(250,204,21,0.22),transparent_26%),radial-gradient(circle_at_86%_18%,rgba(16,185,129,0.16),transparent_28%),linear-gradient(180deg,#fffaf0_0%,#f7f1e8_58%,#f4eadb_100%)]" />
        <div className="absolute left-8 top-32 -z-10 h-64 w-64 rounded-full bg-amber-200/25 blur-3xl" />
        <div className="absolute bottom-12 right-8 -z-10 h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl" />

        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Link href="/" className="group inline-flex items-center gap-2 text-xl font-semibold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-stone-950 text-white shadow-lg shadow-amber-900/10">
              G
            </span>
            Gazelle<span className="-ml-1 text-emerald-700">.io</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm sm:gap-3">
            <a href="#how-it-works" className="hidden rounded-full px-4 py-2 text-stone-600 transition hover:bg-white/70 hover:text-stone-950 sm:inline-flex">
              How it works
            </a>
            <Link href="/auth" className="rounded-full border border-stone-300 bg-white/60 px-4 py-2 text-stone-800 shadow-sm transition hover:border-stone-400 hover:bg-white">
              Sign in
            </Link>
            <Link href="/dashboard" className="rounded-full bg-stone-950 px-4 py-2 font-semibold text-white shadow-lg shadow-stone-900/10 transition hover:bg-stone-800">
              Dashboard
            </Link>
          </nav>
        </header>

        <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-20 pt-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pb-28 lg:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white/70 px-3 py-1 text-sm text-stone-700 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Portfolio demo · K-6 adaptive learning
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-[-0.045em] text-stone-950 sm:text-6xl lg:text-7xl">
              Adaptive learning that feels clear, warm, and reviewable.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-700">
              Gazelle.io is a polished launch demo for a K-6 platform where teachers plan, parents understand progress, and students practice through guarded tutor flows.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth" className="rounded-2xl bg-emerald-700 px-5 py-3 text-center text-sm font-semibold text-white shadow-xl shadow-emerald-900/15 transition hover:bg-emerald-800">
                Open teacher sign-in
              </Link>
              <a href="#demo-status" className="rounded-2xl border border-stone-300 bg-white/65 px-5 py-3 text-center text-sm font-semibold text-stone-900 transition hover:border-stone-400 hover:bg-white">
                See demo status
              </a>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-sm text-stone-600">
              <div className="rounded-2xl border border-stone-200 bg-white/70 p-3 shadow-sm">
                <p className="text-lg font-semibold text-stone-950">K-6</p>
                <p>grade focus</p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white/70 p-3 shadow-sm">
                <p className="text-lg font-semibold text-stone-950">3</p>
                <p>agent roles</p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white/70 p-3 shadow-sm">
                <p className="text-lg font-semibold text-stone-950">RLS</p>
                <p>data boundary</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-amber-200/30 blur-3xl" />
            <div className="rounded-[2rem] border border-stone-200 bg-white/55 p-3 shadow-2xl shadow-stone-900/10 backdrop-blur">
              <div className="overflow-hidden rounded-[1.5rem] bg-[#fffdf8] text-stone-950">
                <div className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Teacher dashboard</p>
                    <h2 className="mt-1 text-xl font-semibold">Weekly learning snapshot</h2>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Demo-ready UI</span>
                </div>

                <div className="grid gap-4 p-5 md:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-stone-500">Current objective</p>
                        <h3 className="mt-1 text-2xl font-semibold tracking-tight">Fractions as parts of a whole</h3>
                      </div>
                      <span className="rounded-2xl bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Grade 3</span>
                    </div>
                    <div className="mt-5 space-y-3">
                      {[
                        ["Lesson draft", "Ready for review", "w-4/5"],
                        ["Question bank", "Pending approval", "w-3/5"],
                        ["Parent summary", "Plain-language notes", "w-2/3"],
                      ].map(([label, status, width]) => (
                        <div key={label} className="rounded-2xl bg-stone-50 p-3">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{label}</span>
                            <span className="text-stone-500">{status}</span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-stone-200">
                            <div className={`${width} h-2 rounded-full bg-emerald-600`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-3xl border border-stone-200 bg-stone-950 p-5 text-white shadow-sm">
                      <p className="text-sm font-semibold text-emerald-200">Agent review queue</p>
                      <div className="mt-4 space-y-3 text-sm text-stone-300">
                        <div className="flex items-center justify-between rounded-2xl bg-white/10 p-3">
                          <span>Planner output</span>
                          <span className="text-amber-200">pending</span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-white/10 p-3">
                          <span>Tutor prompt</span>
                          <span className="text-emerald-200">filtered</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                      <p className="text-sm font-medium text-stone-500">Designed for quick scanning</p>
                      <p className="mt-2 text-3xl font-semibold tracking-tight">One card at a time.</p>
                      <p className="mt-2 text-sm leading-6 text-stone-600">Parents, teachers, and students get the right level of detail without pretending the demo is a deployed district product.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <SectionLabel>Built for three audiences</SectionLabel>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">Different roles, one readable product story.</h2>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {audienceCards.map((card) => (
              <article key={card.role} className="group rounded-[1.75rem] border border-stone-200 bg-white/85 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-300/40">
                <div className={`h-2 w-14 rounded-full ${card.accent}`} />
                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">{card.role}</p>
                <p className="mt-3 text-sm font-medium text-emerald-700">{card.eyebrow}</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">{card.title}</h3>
                <p className="mt-4 text-sm leading-6 text-stone-600">{card.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-stone-200 bg-[#fffdf8] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <SectionLabel>How it works</SectionLabel>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">A simple flow for a complex AI product.</h2>
              <p className="mt-5 text-base leading-7 text-stone-600">The landing page frames Gazelle as a product demo with clear handoffs instead of dense architecture-first copy.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {flowSteps.map((item) => (
                <article key={item.step} className="rounded-[1.5rem] border border-stone-200 bg-[#f8f3ea] p-5">
                  <p className="text-sm font-semibold text-emerald-700">{item.step}</p>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-600">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="technical-proof" className="bg-[#f7f1e8] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] border border-stone-200 bg-white/85 p-6 shadow-sm">
              <SectionLabel>Technical proof</SectionLabel>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Real architecture, presented in plain English.</h2>
              <ul className="mt-6 space-y-3 text-sm text-stone-700">
                {stackItems.map((item) => (
                  <li key={item} className="flex gap-3 rounded-2xl bg-stone-50 p-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[2rem] border border-stone-800 bg-stone-950 p-6 text-white shadow-xl shadow-stone-300/40">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Safety posture</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Guardrails are part of the product story.</h2>
              <p className="mt-4 text-sm leading-6 text-stone-300">This public page avoids inflated traction claims and focuses on review boundaries, client-safe keys, and scoped data access patterns that can be verified in the codebase.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {safetyChecks.map((check) => (
                  <div key={check} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-stone-100">
                    {check}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="demo-status" className="px-6 pb-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-sm sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <SectionLabel>Demo status</SectionLabel>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight">Clear, honest, ready for a walkthrough.</h2>
              <p className="mt-4 text-sm leading-6 text-stone-600">The page is tuned for a launch-style demo while staying precise about what exists today.</p>
            </div>
            <div className="grid gap-3">
              {demoNotes.map((note) => (
                <div key={note} className="flex gap-3 rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">✓</span>
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 border-t border-stone-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-stone-500">Explore the protected teacher dashboard or review the safety and technical proof above.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard" className="rounded-2xl bg-stone-950 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-stone-800">
                View dashboard
              </Link>
              <Link href="/auth" className="rounded-2xl border border-stone-200 px-5 py-3 text-center text-sm font-semibold text-stone-950 transition hover:border-stone-300 hover:bg-stone-50">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
