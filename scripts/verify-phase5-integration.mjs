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

const files = {
  parentProfile: "apps/web/app/api/parent/profile/route.ts",
  students: "apps/web/app/api/students/route.ts",
  studentById: "apps/web/app/api/students/[id]/route.ts",
  sessions: "apps/web/app/api/sessions/route.ts",
  sessionStart: "apps/web/app/api/sessions/start/route.ts",
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
assertIncludes(files.sessionStart, sources.sessionStart, "student.parent_id !== current.parent.id", "start route ownership check");
assertIncludes(files.sessionRespond, sources.sessionRespond, "session.student_id !== studentId", "response session/student match check");
assertIncludes(files.sessionEnd, sources.sessionEnd, "student.parent_id !== current.parent.id", "end route ownership check");

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
console.log("Checked parent/student/session API auth ownership, iOS answer hiding, and rejected initial-question cleanup.");
