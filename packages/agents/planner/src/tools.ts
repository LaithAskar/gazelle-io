// Mastra tools available to the Planner agent. Both are RAG reads over the
// shared knowledge base, run with the service-role client.

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { serviceClient } from "@gazelle/agent-core";
import { searchCurriculumKnowledge } from "@gazelle/rag";

export const searchCurriculumStandardsTool = createTool({
  id: "search_curriculum_standards",
  description:
    "Find Common Core curriculum standards by grade and subject (grade 0 = Kindergarten). Returns standard codes and descriptions.",
  inputSchema: z.object({
    grade: z.number().int().min(0).max(6),
    subject: z.string(),
  }),
  outputSchema: z.object({
    standards: z.array(
      z.object({
        code: z.string(),
        description: z.string().nullable(),
        grade: z.number(),
        subject: z.string(),
      }),
    ),
  }),
  execute: async ({ context }) => {
    const db = serviceClient();
    const { data, error } = await db
      .from("curriculum_standards")
      .select("code, description, grade, subject")
      .eq("grade", context.grade)
      .eq("subject", context.subject)
      .limit(25);
    if (error) throw new Error(error.message);
    return { standards: data ?? [] };
  },
});

export const searchCurriculumKnowledgeTool = createTool({
  id: "search_curriculum_knowledge",
  description:
    "Semantic search over the curriculum knowledge base for a free-text query. Optionally filter by grade/subject.",
  inputSchema: z.object({
    query: z.string(),
    grade: z.number().int().min(0).max(6).optional(),
    subject: z.string().optional(),
  }),
  outputSchema: z.object({
    matches: z.array(z.object({ content: z.string(), similarity: z.number() })),
  }),
  execute: async ({ context }) => {
    const db = serviceClient();
    const matches = await searchCurriculumKnowledge(db, context.query, {
      grade: context.grade ?? null,
      subject: context.subject ?? null,
      matchCount: 5,
    });
    return { matches: matches.map((m) => ({ content: m.content, similarity: m.similarity })) };
  },
});
