import { NextResponse } from "next/server";
import { generateInsightReport } from "@gazelle/agent-curriculum";
import { getCurrentTeacher } from "@/lib/current-teacher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const current = await getCurrentTeacher();
  if (!current?.teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const report = await generateInsightReport(current.teacher.id);
    return NextResponse.json({ id: report.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Report generation failed" },
      { status: 500 },
    );
  }
}
