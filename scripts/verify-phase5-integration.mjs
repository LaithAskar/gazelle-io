import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function read(relativePath) {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

function assertIncludes(file, source, needle, description) {
  if (!source.includes(needle)) {
    throw new Error(`${file}: missing ${description} (${needle})`);
  }
}

function assertNotIncludes(file, source, needle, description) {
  if (source.includes(needle)) {
    throw new Error(`${file}: unexpected ${description} (${needle})`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertFailClosedGuard(file, source, helperCall, status, description) {
  const call = escapeRegExp(helperCall);
  const guard = new RegExp(
    `if\\s*\\(\\s*!${call}\\s*\\)\\s*(?:\\{\\s*)?return\\s+NextResponse\\.json\\([\\s\\S]{0,180}?status:\\s*${status}`,
  );
  if (!guard.test(source)) {
    throw new Error(
      `${file}: ${description} must negate ${helperCall} and immediately return status ${status}`,
    );
  }
}

const files = {
  parentProfile: "apps/web/app/api/parent/profile/route.ts",
  students: "apps/web/app/api/students/route.ts",
  studentById: "apps/web/app/api/students/[id]/route.ts",
  sessions: "apps/web/app/api/sessions/route.ts",
  sessionStart: "apps/web/app/api/sessions/start/route.ts",
  sessionNext: "apps/web/app/api/sessions/next/route.ts",
  sessionRespond: "apps/web/app/api/sessions/respond/route.ts",
  sessionEnd: "apps/web/app/api/sessions/end/route.ts",
  tutor: "packages/agents/tutor/src/tutor.ts",
};

const sources = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, read(path)]));

for (const [key, path] of Object.entries(files)) {
  if (key !== "tutor") {
    assertIncludes(path, sources[key], "getCurrentParent", "parent-scoped auth guard");
    assertIncludes(path, sources[key], "Unauthorized", "unauthorized response");
  }
}

assertIncludes(files.students, sources.students, "parent_id: current.parent.id", "student creation scoped to current parent");
assertIncludes(files.studentById, sources.studentById, "student.parent_id !== current.parent.id", "student detail scoped to current parent");
assertIncludes(files.sessions, sources.sessions, "ownedStudentIds", "session list limited to owned students");
assertFailClosedGuard(files.sessions, sources.sessions, "isOwnedStudent(current.parent.id, student)", 403, "session list ownership guard");
assertFailClosedGuard(files.sessionStart, sources.sessionStart, "isOwnedStudent(current.parent.id, student)", 403, "start route ownership guard");
assertFailClosedGuard(files.sessionNext, sources.sessionNext, "isOwnedStudent(current.parent.id, student)", 403, "next route student ownership guard");
assertFailClosedGuard(files.sessionNext, sources.sessionNext, "isSessionForStudent(studentId, session)", 404, "next route session ownership guard");
assertFailClosedGuard(files.sessionRespond, sources.sessionRespond, "isOwnedStudent(current.parent.id, student)", 403, "response route student ownership guard");
assertFailClosedGuard(files.sessionRespond, sources.sessionRespond, "isSessionForStudent(studentId, session)", 403, "response route session ownership guard");
assertFailClosedGuard(files.sessionEnd, sources.sessionEnd, "isOwnedStudent(current.parent.id, student)", 403, "end route ownership guard");

assertIncludes(files.sessionStart, sources.sessionStart, "serializeQuestion", "start route response serializer");
const serializerMatch = sources.sessionStart.match(/function serializeQuestion[\s\S]*?\n}/);
if (!serializerMatch) {
  throw new Error(`${files.sessionStart}: missing serializeQuestion implementation`);
}
assertNotIncludes(files.sessionStart, serializerMatch[0], "correctAnswer", "correct answer in iOS start response serializer");

assertIncludes(files.tutor, sources.tutor, "markInitialSessionFailed", "initial-session cleanup helper");
assertIncludes(files.tutor, sources.tutor, "status: \"flagged\"", "flagged status cleanup");
assertIncludes(files.tutor, sources.tutor, "ended_at", "cleanup ended_at timestamp");
assertIncludes(files.tutor, sources.tutor, "ContentRejectedError", "strict filter rejection handling");

console.log("Phase 5 integration contract checks passed.");
console.log("Checked fail-closed session/next ownership guards, parent auth, iOS answer hiding, and rejected initial-question cleanup.");
