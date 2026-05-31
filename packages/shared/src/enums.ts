// Literal unions mirroring the DB CHECK constraints (001_initial_schema.sql).
// Keep these in sync with the schema — they are the app-facing source of truth
// for the small fixed value sets the database enforces.

export const USER_ROLES = ["parent", "teacher"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PACES = ["slow", "medium", "fast"] as const;
export type Pace = (typeof PACES)[number];

export const LESSON_PLAN_STATUSES = ["draft", "approved", "active"] as const;
export type LessonPlanStatus = (typeof LESSON_PLAN_STATUSES)[number];

export const SESSION_STATUSES = ["in_progress", "completed", "flagged"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const AGENT_NAMES = ["tutor", "planner", "curriculum"] as const;
export type AgentName = (typeof AGENT_NAMES)[number];

export const AGENT_STATUSES = ["pending", "approved", "rejected"] as const;
export type AgentStatus = (typeof AGENT_STATUSES)[number];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

// Grade range: 0 = Kindergarten through 6 (Full K-6).
export const MIN_GRADE = 0;
export const MAX_GRADE = 6;
export type Grade = 0 | 1 | 2 | 3 | 4 | 5 | 6;
