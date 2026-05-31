// Text chunking for the RAG pipeline (~500 tokens per chunk).
//
// NOTE: token counts are APPROXIMATED at ~4 chars/token rather than using a
// real tokenizer, to avoid a tokenizer dependency. Good enough for curriculum
// prose; revisit if we need exact token budgeting. Splits on paragraph then
// sentence boundaries so chunks stay semantically coherent, with a small
// overlap to preserve context across boundaries.

const CHARS_PER_TOKEN = 4;

export interface ChunkOptions {
  targetTokens?: number;
  overlapTokens?: number;
}

export function chunkText(text: string, opts: ChunkOptions = {}): string[] {
  const targetChars = (opts.targetTokens ?? 500) * CHARS_PER_TOKEN;
  const overlapChars = (opts.overlapTokens ?? 50) * CHARS_PER_TOKEN;

  const clean = text.replace(/\r\n/g, "\n").trim();
  if (clean.length === 0) return [];
  if (clean.length <= targetChars) return [clean];

  // Prefer paragraph boundaries, fall back to sentences for long paragraphs.
  const segments = clean
    .split(/\n{2,}/)
    .flatMap((p) => (p.length > targetChars ? splitSentences(p) : [p]))
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";
  for (const seg of segments) {
    if (current && current.length + seg.length + 1 > targetChars) {
      chunks.push(current.trim());
      const tail = current.slice(Math.max(0, current.length - overlapChars));
      current = `${tail} ${seg}`;
    } else {
      current = current ? `${current} ${seg}` : seg;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function splitSentences(paragraph: string): string[] {
  return paragraph.split(/(?<=[.!?])\s+/).filter(Boolean);
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}
