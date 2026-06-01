// Tutor agent (student-facing) — the strictest-guardrail agent.
//   - Language matched to grade; max 3 sentences (grades 0-2), 5 (grades 3-6).
//   - Encouraging, never punishing; no scores/failure language to the student.
//   - strict content filter on everything that could reach the student.
//   - Only structured session data is stored; never raw chat.

import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  agentModel,
  serviceClient,
  reviewAndLog,
  extractJson,
  ContentRejectedError,
} from "@gazelle/agent-core";
import { searchCurriculumKnowledge } from "@gazelle/rag";
import type { Insert, LessonPlan, Session, StudentProfile } from "@gazelle/shared";

function gradeLabel(grade: number): string {
  return grade === 0 ? "Kindergarten" : `Grade ${grade}`;
}
function maxSentences(grade: number): number {
  return grade <= 2 ? 3 : 5;
}

export const searchCurriculumKnowledgeTool = createTool({
  id: "search_curriculum_knowledge",
  description: "Semantic search over the curriculum knowledge base for accurate, grade-appropriate explanations.",
  inputSchema: z.object({
    query: z.string(),
    grade: z.number().int().min(0).max(6).optional(),
    subject: z.string().optional(),
  }),
  outputSchema: z.object({ matches: z.array(z.object({ content: z.string() })) }),
  execute: async ({ context }) => {
    const db = serviceClient();
    const matches = await searchCurriculumKnowledge(db, context.query, {
      grade: context.grade ?? null,
      subject: context.subject ?? null,
      matchCount: 4,
    });
    return { matches: matches.map((m) => ({ content: m.content })) };
  },
});

export const tutorAgent: Agent = new Agent({
  name: "Tutor",
  model: agentModel(),
  tools: { searchCurriculumKnowledgeTool },
  instructions: `You are the Tutor, a warm, encouraging tutor for K-6 children.
Rules you must always follow:
- Use simple, age-appropriate language for the child's grade.
- Be positive and supportive. Never use scores, grades, or failure language.
- Wrong answers get gentle, encouraging guidance — never criticism.
- Stay strictly on the lesson topic. No violent, political, religious, or adult content.
- Keep responses within the sentence limit you are given.
- Always respond with ONLY valid JSON, no prose or markdown.`,
});

// --- Data helpers (Mastra "tools" exposed as typed functions) -------------

export async function getStudentProfile(studentId: string): Promise<StudentProfile> {
  const db = serviceClient();
  const { data, error } = await db.from("student_profiles").select("*").eq("id", studentId).single();
  if (error || !data) throw new Error(`Student not found: ${studentId}`);
  return data;
}

/** The active lesson plan for a student's linked teacher (active, else approved). */
export async function getActiveLessonPlan(studentId: string): Promise<LessonPlan | null> {
  const db = serviceClient();
  const student = await getStudentProfile(studentId);
  if (!student.teacher_id) return null;
  const { data } = await db
    .from("lesson_plans")
    .select("*")
    .eq("teacher_id", student.teacher_id)
    .eq("grade", student.grade)
    .in("status", ["active", "approved"])
    .order("created_at", { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

const questionSchema = z.object({
  prompt: z.string(),
  choices: z.array(z.string()).optional(),
  correctAnswer: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
});
type GeneratedQuestion = z.infer<typeof questionSchema>;

const feedbackSchema = z.object({
  isCorrect: z.boolean(),
  feedback: z.string(),
  nextDifficulty: z.enum(["easy", "medium", "hard"]),
});

export interface SessionStart {
  sessionId: string;
  question: GeneratedQuestion;
}

/** Start a session and produce the first question. */
export async function startTutorSession(args: { studentId: string }): Promise<SessionStart> {
  const db = serviceClient();
  const student = await getStudentProfile(args.studentId);
  const plan = await getActiveLessonPlan(args.studentId);

  const { data: session, error } = await db
    .from("sessions")
    .insert({
      student_id: args.studentId,
      lesson_plan_id: plan?.id ?? null,
      status: "in_progress",
    })
    .select("*")
    .single();
  if (error || !session) throw new Error(`Failed to start session: ${error?.message}`);

  const question = await generateQuestion({
    studentId: args.studentId,
    grade: student.grade,
    plan,
    difficulty: student.pace === "fast" ? "medium" : "easy",
  });
  return { sessionId: session.id, question };
}

export async function generateQuestion(args: {
  studentId: string;
  grade: number;
  plan: LessonPlan | null;
  difficulty: "easy" | "medium" | "hard";
}): Promise<GeneratedQuestion> {
  const planContext = args.plan
    ? `Lesson: ${args.plan.title}\nObjectives: ${args.plan.objectives ?? ""}\nContent: ${JSON.stringify(args.plan.content)}`
    : "No specific lesson plan; use grade-appropriate Common Core fundamentals.";

  const res = await tutorAgent.generate(
    `Create one ${args.difficulty} practice question for a ${gradeLabel(args.grade)} student.
${planContext}

Respond with ONLY JSON: {"prompt": string, "choices": string[] (optional, for multiple choice), "correctAnswer": string, "difficulty": "easy"|"medium"|"hard"}`,
  );
  return questionSchema.parse(extractJson(res.text));
}

export interface SubmitResult {
  isCorrect: boolean;
  feedback: string;
  nextDifficulty: "easy" | "medium" | "hard";
}

/** Evaluate a student's answer, log a structured response, return gated feedback. */
export async function submitResponse(args: {
  sessionId: string;
  studentId: string;
  question: GeneratedQuestion;
  studentAnswer: string;
}): Promise<SubmitResult> {
  const db = serviceClient();
  const student = await getStudentProfile(args.studentId);
  const limit = maxSentences(student.grade);

  const res = await tutorAgent.generate(
    `A ${gradeLabel(student.grade)} student answered a question.
Question: ${args.question.prompt}
Correct answer: ${args.question.correctAnswer}
Student's answer: ${args.studentAnswer}

Decide if it is correct, then give warm, encouraging feedback in at most ${limit} sentences.
If wrong, gently guide them — never say they failed. Then choose the next difficulty.
Respond with ONLY JSON: {"isCorrect": boolean, "feedback": string, "nextDifficulty": "easy"|"medium"|"hard"}`,
  );
  const parsed = feedbackSchema.parse(extractJson(res.text));

  // Review the feedback before it reaches the child (strict).
  const verdict = await reviewAndLog(db, {
    agent: "tutor",
    input: { question: args.question.prompt, studentAnswer: args.studentAnswer },
    output: parsed,
    strict: true,
    studentId: args.studentId,
    sessionId: args.sessionId,
  });
  if (!verdict.approved) {
    // Fail safe: replace with a neutral, always-safe message rather than block.
    parsed.feedback = "Nice try! Let's keep going and try another one together.";
  }

  // Store ONLY structured session data — no raw chat.
  const row: Insert<"session_responses"> = {
    session_id: args.sessionId,
    is_correct: parsed.isCorrect,
    difficulty: args.question.difficulty,
    response_data: {
      questionPrompt: args.question.prompt,
      studentAnswer: args.studentAnswer,
      correct: parsed.isCorrect,
    } as Insert<"session_responses">["response_data"],
  };
  const { error } = await db.from("session_responses").insert(row);
  if (error) throw new Error(`Failed to log response: ${error.message}`);

  return { isCorrect: parsed.isCorrect, feedback: parsed.feedback, nextDifficulty: parsed.nextDifficulty };
}

/** End a session: build a structured parent summary, mark completed. */
export async function endTutorSession(sessionId: string): Promise<Session> {
  const db = serviceClient();
  const { data: responses } = await db
    .from("session_responses")
    .select("is_correct")
    .eq("session_id", sessionId);
  const total = responses?.length ?? 0;
  const correct = (responses ?? []).filter((r) => r.is_correct).length;

  const summary = {
    questionsAnswered: total,
    correctCount: correct,
    note:
      total === 0
        ? "Session started but no questions were answered."
        : `Completed ${total} question(s), ${correct} correct. Great effort!`,
  };

  const { data, error } = await db
    .from("sessions")
    .update({ status: "completed", ended_at: new Date().toISOString(), summary: summary as Session["summary"] })
    .eq("id", sessionId)
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to end session: ${error?.message}`);
  return data;
}

/** Flag a session for human review (e.g. concerning input). */
export async function flagSessionForReview(sessionId: string, reason: string): Promise<void> {
  const db = serviceClient();
  await reviewAndLog(db, { agent: "tutor", input: { sessionId }, output: { flagged: reason }, strict: false, sessionId });
  const { error } = await db.from("sessions").update({ status: "flagged" }).eq("id", sessionId);
  if (error) throw new Error(error.message);
}
