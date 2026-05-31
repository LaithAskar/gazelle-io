// Shared model binding for all agents. Anthropic via the Vercel AI SDK provider
// (Mastra's model layer). Reads ANTHROPIC_API_KEY from the environment.
//
// NOTE: spec said `claude-sonnet-4`; the current model id is `claude-sonnet-4-6`.

import { anthropic } from "@ai-sdk/anthropic";

export const AGENT_MODEL_ID = "claude-sonnet-4-6";

export function agentModel(): ReturnType<typeof anthropic> {
  return anthropic(AGENT_MODEL_ID);
}
