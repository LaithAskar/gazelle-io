// v1 content filter — deterministic, rule-based. Fast and free; no LLM call.
// Gates agent output before it reaches a user (the agent_logs review protocol).
//
// LIMITATIONS (flagged): this is a pragmatic first pass. PII detection is regex-
// based; banned-topic detection is keyword-based and can false-positive (e.g.
// "Civil War" in a history lesson). Upgrade to an LLM moderation pass post-MVP.
// For now: PII is checked for ALL agents; banned topics only in `strict` mode
// (student-facing Tutor output).

const PII_PATTERNS: Array<[string, RegExp]> = [
  ["email", /[\w.+-]+@[\w-]+\.[\w.-]+/],
  ["phone", /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/],
  ["ssn", /\b\d{3}-\d{2}-\d{4}\b/],
];

// Student-facing banned categories: adult, violence, political, religious.
const BANNED_PATTERNS: Array<[string, RegExp]> = [
  ["adult", /\b(sex|sexual|porn|nude|naked)\b/i],
  ["violence", /\b(kill|murder|suicide|gun|shoot|weapon)\b/i],
  ["substances", /\b(drugs|cocaine|heroin|alcohol|vape)\b/i],
  ["political", /\b(democrat|republican|abortion|election|congress)\b/i],
  ["religious", /\b(jesus|christ|allah|bible|quran|church|mosque|prayer)\b/i],
];

export interface FilterResult {
  ok: boolean;
  flags: string[];
}

export function filterContent(text: string, opts: { strict?: boolean } = {}): FilterResult {
  const flags: string[] = [];

  for (const [label, re] of PII_PATTERNS) {
    if (re.test(text)) flags.push(`pii:${label}`);
  }

  if (opts.strict) {
    for (const [label, re] of BANNED_PATTERNS) {
      if (re.test(text)) flags.push(`banned:${label}`);
    }
  }

  return { ok: flags.length === 0, flags };
}
