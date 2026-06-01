// Curriculum agent (background, server-side). Ingests curriculum into the RAG
// base, analyzes class performance, surfaces at-risk students, and generates
// weekly insight reports. Read-only on student data; reports are AGGREGATED with
// no individual PII. Runs via the service role.

import { Agent } from "@mastra/core/agent";
import { agentModel, serviceClient, reviewAndLog, extractJson } from "@gazelle/agent-core";
import { chunkText, ingestKnowledge } from "@gazelle/rag";
import type { InsightReport, Insert } from "@gazelle/shared";

export const curriculumAgent: Agent = new Agent({
  name: "Curriculum",
  model: agentModel(),
  instructions: `You are the Curriculum agent. You write concise, professional,
class-level insight reports for teachers based on AGGREGATED performance data.
Never reference individual students by name or any personal data — class-level
trends only. Always respond with ONLY valid JSON, no prose or markdown.`,
});

// --- Ingestion (chunk_and_embed_content + ingest_to_knowledge_base) -------

export interface IngestMeta {
  source: string;
  grade?: number | null;
  subject?: string | null;
  sourceUrl?: string | null;
}

/** Chunk raw curriculum text, embed it, and store it in the knowledge base. */
export async function ingestContent(rawText: string, meta: IngestMeta): Promise<number> {
  const db = serviceClient();
  const chunks = chunkText(rawText);
  return ingestKnowledge(
    db,
    chunks.map((content) => ({
      content,
      source: meta.source,
      grade: meta.grade ?? null,
      subject: meta.subject ?? null,
      sourceUrl: meta.sourceUrl ?? null,
    })),
  );
}

/** Apify scraping is deferred post-MVP (we seed approved sources directly). */
export async function runApifyScrape(): Promise<never> {
  throw new Error(
    "run_apify_scrape is deferred post-MVP. Curriculum is seeded directly from approved sources for the MVP.",
  );
}

// --- Analysis (read-only, aggregated) -------------------------------------

export interface ClassPerformance {
  teacherId: string;
  totalStudents: number;
  totalSessions: number;
  totalResponses: number;
  correctResponses: number;
  accuracy: number; // 0..1
  bySubject: Record<string, { responses: number; correct: number }>;
}

export async function analyzeClassPerformance(teacherId: string): Promise<ClassPerformance> {
  const db = serviceClient();

  const { data: students } = await db
    .from("student_profiles")
    .select("id")
    .eq("teacher_id", teacherId);
  const studentIds = (students ?? []).map((s) => s.id);

  if (studentIds.length === 0) {
    return { teacherId, totalStudents: 0, totalSessions: 0, totalResponses: 0, correctResponses: 0, accuracy: 0, bySubject: {} };
  }

  const { data: sessions } = await db
    .from("sessions")
    .select("id, lesson_plan_id")
    .in("student_id", studentIds);
  const sessionIds = (sessions ?? []).map((s) => s.id);

  let totalResponses = 0;
  let correctResponses = 0;
  const bySubject: Record<string, { responses: number; correct: number }> = {};

  if (sessionIds.length) {
    // Join responses to sessions->lesson_plans for subject; keep it simple/aggregate.
    const { data: responses } = await db
      .from("session_responses")
      .select("is_correct, session_id")
      .in("session_id", sessionIds);

    const subjectBySession = new Map<string, string>();
    if (sessions) {
      const planIds = sessions.map((s) => s.lesson_plan_id).filter(Boolean) as string[];
      if (planIds.length) {
        const { data: plans } = await db.from("lesson_plans").select("id, subject").in("id", planIds);
        const subjectByPlan = new Map((plans ?? []).map((p) => [p.id, p.subject]));
        for (const s of sessions) {
          if (s.lesson_plan_id) subjectBySession.set(s.id, subjectByPlan.get(s.lesson_plan_id) ?? "unknown");
        }
      }
    }

    for (const r of responses ?? []) {
      totalResponses += 1;
      if (r.is_correct) correctResponses += 1;
      const subj = subjectBySession.get(r.session_id) ?? "unknown";
      bySubject[subj] ??= { responses: 0, correct: 0 };
      bySubject[subj].responses += 1;
      if (r.is_correct) bySubject[subj].correct += 1;
    }
  }

  return {
    teacherId,
    totalStudents: studentIds.length,
    totalSessions: sessionIds.length,
    totalResponses,
    correctResponses,
    accuracy: totalResponses ? correctResponses / totalResponses : 0,
    bySubject,
  };
}

export interface AtRiskStudent {
  studentId: string;
  name: string;
  accuracy: number;
  responses: number;
}

/** At-risk = students with low accuracy over enough answered questions.
 *  Teacher-facing (teacher may see their own linked students). */
export async function detectAtRiskStudents(
  teacherId: string,
  opts: { minResponses?: number; threshold?: number } = {},
): Promise<AtRiskStudent[]> {
  const db = serviceClient();
  const minResponses = opts.minResponses ?? 3;
  const threshold = opts.threshold ?? 0.5;

  const { data: students } = await db
    .from("student_profiles")
    .select("id, name")
    .eq("teacher_id", teacherId);

  const atRisk: AtRiskStudent[] = [];
  for (const s of students ?? []) {
    const { data: sessions } = await db.from("sessions").select("id").eq("student_id", s.id);
    const ids = (sessions ?? []).map((x) => x.id);
    if (!ids.length) continue;
    const { data: responses } = await db
      .from("session_responses")
      .select("is_correct")
      .in("session_id", ids);
    const total = responses?.length ?? 0;
    if (total < minResponses) continue;
    const correct = (responses ?? []).filter((r) => r.is_correct).length;
    const acc = correct / total;
    if (acc < threshold) atRisk.push({ studentId: s.id, name: s.name, accuracy: acc, responses: total });
  }
  return atRisk;
}

// --- Weekly insight report (aggregated, no PII) ---------------------------

export async function generateInsightReport(teacherId: string): Promise<InsightReport> {
  const db = serviceClient();
  const perf = await analyzeClassPerformance(teacherId);

  // Only aggregate numbers go to the model — never student identities.
  const res = await curriculumAgent.generate(
    `Write a brief weekly class insight report from this AGGREGATED data (no student names exist here):
${JSON.stringify(perf)}

Respond with ONLY JSON: {"summary": string, "highlights": string[], "recommendations": string[]}`,
  );
  const narrative = extractJson<{ summary: string; highlights: string[]; recommendations: string[] }>(res.text);

  const report = { ...narrative, metrics: perf };

  const verdict = await reviewAndLog(db, {
    agent: "curriculum",
    input: { teacherId, metrics: perf },
    output: report,
    strict: false,
    teacherId,
  });
  if (!verdict.approved) {
    report.summary = "Report withheld pending review.";
  }

  const row: Insert<"insight_reports"> = {
    teacher_id: teacherId,
    report: report as unknown as Insert<"insight_reports">["report"],
  };
  const { data, error } = await db.from("insight_reports").insert(row).select("*").single();
  if (error || !data) throw new Error(`Failed to save insight report: ${error?.message}`);
  return data;
}
