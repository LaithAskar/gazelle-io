// Seed the RAG knowledge base with real Common Core standards (no Apify).
// Idempotent: upserts standards by (source, code) and skips knowledge rows that
// already exist for a standard. Run with: pnpm -F @gazelle/rag seed
//
// Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VOYAGE_API_KEY.

import { createServiceRoleClient } from "@gazelle/db";
import type { Insert } from "@gazelle/shared";
import { ingestKnowledge, type KnowledgeInput } from "./ingest";
import { SEED_SOURCE, SEED_STANDARDS } from "./seed-data";

async function main() {
  const db = createServiceRoleClient();

  // 1. Upsert standards.
  const standardRows: Insert<"curriculum_standards">[] = SEED_STANDARDS.map((s) => ({
    source: SEED_SOURCE,
    grade: s.grade,
    subject: s.subject,
    code: s.code,
    description: s.description,
  }));

  const { data: upserted, error: upsertErr } = await db
    .from("curriculum_standards")
    .upsert(standardRows, { onConflict: "source,code" })
    .select("id, code");
  if (upsertErr) throw new Error(`Standard upsert failed: ${upsertErr.message}`);
  console.log(`Upserted ${upserted?.length ?? 0} standards.`);

  const idByCode = new Map((upserted ?? []).map((r) => [r.code, r.id]));

  // 2. Only embed knowledge for standards that don't already have a chunk.
  const { data: existing, error: existErr } = await db
    .from("curriculum_knowledge")
    .select("standard_id")
    .not("standard_id", "is", null);
  if (existErr) throw new Error(`Existing-knowledge check failed: ${existErr.message}`);
  const haveKnowledge = new Set((existing ?? []).map((r) => r.standard_id));

  const toEmbed: KnowledgeInput[] = SEED_STANDARDS.flatMap((s) => {
    const standardId = idByCode.get(s.code);
    if (!standardId || haveKnowledge.has(standardId)) return [];
    return [
      {
        // Embed the code + description together so search matches either.
        content: `${s.code}: ${s.description}`,
        source: SEED_SOURCE,
        grade: s.grade,
        subject: s.subject,
        standardId,
        metadata: { code: s.code },
      },
    ];
  });

  if (toEmbed.length === 0) {
    console.log("All standards already have knowledge chunks. Nothing to embed.");
    return;
  }

  console.log(`Embedding + storing ${toEmbed.length} knowledge chunks via Voyage...`);
  const stored = await ingestKnowledge(db, toEmbed);
  console.log(`Done. Stored ${stored} curriculum_knowledge rows.`);
}

main().catch((e) => {
  console.error("SEED FAILED:", e);
  process.exit(1);
});
