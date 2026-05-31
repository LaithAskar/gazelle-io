// Server-only Supabase client — uses the SERVICE ROLE key, which BYPASSES RLS.
//
// ⚠️ This must NEVER run client-side. The service role key is the keys-to-the-
// kingdom credential (full DB access, ignores all RLS / COPPA boundaries).
// All three agents and any server route that needs privileged access use this.
//
// A runtime guard throws if this is ever reached in a browser context. The key
// itself is only read from process.env at call time, so it is never embedded in
// a client bundle.

import { createClient } from "@supabase/supabase-js";
import { parseSupabaseServerEnv, type Database } from "@gazelle/shared";
import type { GazelleClient } from "./client";

export function createServiceRoleClient(
  env: ReturnType<typeof parseSupabaseServerEnv> = parseSupabaseServerEnv(),
): GazelleClient {
  if (typeof (globalThis as Record<string, unknown>).window !== "undefined") {
    throw new Error(
      "createServiceRoleClient() was called in a browser context. The Supabase " +
        "service role key is server-side only and must never reach the client.",
    );
  }
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
