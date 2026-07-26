import assert from "node:assert/strict";
import test from "node:test";

import {
  checkParentAgentRateLimitWithSource,
  checkTeacherAgentRateLimitWithSource,
  rateLimitResponseInit,
  type RateLimitSource,
} from "../apps/web/lib/rate-limit.ts";
import { isOwnedStudent, isSessionForStudent } from "../apps/web/lib/session-ownership.ts";

const NOW = Date.parse("2026-07-26T12:00:00.000Z");

function source(overrides: Partial<RateLimitSource> = {}): RateLimitSource {
  return {
    findStudentIds: async () => ({ data: [{ id: "student-1" }], error: null }),
    countTeacherLogs: async () => ({ count: 0, error: null }),
    countStudentLogs: async () => ({ count: 0, error: null }),
    ...overrides,
  };
}

test("teacher limiter enforces minute and daily boundaries", async () => {
  assert.deepEqual(
    await checkTeacherAgentRateLimitWithSource(
      source({ countTeacherLogs: async (_id, since) => ({ count: since.includes("11:59") ? 7 : 99, error: null }) }),
      "teacher-1",
      NOW,
    ),
    { ok: true, retryAfterSeconds: 0 },
  );

  assert.deepEqual(
    await checkTeacherAgentRateLimitWithSource(
      source({ countTeacherLogs: async (_id, since) => ({ count: since.includes("11:59") ? 8 : 99, error: null }) }),
      "teacher-1",
      NOW,
    ),
    { ok: false, retryAfterSeconds: 60 },
  );

  assert.deepEqual(
    await checkTeacherAgentRateLimitWithSource(
      source({ countTeacherLogs: async (_id, since) => ({ count: since.includes("11:59") ? 7 : 100, error: null }) }),
      "teacher-1",
      NOW,
    ),
    { ok: false, retryAfterSeconds: 86_400 },
  );
});

test("teacher limiter fails closed on query errors, missing counts, and thrown queries", async () => {
  for (const failingSource of [
    source({ countTeacherLogs: async () => ({ count: 0, error: { message: "database unavailable" } }) }),
    source({ countTeacherLogs: async () => ({ count: null, error: null }) }),
    source({ countTeacherLogs: async () => Promise.reject(new Error("network failure")) }),
  ]) {
    assert.deepEqual(await checkTeacherAgentRateLimitWithSource(failingSource, "teacher-1", NOW), {
      ok: false,
      retryAfterSeconds: 60,
    });
  }
});

test("teacher limiter denies a blank teacher ID without querying", async () => {
  let queried = false;
  const result = await checkTeacherAgentRateLimitWithSource(
    source({
      countTeacherLogs: async () => {
        queried = true;
        return { count: 0, error: null };
      },
    }),
    "   ",
    NOW,
  );
  assert.deepEqual(result, { ok: false, retryAfterSeconds: 60 });
  assert.equal(queried, false);
});

test("parent limiter fails closed when ownership lookup or count queries are indeterminate", async () => {
  for (const failingSource of [
    source({ findStudentIds: async () => ({ data: null, error: { message: "lookup failed" } }) }),
    source({ findStudentIds: async () => ({ data: null, error: null }) }),
    source({ countStudentLogs: async () => ({ count: null, error: null }) }),
  ]) {
    assert.deepEqual(await checkParentAgentRateLimitWithSource(failingSource, "parent-1", NOW), {
      ok: false,
      retryAfterSeconds: 60,
    });
  }
});

test("parent limiter denies a blank parent ID without querying ownership", async () => {
  let queried = false;
  const result = await checkParentAgentRateLimitWithSource(
    source({
      findStudentIds: async () => {
        queried = true;
        return { data: [], error: null };
      },
    }),
    "\t",
    NOW,
  );
  assert.deepEqual(result, { ok: false, retryAfterSeconds: 60 });
  assert.equal(queried, false);
});

test("parent limiter denies an invalid student ID returned by ownership lookup", async () => {
  assert.deepEqual(
    await checkParentAgentRateLimitWithSource(
      source({ findStudentIds: async () => ({ data: [{ id: " " }], error: null }) }),
      "parent-1",
      NOW,
    ),
    { ok: false, retryAfterSeconds: 60 },
  );
});

test("parent limiter denies when the ownership lookup throws", async () => {
  assert.deepEqual(
    await checkParentAgentRateLimitWithSource(
      source({ findStudentIds: async () => Promise.reject(new Error("ownership unavailable")) }),
      "parent-1",
      NOW,
    ),
    { ok: false, retryAfterSeconds: 60 },
  );
});

test("parent limiter denies count errors and thrown count queries", async () => {
  for (const failingSource of [
    source({ countStudentLogs: async () => ({ count: 0, error: { message: "count failed" } }) }),
    source({ countStudentLogs: async () => Promise.reject(new Error("count unavailable")) }),
  ]) {
    assert.deepEqual(await checkParentAgentRateLimitWithSource(failingSource, "parent-1", NOW), {
      ok: false,
      retryAfterSeconds: 60,
    });
  }
});

test("parent limiter allows a confirmed empty family and denies at the configured cap", async () => {
  assert.deepEqual(
    await checkParentAgentRateLimitWithSource(
      source({ findStudentIds: async () => ({ data: [], error: null }) }),
      "parent-1",
      NOW,
    ),
    { ok: true, retryAfterSeconds: 0 },
  );
  assert.deepEqual(
    await checkParentAgentRateLimitWithSource(
      source({ countStudentLogs: async (_ids, since) => ({ count: since.includes("11:59") ? 12 : 12, error: null }) }),
      "parent-1",
      NOW,
    ),
    { ok: false, retryAfterSeconds: 60 },
  );
});

test("parent limiter denies at the daily cap", async () => {
  assert.deepEqual(
    await checkParentAgentRateLimitWithSource(
      source({ countStudentLogs: async (_ids, since) => ({ count: since.includes("11:59") ? 11 : 300, error: null }) }),
      "parent-1",
      NOW,
    ),
    { ok: false, retryAfterSeconds: 86_400 },
  );
});

test("session ownership helpers deny missing and cross-owner records", () => {
  assert.equal(isOwnedStudent("parent-1", null), false);
  assert.equal(isOwnedStudent("parent-1", { parent_id: "parent-2" }), false);
  assert.equal(isOwnedStudent("parent-1", { parent_id: "parent-1" }), true);

  assert.equal(isSessionForStudent("student-1", null), false);
  assert.equal(isSessionForStudent("student-1", { student_id: "student-2" }), false);
  assert.equal(isSessionForStudent("student-1", { student_id: "student-1" }), true);
});

test("rate-limit response is an explicit 429 with Retry-After", () => {
  assert.deepEqual(rateLimitResponseInit(60), { status: 429, headers: { "Retry-After": "60" } });
});
