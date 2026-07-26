import { getCurrentParent } from "@/lib/current-parent";
import { createRequestClient } from "@/lib/supabase/server";
import { isOwnedStudent } from "@/lib/session-ownership";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const current = await getCurrentParent(req);
  if (!current?.parent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId")?.trim();
  const supabase = createRequestClient(req);

  let ownedStudentIds: string[] = [];
  if (studentId) {
    const { data: student, error } = await supabase
      .from("student_profiles")
      .select("id,parent_id")
      .eq("id", studentId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: "Failed to verify student ownership" }, { status: 500 });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    if (!isOwnedStudent(current.parent.id, student)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    ownedStudentIds = [student.id];
  } else {
    const { data: students, error } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("parent_id", current.parent.id);
    if (error) return NextResponse.json({ error: "Failed to load students" }, { status: 500 });
    ownedStudentIds = (students ?? []).map((student) => student.id);
  }

  if (ownedStudentIds.length === 0) return NextResponse.json({ sessions: [] });

  const { data, error } = await supabase
    .from("sessions")
    .select("id,student_id,lesson_plan_id,status,summary,started_at,ended_at,created_at")
    .in("student_id", ownedStudentIds)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) return NextResponse.json({ error: "Failed to load sessions" }, { status: 500 });
  return NextResponse.json({ sessions: data ?? [] });
}
