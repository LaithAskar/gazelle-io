// Semantic search over curriculum_knowledge via the match_curriculum_knowledge
// RPC (cosine similarity). Embeds the query (input_type "query") then ranks.
// Use the service-role client — curriculum_knowledge is service-role only.

import type { GazelleClient } from "@gazelle/db";
import { embedQuery, toVectorLiteral } from "./embed";

export interface SearchOptions {
  grade?: number | null;
  subject?: string | null;
  matchCount?: number;
  apiKey?: string;
}

export interface KnowledgeMatch {
  id: string;
  content: string;
  grade: number | null;
  subject: string | null;
  source: string;
  standard_id: string | null;
  similarity: number;
}

export async function searchCurriculumKnowledge(
  db: GazelleClient,
  query: string,
  opts: SearchOptions = {},
): Promise<KnowledgeMatch[]> {
  const embedding = await embedQuery(query, opts.apiKey);

  const { data, error } = await db.rpc("match_curriculum_knowledge", {
    query_embedding: toVectorLiteral(embedding),
    match_count: opts.matchCount ?? 5,
    filter_grade: opts.grade ?? undefined,
    filter_subject: opts.subject ?? undefined,
  });

  if (error) throw new Error(`Curriculum search failed: ${error.message}`);
  return (data ?? []) as KnowledgeMatch[];
}
