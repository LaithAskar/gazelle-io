// Per-user rate limiting for expensive AI routes. Counts come from agent_logs,
// which every generation already writes, so this needs no new dependency/table.
//
// Atomicity blocker: these read-only counts cannot reserve capacity atomically.
// Concurrent requests can all pass before their agent_logs rows exist. Closing
// that race requires a transactional database RPC/counter or an external
// distributed limiter; neither is available under the current schema/scope.

import { createServiceRoleClient } from "@gazelle/db";

const WINDOW_MS = 60_000;
const MAX_PER_MINUTE = 8;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PER_DAY = 100;
const PARENT_MAX_PER_MINUTE = 12;
const PARENT_MAX_PER_DAY = 300;
const FAILURE_RETRY_SECONDS = 60;

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

export interface CountResult {
  count: number | null;
  error: unknown;
}

export interface StudentIdResult {
  data: Array<{ id: string }> | null;
  error: unknown;
}

/** Minimal data boundary used by deterministic tests; production adapts Supabase to it. */
export interface RateLimitSource {
  findStudentIds(parentId: string): Promise<StudentIdResult>;
  countTeacherLogs(teacherId: string, since: string): Promise<CountResult>;
  countStudentLogs(studentIds: string[], since: string): Promise<CountResult>;
}

let cached: ReturnType<typeof createServiceRoleClient> | null = null;
function db() {
  if (!cached) cached = createServiceRoleClient();
  return cached;
}

function sourceFor(client: ReturnType<typeof createServiceRoleClient>): RateLimitSource {
  return {
    async findStudentIds(parentId) {
      const { data, error } = await client.from("student_profiles").select("id").eq("parent_id", parentId);
      return { data, error };
    },
    async countTeacherLogs(teacherId, since) {
      const { count, error } = await client
        .from("agent_logs")
        .select("id", { count: "exact", head: true })
        .eq("teacher_id", teacherId)
        .gte("created_at", since);
      return { count, error };
    },
    async countStudentLogs(studentIds, since) {
      const { count, error } = await client
        .from("agent_logs")
        .select("id", { count: "exact", head: true })
        .in("student_id", studentIds)
        .gte("created_at", since);
      return { count, error };
    },
  };
}

function deny(retryAfterSeconds: number): RateLimitResult {
  return { ok: false, retryAfterSeconds };
}

function isUsableCount(result: CountResult): result is CountResult & { count: number; error: null } {
  return result.error == null && Number.isSafeInteger(result.count) && result.count !== null && result.count >= 0;
}

export async function checkTeacherAgentRateLimitWithSource(
  source: RateLimitSource,
  teacherId: string,
  now = Date.now(),
): Promise<RateLimitResult> {
  if (!teacherId.trim()) return deny(FAILURE_RETRY_SECONDS);

  const minuteStart = new Date(now - WINDOW_MS).toISOString();
  const dayStart = new Date(now - DAY_MS).toISOString();

  let minute: CountResult;
  let day: CountResult;
  try {
    [minute, day] = await Promise.all([
      source.countTeacherLogs(teacherId, minuteStart),
      source.countTeacherLogs(teacherId, dayStart),
    ]);
  } catch {
    return deny(FAILURE_RETRY_SECONDS);
  }

  // A query error or missing exact count is indeterminate, so deny rather than
  // silently treating it as zero and allowing an expensive call.
  if (!isUsableCount(minute) || !isUsableCount(day)) return deny(FAILURE_RETRY_SECONDS);
  if (minute.count >= MAX_PER_MINUTE) return deny(Math.ceil(WINDOW_MS / 1000));
  if (day.count >= MAX_PER_DAY) return deny(Math.ceil(DAY_MS / 1000));
  return { ok: true, retryAfterSeconds: 0 };
}

export async function checkAgentRateLimit(teacherId: string): Promise<RateLimitResult> {
  return checkTeacherAgentRateLimitWithSource(sourceFor(db()), teacherId);
}

export async function checkParentAgentRateLimitWithSource(
  source: RateLimitSource,
  parentId: string,
  now = Date.now(),
): Promise<RateLimitResult> {
  if (!parentId.trim()) return deny(FAILURE_RETRY_SECONDS);

  let students: StudentIdResult;
  try {
    students = await source.findStudentIds(parentId);
  } catch {
    return deny(FAILURE_RETRY_SECONDS);
  }

  if (students.error != null || students.data === null) return deny(FAILURE_RETRY_SECONDS);
  if (students.data.some((student) => typeof student.id !== "string" || !student.id.trim())) {
    return deny(FAILURE_RETRY_SECONDS);
  }

  const studentIds = students.data.map((student) => student.id);
  if (studentIds.length === 0) return { ok: true, retryAfterSeconds: 0 };

  const minuteStart = new Date(now - WINDOW_MS).toISOString();
  const dayStart = new Date(now - DAY_MS).toISOString();

  let minute: CountResult;
  let day: CountResult;
  try {
    [minute, day] = await Promise.all([
      source.countStudentLogs(studentIds, minuteStart),
      source.countStudentLogs(studentIds, dayStart),
    ]);
  } catch {
    return deny(FAILURE_RETRY_SECONDS);
  }

  if (!isUsableCount(minute) || !isUsableCount(day)) return deny(FAILURE_RETRY_SECONDS);
  if (minute.count >= PARENT_MAX_PER_MINUTE) return deny(Math.ceil(WINDOW_MS / 1000));
  if (day.count >= PARENT_MAX_PER_DAY) return deny(Math.ceil(DAY_MS / 1000));
  return { ok: true, retryAfterSeconds: 0 };
}

export async function checkParentAgentRateLimit(parentId: string): Promise<RateLimitResult> {
  return checkParentAgentRateLimitWithSource(sourceFor(db()), parentId);
}

/** Standard 429 response body + Retry-After header. */
export function rateLimitResponseInit(retryAfterSeconds: number): ResponseInit {
  return { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } };
}
