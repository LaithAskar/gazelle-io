import { NextResponse } from "next/server";
import { runPlanner } from "@gazelle/agent-planner";
import { getCurrentTeacher } from "@/lib/current-teacher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Planner does a Voyage embed + a Claude generation — well over the Hobby 10s
// cap. Honored on Vercel Pro; on Hobby this route will time out (see DEPLOY.md).
export const maxDuration = 60;

export async function POST(req: Request) {
  const current = await getCurrentTeacher();
  if (!current?.teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const topic = body?.topic?.trim();
  const subject = body?.subject?.trim();
  const grade = Number(body?.grade);

  if (!topic || !subject || Number.isNaN(grade)) {
    return NextResponse.json({ error: "topic, subject, and grade are required" }, { status: 400 });
  }

  try {
    const { lessonPlan } = await runPlanner({
      teacherId: current.teacher.id,
      topic,
      subject,
      grade,
      objectives: body?.objectives?.trim() || undefined,
      durationMinutes: body?.durationMinutes ? Number(body.durationMinutes) : undefined,
    });
    return NextResponse.json({ id: lessonPlan.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed" },
      { status: 500 },
    );
  }
}
