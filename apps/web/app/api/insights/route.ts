import { NextResponse } from "next/server";
import { generateInsightReport } from "@gazelle/agent-curriculum";
import { getCurrentTeacher } from "@/lib/current-teacher";
import { checkAgentRateLimit, rateLimitResponseInit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Curriculum agent Claude call (see DEPLOY.md)

export async function POST() {
  const current = await getCurrentTeacher();
  if (!current?.teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkAgentRateLimit(current.teacher.id);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      rateLimitResponseInit(rl.retryAfterSeconds),
    );
  }

  try {
    const report = await generateInsightReport(current.teacher.id);
    return NextResponse.json({ id: report.id });
  } catch (e) {
    console.error("[insights] failed:", e);
    return NextResponse.json({ error: "Report generation failed. Please try again." }, { status: 500 });
  }
}
