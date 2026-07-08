import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { getCurrentTeacher } from "@/lib/current-teacher";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// No ambiguous characters (0/O, 1/I/L) — parents type this on a phone.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

/** Return the teacher's class code, generating one on first request. */
export async function GET() {
  const current = await getCurrentTeacher();
  if (!current?.teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (current.teacher.class_code) {
    return NextResponse.json({ classCode: current.teacher.class_code });
  }

  // Generate + save via the teacher's own session (RLS: update own row only).
  // Retry on the rare unique-constraint collision.
  const supabase = createClient();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { data, error } = await supabase
      .from("teacher_profiles")
      .update({ class_code: code })
      .eq("id", current.teacher.id)
      .is("class_code", null)
      .select("class_code")
      .maybeSingle();

    if (!error && data?.class_code) return NextResponse.json({ classCode: data.class_code });
    if (!error && !data) {
      // Another request already set it — read it back.
      const { data: row } = await supabase
        .from("teacher_profiles")
        .select("class_code")
        .eq("id", current.teacher.id)
        .maybeSingle();
      if (row?.class_code) return NextResponse.json({ classCode: row.class_code });
    }
    if (error && error.code !== "23505") {
      console.error("[teacher/class-code] failed:", error);
      return NextResponse.json({ error: "Could not create a class code." }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "Could not create a class code." }, { status: 500 });
}
