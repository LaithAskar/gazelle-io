import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@gazelle/shared";

// Cast to the canonical typed client — @supabase/ssr's return type can degrade
// mutation payloads to `never` under our generated Database types.
export function createClient(): SupabaseClient<Database> {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as never),
            );
          } catch {
            // Called from a Server Component — safe to ignore; middleware refreshes.
          }
        },
      },
    },
  ) as unknown as SupabaseClient<Database>;
}

/**
 * Request-scoped anon client for API routes.
 *
 * iOS cannot use Supabase SSR cookies, so native requests send
 * Authorization: Bearer <Supabase access token>. Web dashboard requests keep
 * using cookies. This never uses the service-role key.
 */
export function createRequestClient(req?: Request): SupabaseClient<Database> {
  const authHeader = req?.headers.get("authorization") ?? req?.headers.get("Authorization");
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

  if (!token) return createClient();

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  ) as unknown as SupabaseClient<Database>;
}
