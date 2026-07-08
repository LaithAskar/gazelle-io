import { createRequestClient } from "@/lib/supabase/server";
import { getCurrentParent } from "@/lib/current-parent";
import { createServiceRoleClient } from "@gazelle/db";
import { submitResponse } from "@gazelle/agent-tutor";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Difficulty = "easy" | "medium" | "hard";

interface TutorQuestion {
  prompt: string;
  choices?: string[];
  correctAnswer: string;
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
    typeof value.correctAnswer === "string" &&
    (value.difficulty === "easy" || value.difficulty === "medium" || value.difficulty === "hard") &&
    (choices === undefined || (Array.isArray(choices) && choices.every((choice) => typeof choice === "string")))
  );
}

function isRespondRequest(value: unknown): value is {
  sessionId: string;
  studentId: string;
  questionId: string;
  studentAnswer: string;
} {
  return (
    isRecord(value) &&
    typeof value.sessionId === "string" &&
    value.sessionId.trim().length > 0 &&
    typeof value.studentId === "string" &&
    value.studentId.trim().length > 0 &&
    typeof value.questionId === "string" &&
    value.questionId.trim().length > 0 &&
    typeof value.studentAnswer === "string" &&
    value.studentAnswer.trim().length > 0 &&
    value.studentAnswer.trim().length <= 500
  );
}

export async function POST(req: Request) {
  const current = await getCurrentParent(req);
  if (!current?.parent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!isRespondRequest(body)) {
    return NextResponse.json(
      { error: "sessionId, studentId, questionId, and a 1-500 character studentAnswer are required" },
      { status: 400 },
    );
  }

  const sessionId = body.sessionId.trim();
  const studentId = body.studentId.trim();
  const questionId = body.questionId.trim();
  const studentAnswer = body.studentAnswer.trim();
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

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id,student_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) return NextResponse.json({ error: "Failed to verify session ownership" }, { status: 500 });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.student_id !== studentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceDb = createServiceRoleClient();
  const { data: questionLog, error: questionLogError } = await serviceDb
    .from("agent_logs")
    .select("id,agent,status,student_id,session_id,output")
    .eq("id", questionId)
    .eq("agent", "tutor")
    .eq("status", "approved")
    .eq("student_id", studentId)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (questionLogError) return NextResponse.json({ error: "Failed to load approved question" }, { status: 500 });
  if (!questionLog || !isTutorQuestion(questionLog.output)) {
    return NextResponse.json({ error: "Approved question not found" }, { status: 404 });
  }

  try {
    const result = await submitResponse({
      sessionId,
      studentId,
      question: questionLog.output,
      studentAnswer,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to submit tutor response", error);
    return NextResponse.json({ error: "Failed to submit tutor response" }, { status: 500 });
  }
}
