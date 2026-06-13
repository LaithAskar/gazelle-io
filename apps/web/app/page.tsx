import Link from "next/link";

const stackItems = [
  "Next.js 14 + TypeScript teacher dashboard",
  "SwiftUI student and parent iOS app plan/build surface",
  "Supabase Postgres, Auth, RLS, Storage, and pgvector",
  "Mastra agents for Tutor, Planner, and Curriculum workflows",
];

const proofPoints = [
  {
    label: "K-6 adaptive learning",
    detail: "Designed around age-appropriate tutoring, parent-owned student profiles, and teacher lesson planning.",
  },
  {
    label: "Human-gated AI outputs",
    detail: "Agent generations are logged, reviewed, and filtered before lesson or student-facing use.",
  },
  {
    label: "Recruiter-demo friendly",
    detail: "The web dashboard demonstrates auth-protected workflows for lessons, students, and weekly insights.",
  },
];

const safetyChecks = [
  "Parent-scoped student/session APIs",
  "No service-role key in client surfaces",
  "Tutor start responses hide correct answers",
  "Rejected initial questions fail closed",
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <section className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(47,109,246,0.35),_transparent_35%),radial-gradient(circle_at_80%_20%,_rgba(20,184,166,0.18),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_55%,_#f8fafc_55%,_#f8fafc_100%)]" />
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Gazelle<span className="text-brand-500">.io</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/auth" className="rounded-full border border-white/20 px-4 py-2 text-slate-200 hover:border-white/40">
              Sign in
            </Link>
            <Link href="/dashboard" className="rounded-full bg-white px-4 py-2 font-medium text-slate-950 hover:bg-slate-100">
              Dashboard
            </Link>
          </nav>
        </header>

        <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-20 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-28 lg:pt-20">
          <div>
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-slate-200 shadow-sm backdrop-blur">
              Portfolio build · K-6 AI adaptive learning
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              A credible demo surface for AI-assisted learning workflows.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Gazelle.io pairs a Next.js teacher dashboard with a SwiftUI student/parent experience plan, backed by Supabase, pgvector retrieval, and Mastra agents for tutoring, lesson planning, and curriculum insights.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth" className="rounded-xl bg-brand-500 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600">
                Open teacher sign-in
              </Link>
              <a href="#technical-proof" className="rounded-xl border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white hover:border-white/40">
                View technical proof
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-2xl shadow-slate-950/40 backdrop-blur">
            <div className="rounded-2xl bg-slate-50 p-5 text-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Teacher dashboard</p>
                  <h2 className="mt-1 text-xl font-semibold">Weekly learning snapshot</h2>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">Demo-ready</span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-2xl font-semibold">K-6</p>
                  <p className="mt-1 text-xs text-slate-500">grade range</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-2xl font-semibold">3</p>
                  <p className="mt-1 text-xs text-slate-500">agent roles</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-2xl font-semibold">RLS</p>
                  <p className="mt-1 text-xs text-slate-500">data boundary</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Lesson plan pipeline</p>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">human approval</span>
                </div>
                <ol className="mt-4 space-y-3 text-sm text-slate-600">
                  <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-brand-500" />Teacher enters grade, subject, and objective.</li>
                  <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-brand-500" />Planner grounds output against retrieved curriculum context.</li>
                  <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-brand-500" />Draft lesson and question bank await review before use.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="technical-proof" className="bg-slate-50 px-6 py-16 text-slate-900">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-3">
            {proofPoints.map((point) => (
              <article key={point.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold">{point.label}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{point.detail}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Stack</p>
              <ul className="mt-5 space-y-3 text-sm text-slate-700">
                {stackItems.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-brand-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Safety posture</p>
              <h2 className="mt-3 text-2xl font-semibold">Built to show engineering judgment, not inflated traction.</h2>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                This public surface avoids claims about production users, paid customers, app-store availability, or classroom deployment. It highlights implemented architecture and review boundaries that can be verified in the repository.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {safetyChecks.map((check) => (
                  <div key={check} className="rounded-2xl border border-white/10 bg-white/10 p-3 text-sm text-slate-100">
                    {check}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
