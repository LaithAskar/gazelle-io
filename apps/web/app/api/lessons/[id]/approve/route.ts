import { NextResponse } from "next/server";
import { generateQuestionBank } from "@gazelle/agent-planner";
import { getCurrentTeacher } from "@/lib/current-teacher";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const current = await getCurrentTeacher();
  if (!current?.teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient();
  // RLS + explicit teacher_id check ensures the teacher owns this plan.
  const { data, error } = await supabase
    .from("lesson_plans")
    .update({ status: "approved" })
    .eq("id", params.id)
    .eq("teacher_id", current.teacher.id)
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  // Convert the approved plan into a question bank (best-effort).
  let questionsCreated = 0;
  try {
    const qs = await generateQuestionBank(params.id, 5);
    questionsCreated = qs.length;
  } catch {
    // Non-fatal: approval succeeds even if question generation is rate-limited.
  }

  return NextResponse.json({ ok: true, questionsCreated });
}
