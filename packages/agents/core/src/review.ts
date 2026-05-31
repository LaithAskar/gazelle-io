// The agent review protocol, centralized so every agent uses the same flow:
//   1. log the output to agent_logs as 'pending'
//   2. run the content filter
//   3. resolve the log to 'approved' or 'rejected'
//   4. return the verdict — callers MUST NOT surface rejected output to a user
//
// Uses the service-role client (agent_logs has no client RLS policies).

import { logAgentOutputPending, resolveAgentLog, type GazelleClient } from "@gazelle/db";
import type { AgentName } from "@gazelle/shared";
import { filterContent, type FilterResult } from "./content-filter";

export interface ReviewInput {
  agent: AgentName;
  input: unknown;
  output: unknown;
  strict?: boolean;
  teacherId?: string | null;
  studentId?: string | null;
  sessionId?: string | null;
}

export interface ReviewVerdict {
  logId: string;
  approved: boolean;
  filter: FilterResult;
}

export async function reviewAndLog(
  db: GazelleClient,
  args: ReviewInput,
): Promise<ReviewVerdict> {
  const logId = await logAgentOutputPending(db, {
    agent: args.agent,
    input: (args.input ?? null) as never,
    output: (args.output ?? null) as never,
    teacher_id: args.teacherId ?? null,
    student_id: args.studentId ?? null,
    session_id: args.sessionId ?? null,
  });

  // Filter against a string view of the output.
  const text = typeof args.output === "string" ? args.output : JSON.stringify(args.output);
  const filter = filterContent(text, { strict: args.strict });

  await resolveAgentLog(db, logId, filter.ok ? "approved" : "rejected", filter as never);

  return { logId, approved: filter.ok, filter };
}

/** Thrown when agent output fails the content filter. */
export class ContentRejectedError extends Error {
  constructor(public flags: string[]) {
    super(`Agent output rejected by content filter: ${flags.join(", ")}`);
    this.name = "ContentRejectedError";
  }
}
