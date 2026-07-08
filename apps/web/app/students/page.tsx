import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ClassCodeCard } from "@/components/class-code-card";
import { getCurrentTeacher } from "@/lib/current-teacher";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const current = await getCurrentTeacher();
  if (!current) redirect("/auth");
  const supabase = createClient();

  // RLS: a teacher may read only students linked to them.
  const { data: students } = await supabase
    .from("student_profiles")
    .select("id, name, grade, pace")
    .order("name");

  return (
    <AppShell teacherName={current.teacher?.name}>
      <h1 className="text-2xl font-semibold">Students</h1>
      <p className="mt-1 text-sm text-slate-500">
        Students are created by their parents in the Gazelle iOS app and linked to your class.
      </p>

      <ClassCodeCard initialCode={current.teacher?.class_code ?? null} />

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Grade</th>
              <th className="px-4 py-2 font-medium">Pace</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(students ?? []).map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2">{s.name}</td>
                <td className="px-4 py-2">{s.grade === 0 ? "K" : s.grade}</td>
                <td className="px-4 py-2 text-slate-500">{s.pace}</td>
              </tr>
            ))}
            {(!students || students.length === 0) && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  No students linked yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
