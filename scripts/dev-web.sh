#!/usr/bin/env bash
# Dev launcher for the web app: loads root .env.local (overriding the sandbox's
# empty ANTHROPIC_API_KEY) before starting Next.
cd "$(dirname "$0")/.."
set -a
. ./.env.local
set +a
exec pnpm -F @gazelle/web dev
