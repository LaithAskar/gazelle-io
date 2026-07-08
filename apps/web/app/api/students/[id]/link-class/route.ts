import { NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/server";
import { getCurrentParent } from "@/lib/current-parent";
import { createServiceRoleClient } from "@gazelle/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Link a parent's student to a teacher's class via the teacher's class code.
 * The code→teacher lookup uses the service role (parents can't read
 * teacher_profiles under RLS); the actual update runs as the parent, so RLS
 * enforces that only their own child can be linked.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const current = await getCurrentParent(req);
  if (!current?.parent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const rawCode = isRecord(body) && typeof body.classCode === "string" ? body.classCode : "";
  const classCode = rawCode.trim().toUpperCase();
  if (classCode.length < 4 || classCode.length > 12) {
    return NextResponse.json({ error: "A valid class code is required" }, { status: 400 });
  }

  const supabase = createRequestClient(req);
  const { data: student, error: studentError } = await supabase
    .from("student_profiles")
    .select("id,parent_id")
    .eq("id", params.id)
    .maybeSingle();

  if (studentError) return NextResponse.json({ error: "Failed to verify student ownership" }, { status: 500 });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  if (student.parent_id !== current.parent.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceDb = createServiceRoleClient();
  const { data: teacher, error: teacherError } = await serviceDb
    .from("teacher_profiles")
    .select("id,name")
    .eq("class_code", classCode)
    .maybeSingle();

  if (teacherError) return NextResponse.json({ error: "Failed to look up class code" }, { status: 500 });
  if (!teacher) {
    return NextResponse.json({ error: "That class code doesn't match any class. Double-check it with the teacher." }, { status: 404 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("student_profiles")
    .update({ teacher_id: teacher.id })
    .eq("id", params.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    console.error("[link-class] update failed:", updateError);
    return NextResponse.json({ error: "Failed to link student to the class" }, { status: 500 });
  }

  return NextResponse.json({ student: updated, teacherName: teacher.name });
}
