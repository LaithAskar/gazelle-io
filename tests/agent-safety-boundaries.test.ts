import assert from "node:assert/strict";
import test from "node:test";

import { filterContent, redactPII } from "../packages/agents/core/src/content-filter.ts";
import { extractJson } from "../packages/agents/core/src/json.ts";

test("content filter rejects PII for every agent mode", () => {
  for (const [text, flag] of [
    ["Email me at learner@example.com", "pii:email"],
    ["Call (415) 555-0123", "pii:phone"],
    ["My SSN is 123-45-6789", "pii:ssn"],
  ] as const) {
    const result = filterContent(text);
    assert.equal(result.ok, false);
    assert.ok(result.flags.includes(flag));
  }
});

test("strict content filter rejects student-facing banned topics and violent inflections", () => {
  for (const text of [
    "A gun is a weapon.",
    "The story describes killing.",
    "The killers ran away.",
    "The story describes shooting.",
    "The character was shot.",
    "The shooter ran away.",
    "The shooters ran away.",
    "The article mentions firearms.",
    "The report discusses suicides.",
    "The character was stabbed.",
    "The character used drugs.",
    "The election is political.",
    "They met at church for prayer.",
  ]) {
    assert.equal(filterContent(text, { strict: true }).ok, false, text);
  }
});

test("strict content filter preserves precise astronomy and word-boundary exceptions", () => {
  for (const text of [
    "We watched a shooting star cross the night sky.",
    "We watched a shooting-star cross the night sky.",
    "We watched several shooting-stars cross the night sky.",
    "The class photographed a meteor shower.",
    "The skillful student solved the problem.",
    "The workshop starts after lunch.",
    "The troubleshooter repaired the telescope.",
  ]) {
    assert.deepEqual(filterContent(text, { strict: true }), { ok: true, flags: [] }, text);
  }
});

test("astronomy exception does not mask separate violent language", () => {
  for (const text of [
    "We watched a shooting-star, then discussed a shooter.",
    "Shooting stars are meteors; the story also described shooting.",
  ]) {
    assert.deepEqual(filterContent(text, { strict: true }), {
      ok: false,
      flags: ["banned:violence"],
    }, text);
  }
});

test("non-strict filtering does not apply student-only topic rules", () => {
  assert.deepEqual(filterContent("A history lesson about Congress."), { ok: true, flags: [] });
});

test("PII redaction replaces every occurrence without changing safe text", () => {
  assert.deepEqual(redactPII("safe answer"), { redacted: "safe answer", flags: [] });
  assert.deepEqual(redactPII("a@example.com and b@example.com"), {
    redacted: "[redacted:email] and [redacted:email]",
    flags: ["pii:email"],
  });
});

test("JSON extraction accepts bare, fenced, prose-wrapped, and escaped nested values", () => {
  assert.deepEqual(extractJson('{"ok":true}'), { ok: true });
  assert.deepEqual(extractJson("```json\n[1, 2, 3]\n```"), [1, 2, 3]);
  assert.deepEqual(extractJson('Here is the result: {"value":2} Thanks.'), { value: 2 });
  assert.deepEqual(
    extractJson('Result: {"message":"escaped \\\"quote\\\" and braces } ]","nested":[{"ok":true}]} Done.'),
    { message: 'escaped "quote" and braces } ]', nested: [{ ok: true }] },
  );
});

test("JSON extraction fails closed for missing, malformed, or ambiguous JSON", () => {
  for (const text of [
    "no structured value",
    '{"missing":',
    '{"first":1} {"second":2}',
    '{"first":1} trailing [',
    '{"first":1} trailing {"second":',
    '```json\n{"first":1}\n``` trailing {"second":2}',
    '```json\n{"first":1}\n``` trailing [',
    '```json\n{"first":1}\n``` trailing {"second":',
    '```json\n{"first":1}\n```\n```json\n{"second":2}\n```',
    '```json\n{"first":1}\n```\nSome prose.\n```\n[2]\n```',
  ]) {
    assert.throws(() => extractJson(text), text);
  }
});

test("JSON extraction rejects unmatched closers and malformed Markdown fences", () => {
  for (const text of [
    '{"a":1}]',
    '{"a":1}}',
    '] prose {"a":1}',
    '```json\n{"a":1}',
    '{"a":1}\n```',
    '```json\n{"a":1}\n~~~',
    '````json\n{"a":1}\n```',
    '```json\n{"a":1}\n````',
    '```typescript\n{"a":1}\n```',
    '```json\n{"a":1}\n```\n```',
    '```\n```json\n{"a":1}\n```\n```',
  ]) {
    assert.throws(() => extractJson(text), text);
  }
});

test("JSON extraction accepts exactly one correctly fenced or prose-wrapped nested value", () => {
  assert.deepEqual(extractJson('Before.\n```json\n{"items":[{"text":"escaped \\\"quote\\\" with } ] and ```"}]}\n```\nAfter.'), {
    items: [{ text: 'escaped "quote" with } ] and ```' }],
  });
  assert.deepEqual(extractJson("```\n[1, {\"nested\":true}]\n```"), [1, { nested: true }]);
  assert.deepEqual(extractJson("~~~json\r\n{\"ok\":true}\r\n~~~"), { ok: true });
  assert.deepEqual(extractJson('Before {"items":[{"text":"escaped \\\"quote\\\" with } ]"}]} after.'), {
    items: [{ text: 'escaped "quote" with } ]' }],
  });
});
