// Voyage AI embeddings (voyage-3.5, 1024 dims) via the REST API.
// Called directly with fetch — no SDK dependency. Asymmetric retrieval:
// documents are embedded with input_type "document", queries with "query".
//
// The API key is read from process.env.VOYAGE_API_KEY by default (decoupled
// from the full env schema so embedding works without the LLM/Apify keys).

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
export const EMBEDDING_MODEL = "voyage-3.5";
export const EMBEDDING_DIMENSIONS = 1024;

export interface EmbedOptions {
  apiKey?: string;
  inputType?: "document" | "query";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function embedTexts(
  texts: string[],
  opts: EmbedOptions = {},
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const apiKey = opts.apiKey ?? process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY is not set (required for embeddings).");

  // Retry on 429 (Voyage free tier is 3 RPM until a payment method is added).
  // Backoff respects Retry-After when present; capped so web requests don't hang.
  const maxAttempts = 3;
  const backoffsMs = [4000, 10000];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(VOYAGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: texts,
        input_type: opts.inputType ?? "document",
      }),
    });

    if (res.ok) {
      const json = (await res.json()) as { data: { embedding: number[]; index: number }[] };
      return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
    }

    const body = await res.text();
    const isLast = attempt === maxAttempts - 1;
    if (res.status === 429 && !isLast) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : backoffsMs[attempt]!;
      await sleep(waitMs);
      continue;
    }
    throw new Error(`Voyage embeddings failed (${res.status}): ${body}`);
  }
  throw new Error("Voyage embeddings failed after retries.");
}

export async function embedQuery(query: string, apiKey?: string): Promise<number[]> {
  const [vec] = await embedTexts([query], { apiKey, inputType: "query" });
  if (!vec) throw new Error("Embedding returned no vector for query.");
  return vec;
}

/** pgvector accepts its text format `[a,b,c]`, which equals a JSON array string. */
export function toVectorLiteral(embedding: number[]): string {
  return JSON.stringify(embedding);
}
