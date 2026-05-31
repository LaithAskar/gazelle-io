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

export async function embedTexts(
  texts: string[],
  opts: EmbedOptions = {},
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const apiKey = opts.apiKey ?? process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY is not set (required for embeddings).");

  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
      input_type: opts.inputType ?? "document",
    }),
  });

  if (!res.ok) {
    throw new Error(`Voyage embeddings failed (${res.status}): ${await res.text()}`);
  }

  const json = (await res.json()) as {
    data: { embedding: number[]; index: number }[];
  };
  // Preserve input order regardless of how the API returns them.
  return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
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
