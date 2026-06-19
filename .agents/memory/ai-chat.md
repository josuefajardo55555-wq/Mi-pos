---
name: AI Chat integration
description: How the /api/chat SSE endpoint is built and what to avoid
---

## Rule
Do NOT import `zod` or `zod/v4` directly in `artifacts/api-server/src/` route files.

**Why:** esbuild (used to bundle the api-server) cannot resolve the `zod/v4` subpath export at bundle time, even when `zod` is in `dependencies`. The build fails with "Could not resolve zod/v4".

**How to apply:** Use manual TypeScript type assertions (`as any`, `body?.field`) for validation in api-server routes. If schema validation is needed, import from `@workspace/api-zod` (pre-built lib) instead.

## Architecture
- Route: `artifacts/api-server/src/routes/chat/index.ts` — POST /api/chat
- Response: SSE stream (`text/event-stream`), sends `data: {"content":"..."}` chunks, ends with `data: {"done":true}`
- Client: `artifacts/mi-pos/src/App.tsx` — `AIChat` component uses `fetch` + `ReadableStream`, NOT EventSource (can't POST)
- Context: Client sends `businessContext` (products, sales, bizName, userRole) with every request — no DB persistence needed
- Model: `claude-sonnet-4-6` via `@workspace/integrations-anthropic-ai`
- Access control: `canUseAI` = isOwner OR any collaborator permission set
