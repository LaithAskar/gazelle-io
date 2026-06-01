import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { ApproveButton } from "@/components/approve-button";
import { getCurrentTeacher } from "@/lib/current-teacher";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SECTIONS = ["hook", "instruction", "practice", "assessment"] as const;

export default async function LessonDetailPage({ params }: { params: { id: string } }) {
  const current = await getCurrentTeacher();
  if (!current) redirect("/auth");
  const supabase = createClient();

  const { data: lesson } = await supabase
    .from("lesson_plans")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!lesson) notFound();

  const { data: questions } = await supabase
    .from("questions")
    .select("id, prompt, question_type, difficulty")
    .eq("lesson_plan_id", params.id);

  const content = (lesson.content ?? {}) as Record<string, string>;

  return (
    <AppShell teacherName={current.teacher?.name}>
      <Link href="/lessons" className="text-sm text-slate-500 hover:text-slate-800">
        ← Back to lessons
      </Link>

      <div className="mt-3 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{lesson.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {lesson.grade === 0 ? "Kindergarten" : `Grade ${lesson.grade}`} · {lesson.subject.toUpperCase()} ·{" "}
            {lesson.duration_minutes ?? "—"} min
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={lesson.status} />
          {lesson.status === "draft" && <ApproveButton lessonId={lesson.id} />}
        </div>
      </div>

      {lesson.objectives && (
        <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
          <span className="font-medium">Objectives: </span>
          {lesson.objectives}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {SECTIONS.map((s) =>
          content[s] ? (
            <section key={s} className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{s}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{content[s]}</p>
            </section>
          ) : null,
        )}
      </div>

      <section className="mt-8">
        <h2 className="font-medium">Question bank {questions?.length ? `(${questions.length})` : ""}</h2>
        {questions && questions.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {questions.map((q) => (
              <li key={q.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <span className="text-slate-700">{q.prompt}</span>
                <span className="ml-2 text-xs text-slate-400">
                  {q.question_type} · {q.difficulty}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-400">
            Approve this plan to generate a student question bank.
          </p>
        )}
      </section>
    </AppShell>
  );
}
