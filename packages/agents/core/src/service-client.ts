// Lazy service-role Supabase client shared across an agent process.
// Agents run server-side and need to bypass RLS (curriculum_knowledge,
// agent_logs, cross-table reads). Never import this into client code.

import { createServiceRoleClient, type GazelleClient } from "@gazelle/db";

let cached: GazelleClient | null = null;

export function serviceClient(): GazelleClient {
  if (!cached) cached = createServiceRoleClient();
  return cached;
}
