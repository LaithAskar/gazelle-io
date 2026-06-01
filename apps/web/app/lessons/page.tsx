import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentTeacher } from "@/lib/current-teacher";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function gradeLabel(g: number) {
  return g === 0 ? "K" : `${g}`;
}

export default async function LessonsPage() {
  const current = await getCurrentTeacher();
  if (!current) redirect("/auth");
  const supabase = createClient();

  const { data: lessons } = await supabase
    .from("lesson_plans")
    .select("id, title, status, subject, grade, created_at")
    .order("created_at", { ascending: false });

  return (
    <AppShell teacherName={current.teacher?.name}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Lesson plans</h1>
        <Link
          href="/lessons/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          New lesson plan
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Grade</th>
              <th className="px-4 py-2 font-medium">Subject</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(lessons ?? []).map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/lessons/${l.id}`} className="text-brand-600 hover:underline">
                    {l.title}
                  </Link>
                </td>
                <td className="px-4 py-2">{gradeLabel(l.grade)}</td>
                <td className="px-4 py-2 uppercase text-slate-500">{l.subject}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={l.status} />
                </td>
              </tr>
            ))}
            {(!lessons || lessons.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No lesson plans yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
