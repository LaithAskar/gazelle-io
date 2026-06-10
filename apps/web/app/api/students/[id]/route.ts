import { getCurrentParent } from "@/lib/current-parent";
import { createRequestClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Pace = "slow" | "steady" | "fast";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) return undefined;
  return value.map((item) => item.trim()).filter(Boolean).slice(0, 6);
}

function parseUpdates(value: unknown) {
  if (!isRecord(value)) return null;
  const updates: {
    name?: string;
    grade?: number;
    age?: number | null;
    pace?: Pace;
    strength_subjects?: string[] | null;
    struggle_subjects?: string[] | null;
  } = {};

  if (value.name !== undefined) {
    if (typeof value.name !== "string") return null;
    const name = value.name.trim();
    if (name.length === 0 || name.length > 80) return null;
    updates.name = name;
  }
  if (value.grade !== undefined) {
    const grade = typeof value.grade === "number" ? value.grade : Number(value.grade);
    if (!Number.isInteger(grade) || grade < 0 || grade > 6) return null;
    updates.grade = grade;
  }
  if (value.age !== undefined) {
    if (value.age === null || value.age === "") {
      updates.age = null;
    } else {
      const age = typeof value.age === "number" ? value.age : Number(value.age);
      if (!Number.isInteger(age) || age < 4 || age > 13) return null;
      updates.age = age;
    }
  }
  if (value.pace !== undefined) {
    if (!(value.pace === "slow" || value.pace === "steady" || value.pace === "fast")) return null;
    updates.pace = value.pace;
  }
  const strengths = asStringArray(value.strength_subjects);
  if (strengths !== undefined) updates.strength_subjects = strengths;
  const struggles = asStringArray(value.struggle_subjects);
  if (struggles !== undefined) updates.struggle_subjects = struggles;

  return Object.keys(updates).length > 0 ? updates : null;
}

async function ensureOwnedStudent(req: Request, studentId: string) {
  const current = await getCurrentParent(req);
  if (!current?.parent) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const supabase = createRequestClient(req);
  const { data: student, error } = await supabase
    .from("student_profiles")
    .select("id,parent_id")
    .eq("id", studentId)
    .maybeSingle();
  if (error) return { response: NextResponse.json({ error: "Failed to verify student ownership" }, { status: 500 }) };
  if (!student) return { response: NextResponse.json({ error: "Student not found" }, { status: 404 }) };
  if (student.parent_id !== current.parent.id) return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { supabase };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const owned = await ensureOwnedStudent(req, params.id);
  if (owned.response) return owned.response;

  const body = await req.json().catch(() => null);
  const updates = parseUpdates(body);
  if (!updates) return NextResponse.json({ error: "Valid student updates are required" }, { status: 400 });

  const { data, error } = await owned.supabase!
    .from("student_profiles")
    .update(updates)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "Failed to update student profile" }, { status: 500 });
  return NextResponse.json({ student: data });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const owned = await ensureOwnedStudent(req, params.id);
  if (owned.response) return owned.response;

  const { error } = await owned.supabase!.from("student_profiles").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: "Failed to delete student profile" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
