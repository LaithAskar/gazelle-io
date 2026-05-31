// Ingestion: take knowledge items, embed them, store in curriculum_knowledge.
// Requires the service-role client (curriculum_knowledge has no client RLS).

import type { GazelleClient } from "@gazelle/db";
import type { Insert } from "@gazelle/shared";
import { embedTexts, toVectorLiteral } from "./embed";
import { estimateTokens } from "./chunk";

export interface KnowledgeInput {
  content: string;
  source: string;
  grade?: number | null;
  subject?: string | null;
  sourceUrl?: string | null;
  standardId?: string | null;
  metadata?: Record<string, unknown>;
}

/** Embed and insert knowledge items. Returns the number of rows stored. */
export async function ingestKnowledge(
  db: GazelleClient,
  items: KnowledgeInput[],
  opts: { apiKey?: string; batchSize?: number } = {},
): Promise<number> {
  if (items.length === 0) return 0;
  const batchSize = opts.batchSize ?? 64;
  let stored = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const embeddings = await embedTexts(
      batch.map((it) => it.content),
      { apiKey: opts.apiKey, inputType: "document" },
    );

    const rows: Insert<"curriculum_knowledge">[] = batch.map((it, j) => ({
      content: it.content,
      source: it.source,
      grade: it.grade ?? null,
      subject: it.subject ?? null,
      source_url: it.sourceUrl ?? null,
      standard_id: it.standardId ?? null,
      token_count: estimateTokens(it.content),
      embedding: toVectorLiteral(embeddings[j] as number[]),
      metadata: (it.metadata ?? {}) as Insert<"curriculum_knowledge">["metadata"],
    }));

    const { error } = await db.from("curriculum_knowledge").insert(rows);
    if (error) throw new Error(`Ingest failed: ${error.message}`);
    stored += rows.length;
  }

  return stored;
}
