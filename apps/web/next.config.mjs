/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace TS packages consumed as source — transpile them.
  transpilePackages: [
    "@gazelle/shared",
    "@gazelle/db",
    "@gazelle/agent-planner",
    "@gazelle/agent-curriculum",
    "@gazelle/agent-core",
    "@gazelle/rag",
  ],
  experimental: {
    // Keep heavy agent/LLM deps out of the bundle; run them in Node on the server.
    serverComponentsExternalPackages: ["@mastra/core", "@ai-sdk/anthropic"],
  },
  // Defense-in-depth HTTP security headers applied to every response.
  async headers() {
    const csp = [
      "default-src 'self'",
      // Next 14 App Router injects inline hydration scripts; 'unsafe-inline' is
      // required until we move to nonce-based CSP (post-MVP hardening).
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      // Supabase auth/REST/realtime endpoints.
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
