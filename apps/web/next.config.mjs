/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace TS packages consumed as source — transpile them.
  transpilePackages: [
    "@gazelle/shared",
    "@gazelle/db",
    "@gazelle/agent-planner",
    "@gazelle/agent-curriculum",
    "@gazelle/agent-tutor",
    "@gazelle/agent-core",
    "@gazelle/rag",
  ],
  experimental: {
    // Keep heavy agent/LLM deps out of the bundle; run them in Node on the server.
    serverComponentsExternalPackages: ["@mastra/core", "@ai-sdk/anthropic"],
  },
};

export default nextConfig;
