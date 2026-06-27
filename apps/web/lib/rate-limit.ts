// Per-teacher rate limiting for the expensive AI routes (each triggers Claude
// and/or Voyage calls). Without this, one authenticated user could spam the
// endpoints and run up the API bill — the most realistic abuse vector for the app.
//
// Implementation note: we count rows the agents already write to `agent_logs`
// (every generation logs there) within a time window, keyed by teacher_id. This
// needs no new dependency and no new table. It uses the service-role client
// because `agent_logs` has no client RLS policy. A managed limiter (e.g. Upstash)
// is the post-MVP upgrade if we need cross-instance precision.

import { createServiceRoleClient } from "@gazelle/db";

const WINDOW_MS = 60_000; // 1 minute
const MAX_PER_MINUTE = 8;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PER_DAY = 100;

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

let cached: ReturnType<typeof createServiceRoleClient> | null = null;
function db() {
  if (!cached) cached = createServiceRoleClient();
  return cached;
}

/** Returns ok:false (with a Retry-After hint) once a teacher exceeds the cap. */
export async function checkAgentRateLimit(teacherId: string): Promise<RateLimitResult> {
  const now = Date.now();
  const minuteStart = new Date(now - WINDOW_MS).toISOString();
  const dayStart = new Date(now - DAY_MS).toISOString();
  const client = db();

  const [minute, day] = await Promise.all([
    client
      .from("agent_logs")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", teacherId)
      .gte("created_at", minuteStart),
    client
      .from("agent_logs")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", teacherId)
      .gte("created_at", dayStart),
  ]);

  if ((minute.count ?? 0) >= MAX_PER_MINUTE) {
    return { ok: false, retryAfterSeconds: Math.ceil(WINDOW_MS / 1000) };
  }
  if ((day.count ?? 0) >= MAX_PER_DAY) {
    return { ok: false, retryAfterSeconds: Math.ceil(DAY_MS / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/** Standard 429 response body + Retry-After header. */
export function rateLimitResponseInit(retryAfterSeconds: number): ResponseInit {
  return { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } };
}
