import { getCurrentParent } from "@/lib/current-parent";
import { createRequestClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseName(value: unknown): string | null {
  if (!isRecord(value) || typeof value.name !== "string") return null;
  const name = value.name.trim();
  return name.length > 0 && name.length <= 120 ? name : null;
}

export async function GET(req: Request) {
  const current = await getCurrentParent(req);
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ user: { id: current.user.id, email: current.user.email }, parent: current.parent });
}

export async function POST(req: Request) {
  const current = await getCurrentParent(req);
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = parseName(body);
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const supabase = createRequestClient(req);
  if (current.parent) {
    const { data, error } = await supabase
      .from("parent_profiles")
      .update({ name })
      .eq("id", current.parent.id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: "Failed to update parent profile" }, { status: 500 });
    return NextResponse.json({ parent: data });
  }

  const { data, error } = await supabase
    .from("parent_profiles")
    .insert({ user_id: current.user.id, name })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "Failed to create parent profile" }, { status: 500 });
  return NextResponse.json({ parent: data }, { status: 201 });
}
