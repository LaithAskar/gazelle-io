import { createRequestClient } from "@/lib/supabase/server";
import { getCurrentParent } from "@/lib/current-parent";
import { endTutorSession } from "@gazelle/agent-tutor";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEndRequest(value: unknown): value is { sessionId: string } {
  return isRecord(value) && typeof value.sessionId === "string" && value.sessionId.trim().length > 0;
}

export async function POST(req: Request) {
  const current = await getCurrentParent(req);
  if (!current?.parent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!isEndRequest(body)) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const sessionId = body.sessionId.trim();
  const supabase = createRequestClient(req);

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id,student_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) return NextResponse.json({ error: "Failed to verify session ownership" }, { status: 500 });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const { data: student, error: studentError } = await supabase
    .from("student_profiles")
    .select("id,parent_id")
    .eq("id", session.student_id)
    .maybeSingle();

  if (studentError) return NextResponse.json({ error: "Failed to verify student ownership" }, { status: 500 });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  if (student.parent_id !== current.parent.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const ended = await endTutorSession(sessionId);
    const streakDays = await computeStreakDays(supabase, session.student_id);
    return NextResponse.json({ session: ended, streakDays });
  } catch (error) {
    console.error("Failed to end tutor session", error);
    return NextResponse.json({ error: "Failed to end tutor session" }, { status: 500 });
  }
}

/**
 * Consecutive practice days ending today (UTC), from completed sessions.
 * Read through the parent's own client — RLS scopes it to their children.
 */
async function computeStreakDays(
  supabase: ReturnType<typeof createRequestClient>,
  studentId: string,
): Promise<number> {
  const { data } = await supabase
    .from("sessions")
    .select("ended_at")
    .eq("student_id", studentId)
    .eq("status", "completed")
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false })
    .limit(120);

  const days = new Set(
    (data ?? [])
      .map((s) => s.ended_at)
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.slice(0, 10)), // YYYY-MM-DD (UTC)
  );

  let streak = 0;
  const cursor = new Date();
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
