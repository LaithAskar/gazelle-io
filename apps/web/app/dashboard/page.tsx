import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { GenerateReportButton } from "@/components/generate-report-button";
import { getCurrentTeacher } from "@/lib/current-teacher";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const current = await getCurrentTeacher();
  if (!current) redirect("/auth");
  const { teacher } = current;
  const supabase = createClient();

  const { data: lessons } = await supabase
    .from("lesson_plans")
    .select("id, title, status, subject, grade, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: reports } = await supabase
    .from("insight_reports")
    .select("report, created_at")
    .order("created_at", { ascending: false })
    .limit(1);
  const latest = reports?.[0]?.report as
    | { summary?: string; highlights?: string[]; recommendations?: string[] }
    | undefined;

  return (
    <AppShell teacherName={teacher?.name}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Welcome{teacher?.name ? `, ${teacher.name}` : ""}</h1>
        <Link
          href="/lessons/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          New lesson plan
        </Link>
      </div>

      {!teacher && (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          Your teacher profile is still being set up. Try signing out and back in.
        </p>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Recent lessons</h2>
            <Link href="/lessons" className="text-sm text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-slate-100">
            {(lessons ?? []).map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2">
                <Link href={`/lessons/${l.id}`} className="text-sm hover:underline">
                  {l.title}
                </Link>
                <StatusBadge status={l.status} />
              </li>
            ))}
            {(!lessons || lessons.length === 0) && (
              <li className="py-2 text-sm text-slate-400">No lessons yet — create your first.</li>
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Weekly insight</h2>
            <GenerateReportButton />
          </div>
          {latest ? (
            <div className="mt-3 space-y-2 text-sm">
              <p className="text-slate-700">{latest.summary}</p>
              {latest.recommendations?.length ? (
                <ul className="list-inside list-disc text-slate-500">
                  {latest.recommendations.slice(0, 3).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">
              No report yet. Generate one once students have completed sessions.
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
