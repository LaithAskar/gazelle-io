// Extract a JSON object/array from an LLM text response. Handles bare JSON and
// ```json fenced blocks. Version-robust alternative to provider-specific
// structured-output APIs.

export function extractJson<T = unknown>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();

  // Fall back to the first {...} or [...] span if there is surrounding prose.
  const start = candidate.search(/[{[]/);
  const slice = start >= 0 ? candidate.slice(start) : candidate;

  try {
    return JSON.parse(slice) as T;
  } catch {
    // Try trimming to the last closing brace/bracket.
    const lastBrace = Math.max(slice.lastIndexOf("}"), slice.lastIndexOf("]"));
    if (lastBrace > 0) {
      return JSON.parse(slice.slice(0, lastBrace + 1)) as T;
    }
    throw new Error(`Could not parse JSON from model output: ${text.slice(0, 200)}`);
  }
}
