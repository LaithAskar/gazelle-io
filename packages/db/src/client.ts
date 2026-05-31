// Browser / client Supabase client — uses the ANON key only.
// Safe to use in the Next.js client and (conceptually) the iOS app.
// RLS policies (002_rls_policies.sql) govern what this client can see.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parseClientEnv, type Database } from "@gazelle/shared";

export type GazelleClient = SupabaseClient<Database>;

export function createBrowserClient(
  env: ReturnType<typeof parseClientEnv> = parseClientEnv(),
): GazelleClient {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    },
  );
}
