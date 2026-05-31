// Domain model aliases derived from the generated Database types.
// These stay exact-by-construction: they read straight from database.types.ts,
// which is generated from the live schema. Do not hand-edit field shapes here.

import type { Database } from "./database.types";

type Tables = Database["public"]["Tables"];

/** A full row as returned by a SELECT. */
export type Row<T extends keyof Tables> = Tables[T]["Row"];
/** The shape accepted by an INSERT (optional defaults omitted). */
export type Insert<T extends keyof Tables> = Tables[T]["Insert"];
/** The shape accepted by an UPDATE (all fields optional). */
export type Update<T extends keyof Tables> = Tables[T]["Update"];

export type User = Row<"users">;
export type TeacherProfile = Row<"teacher_profiles">;
export type ParentProfile = Row<"parent_profiles">;
export type StudentProfile = Row<"student_profiles">;
export type CurriculumStandard = Row<"curriculum_standards">;
export type CurriculumKnowledge = Row<"curriculum_knowledge">;
export type LessonPlan = Row<"lesson_plans">;
export type Question = Row<"questions">;
export type Session = Row<"sessions">;
export type SessionResponse = Row<"session_responses">;
export type AgentLog = Row<"agent_logs">;
export type InsightReport = Row<"insight_reports">;
