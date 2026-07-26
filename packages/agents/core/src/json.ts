// Extract one JSON object/array from an LLM text response. Handles bare JSON,
// ```json fenced blocks, and a single value surrounded by prose. Rejects a
// second (even incomplete) structured fragment instead of guessing which value
// the caller intended.

interface JsonSpan {
  start: number;
  end: number;
}

const FENCE_MARKER = /`{3,}|~{3,}/g;

function validateResponseStructure(candidate: string, span: JsonSpan): void {
  const prefix = candidate.slice(0, span.start);
  const suffix = candidate.slice(span.end);
  const outsideJson = `${prefix}${suffix}`;

  // Any object/array delimiter outside the parsed value is ambiguous, whether
  // it is an opener, a closer, or an incomplete second fragment.
  if (/[{}\[\]]/.test(outsideJson)) {
    throw new Error("Unexpected JSON delimiter outside the value");
  }

  const markers = outsideJson.match(FENCE_MARKER) ?? [];
  if (markers.length === 0) return;
  if (markers.length !== 2) throw new Error("Malformed or multiple Markdown fences");

  const opening = prefix.match(/(?:^|\r?\n)[ \t]*(`{3,}|~{3,})[ \t]*(?:json)?[ \t]*\r?\n[ \t]*$/i);
  const closing = suffix.match(/^[ \t]*\r?\n[ \t]*(`{3,}|~{3,})[ \t]*(?:\r?\n|$)/);

  if (!opening || !closing || opening[1] !== closing[1]) {
    throw new Error("Unclosed or mismatched Markdown fence");
  }
}

function findCompleteJsonSpan(candidate: string): JsonSpan {
  const start = candidate.search(/[{[]/);
  if (start < 0) throw new Error("No JSON object or array found");

  const closing: string[] = [];
  let inString = false;
  let escaped = false;

  for (let index = start; index < candidate.length; index += 1) {
    const character = candidate[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
    } else if (character === "{") {
      closing.push("}");
    } else if (character === "[") {
      closing.push("]");
    } else if (character === "}" || character === "]") {
      if (closing.pop() !== character) throw new Error("Mismatched JSON delimiters");
      if (closing.length === 0) return { start, end: index + 1 };
    }
  }

  throw new Error("Incomplete JSON object or array");
}

export function extractJson<T = unknown>(text: string): T {
  // Scan the complete response, including text outside markdown fences. Fence
  // markers are ordinary prose around the JSON; narrowing to fence contents
  // first would hide a second complete or truncated value elsewhere.
  const candidate = text.trim();

  try {
    const span = findCompleteJsonSpan(candidate);
    validateResponseStructure(candidate, span);
    return JSON.parse(candidate.slice(span.start, span.end)) as T;
  } catch {
    throw new Error(`Could not parse exactly one JSON value from model output: ${text.slice(0, 200)}`);
  }
}
