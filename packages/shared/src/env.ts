// Centralized environment-variable validation (Zod).
//
// Two schemas, deliberately separated by trust boundary:
//   • clientEnvSchema — ONLY NEXT_PUBLIC_* values. Safe to expose in the
//     browser bundle and the iOS app.
//   • serverEnvSchema — adds the service role key + provider API keys.
//     These must NEVER reach client code. Only import parseServerEnv() from
//     server-side modules (API routes, agents, edge functions, scripts).
//
// Both fail fast with a clear, aggregated error listing every missing/invalid
// key, rather than crashing later at point of use.

import { z } from "zod";

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  VOYAGE_API_KEY: z.string().min(1),
  // Apify is post-MVP (curriculum scraping); optional so MVP boots without it.
  APIFY_API_KEY: z.string().min(1).optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

type EnvSource = Record<string, string | undefined>;

function parseOrThrow<T extends z.ZodTypeAny>(
  schema: T,
  source: EnvSource,
  label: string,
): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid ${label} environment variables:\n${issues}\n` +
        `Copy .env.example to .env.local and fill in the missing values.`,
    );
  }
  return result.data;
}

/** Validate the client-safe (NEXT_PUBLIC_*) env. Safe to call in the browser. */
export function parseClientEnv(source: EnvSource = process.env): ClientEnv {
  return parseOrThrow(clientEnvSchema, source, "client");
}

/** Validate the full server env. Server-side ONLY — never call from client code. */
export function parseServerEnv(source: EnvSource = process.env): ServerEnv {
  return parseOrThrow(serverEnvSchema, source, "server");
}
