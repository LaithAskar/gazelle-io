import { createRequestClient } from "@/lib/supabase/server";
import { getCurrentParent } from "@/lib/current-parent";
import { checkParentAgentRateLimit, rateLimitResponseInit } from "@/lib/rate-limit";
import { isOwnedStudent, isSessionForStudent } from "@/lib/session-ownership";
import { nextSessionQuestion } from "@gazelle/agent-tutor";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // may fall back to a live Claude generation

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNextRequest(value: unknown): value is { sessionId: string; studentId: string } {
  return (
    isRecord(value) &&
    typeof value.sessionId === "string" &&
    value.sessionId.trim().length > 0 &&
    typeof value.studentId === "string" &&
    value.studentId.trim().length > 0
  );
}

/** Next question for an in-progress session (bank-first, never leaks the answer). */
export async function POST(req: Request) {
  const current = await getCurrentParent(req);
  if (!current?.parent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkParentAgentRateLimit(current.parent.id);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Whoa, that's a lot of practice! Take a short break and try again soon." },
      rateLimitResponseInit(rl.retryAfterSeconds),
    );
  }

  const body = await req.json().catch(() => null);
  if (!isNextRequest(body)) {
    return NextResponse.json({ error: "sessionId and studentId are required" }, { status: 400 });
  }

  const sessionId = body.sessionId.trim();
  const studentId = body.studentId.trim();
  const supabase = createRequestClient(req);

  const { data: student, error: studentError } = await supabase
    .from("student_profiles")
    .select("id,parent_id")
    .eq("id", studentId)
    .maybeSingle();

  if (studentError) return NextResponse.json({ error: "Failed to verify student ownership" }, { status: 500 });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  if (!isOwnedStudent(current.parent.id, student)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id,student_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) return NextResponse.json({ error: "Failed to verify session ownership" }, { status: 500 });
  if (!isSessionForStudent(studentId, session)) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  try {
    const { questionId, question } = await nextSessionQuestion({ sessionId, studentId });
    return NextResponse.json({
      questionId,
      // Never send correctAnswer to the device — grading is server-side.
      question: {
        prompt: question.prompt,
        ...(question.choices ? { choices: question.choices } : {}),
        difficulty: question.difficulty,
      },
    });
  } catch (error) {
    console.error("Failed to get next tutor question", error);
    return NextResponse.json({ error: "Failed to get the next question" }, { status: 500 });
  }
}
