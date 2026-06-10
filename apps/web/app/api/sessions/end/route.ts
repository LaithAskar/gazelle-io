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
    const session = await endTutorSession(sessionId);
    return NextResponse.json({ session });
  } catch (error) {
    console.error("Failed to end tutor session", error);
    return NextResponse.json({ error: "Failed to end tutor session" }, { status: 500 });
  }
}
