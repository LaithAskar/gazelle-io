// Foundational typed query helpers. Keep raw Supabase calls out of feature code —
// add reusable, typed accessors here. These cover the cross-cutting reads/writes
// used across web + agents; feature-specific queries are added in their phases.

import type { PostgrestError } from "@supabase/supabase-js";
import type { GazelleClient } from "./client";
import type { AgentLog, Insert, ParentProfile, StudentProfile, TeacherProfile, User } from "@gazelle/shared";

/** Throw on a Postgrest error, otherwise return the data. */
function unwrap<T>(res: { data: T; error: PostgrestError | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export async function getUserById(db: GazelleClient, id: string): Promise<User | null> {
  return unwrap(await db.from("users").select("*").eq("id", id).maybeSingle());
}

export async function getTeacherByUserId(
  db: GazelleClient,
  userId: string,
): Promise<TeacherProfile | null> {
  return unwrap(
    await db.from("teacher_profiles").select("*").eq("user_id", userId).maybeSingle(),
  );
}

export async function getParentByUserId(
  db: GazelleClient,
  userId: string,
): Promise<ParentProfile | null> {
  return unwrap(
    await db.from("parent_profiles").select("*").eq("user_id", userId).maybeSingle(),
  );
}

/** Students owned by a parent (parent has full access via RLS). */
export async function getStudentsForParent(
  db: GazelleClient,
  parentId: string,
): Promise<StudentProfile[]> {
  return unwrap(await db.from("student_profiles").select("*").eq("parent_id", parentId)) ?? [];
}

/** Students linked to a teacher (teacher has read-only access via RLS). */
export async function getStudentsForTeacher(
  db: GazelleClient,
  teacherId: string,
): Promise<StudentProfile[]> {
  return unwrap(await db.from("student_profiles").select("*").eq("teacher_id", teacherId)) ?? [];
}

// --- Agent review protocol -------------------------------------------------
// Every agent output is logged with status 'pending' BEFORE any user sees it,
// then flipped to 'approved' (or 'rejected') after the content filter runs.
// Requires the service-role client (agent_logs has no client RLS policies).

/** Log an agent output as 'pending'. Returns the created log row's id. */
export async function logAgentOutputPending(
  db: GazelleClient,
  entry: Omit<Insert<"agent_logs">, "status" | "id" | "created_at" | "reviewed_at">,
): Promise<string> {
  const row = unwrap(
    await db
      .from("agent_logs")
      .insert({ ...entry, status: "pending" })
      .select("id")
      .single(),
  );
  if (!row) throw new Error("Failed to insert agent_logs row");
  return row.id;
}

/** Resolve a pending agent log to 'approved' or 'rejected' after filtering. */
export async function resolveAgentLog(
  db: GazelleClient,
  id: string,
  status: "approved" | "rejected",
  filterResult?: AgentLog["filter_result"],
): Promise<void> {
  unwrap(
    await db
      .from("agent_logs")
      .update({ status, filter_result: filterResult ?? null, reviewed_at: new Date().toISOString() })
      .eq("id", id)
      .select("id")
      .single(),
  );
}
