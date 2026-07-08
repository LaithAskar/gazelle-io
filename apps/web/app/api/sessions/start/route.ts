import { createRequestClient } from "@/lib/supabase/server";
import { getCurrentParent } from "@/lib/current-parent";
import { checkParentAgentRateLimit, rateLimitResponseInit } from "@/lib/rate-limit";
import { startTutorSession } from "@gazelle/agent-tutor";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Difficulty = "easy" | "medium" | "hard";

interface TutorQuestion {
  prompt: string;
  choices?: string[];
  difficulty: Difficulty;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTutorQuestion(value: unknown): value is TutorQuestion {
  if (!isRecord(value)) return false;
  const choices = value.choices;
  return (
    typeof value.prompt === "string" &&
    (value.difficulty === "easy" || value.difficulty === "medium" || value.difficulty === "hard") &&
    (choices === undefined || (Array.isArray(choices) && choices.every((choice) => typeof choice === "string")))
  );
}

function isStartRequest(value: unknown): value is { studentId: string } {
  return isRecord(value) && typeof value.studentId === "string" && value.studentId.trim().length > 0;
}

function serializeQuestion(question: TutorQuestion) {
  return {
    prompt: question.prompt,
    ...(question.choices ? { choices: question.choices } : {}),
    difficulty: question.difficulty,
  };
}

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
  if (!isStartRequest(body)) {
    return NextResponse.json({ error: "studentId is required" }, { status: 400 });
  }

  const studentId = body.studentId.trim();
  const supabase = createRequestClient(req);
  const { data: student, error: studentError } = await supabase
    .from("student_profiles")
    .select("id,parent_id")
    .eq("id", studentId)
    .maybeSingle();

  if (studentError) return NextResponse.json({ error: "Failed to verify student ownership" }, { status: 500 });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  if (student.parent_id !== current.parent.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await startTutorSession({ studentId });
    if (!isTutorQuestion(result.question)) {
      return NextResponse.json({ error: "Tutor returned an invalid question" }, { status: 500 });
    }

    return NextResponse.json({
      sessionId: result.sessionId,
      questionId: result.questionId,
      question: serializeQuestion(result.question),
    });
  } catch (error) {
    console.error("Failed to start tutor session", error);
    return NextResponse.json({ error: "Failed to start tutor session" }, { status: 500 });
  }
}
