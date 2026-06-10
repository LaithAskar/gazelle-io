import { getCurrentParent } from "@/lib/current-parent";
import { createRequestClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Pace = "slow" | "steady" | "fast";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] | null {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) return null;
  return value.map((item) => item.trim()).filter(Boolean).slice(0, 6);
}

function parseStudent(value: unknown):
  | {
      name: string;
      grade: number;
      age: number | null;
      pace: Pace;
      strength_subjects: string[] | null;
      struggle_subjects: string[] | null;
    }
  | null {
  if (!isRecord(value)) return null;
  if (typeof value.name !== "string") return null;
  const name = value.name.trim();
  if (name.length === 0 || name.length > 80) return null;

  const grade = typeof value.grade === "number" ? value.grade : Number(value.grade);
  if (!Number.isInteger(grade) || grade < 0 || grade > 6) return null;

  let age: number | null = null;
  if (value.age !== undefined && value.age !== null && value.age !== "") {
    const parsedAge = typeof value.age === "number" ? value.age : Number(value.age);
    if (!Number.isInteger(parsedAge) || parsedAge < 4 || parsedAge > 13) return null;
    age = parsedAge;
  }

  const pace = value.pace === "slow" || value.pace === "fast" || value.pace === "steady" ? value.pace : "steady";
  const strength_subjects = asStringArray(value.strength_subjects);
  const struggle_subjects = asStringArray(value.struggle_subjects);
  if (strength_subjects === null && value.strength_subjects !== undefined && value.strength_subjects !== null) return null;
  if (struggle_subjects === null && value.struggle_subjects !== undefined && value.struggle_subjects !== null) return null;

  return { name, grade, age, pace, strength_subjects, struggle_subjects };
}

export async function GET(req: Request) {
  const current = await getCurrentParent(req);
  if (!current?.parent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createRequestClient(req);
  const { data, error } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("parent_id", current.parent.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Failed to load students" }, { status: 500 });
  return NextResponse.json({ students: data ?? [] });
}

export async function POST(req: Request) {
  const current = await getCurrentParent(req);
  if (!current?.parent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const student = parseStudent(body);
  if (!student) return NextResponse.json({ error: "Valid student profile is required" }, { status: 400 });

  const supabase = createRequestClient(req);
  const { data, error } = await supabase
    .from("student_profiles")
    .insert({ parent_id: current.parent.id, ...student })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "Failed to create student profile" }, { status: 500 });
  return NextResponse.json({ student: data }, { status: 201 });
}
