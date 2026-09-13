<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Verification order

CI runs these in strict order. Run them locally in the same sequence before committing:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Prisma 7 specifics

- Schema is at `prisma/schema.prisma`. Client is generated to `src/generated/prisma` (gitignored).
- `npm install` triggers `prisma generate` via `postinstall`. If you see "cannot find module @prisma/client", run `npm install` again.
- Database URL is **not** in the schema file — it lives in `prisma.config.ts` (reads `DATABASE_URL` from `.env.local`).
- `npm run db:migrate` applies migrations in dev. `npm run db:deploy` applies in prod. `npm run db:seed` inserts the example floor plan.

## Env validation

Environment variables are validated at startup via Zod in `src/lib/env.ts`. Missing or invalid values throw immediately with a clear error listing every broken field. This is the source of truth for which env vars exist and their constraints.

The app works with only `DATABASE_URL` — all messaging keys are optional. Unconfigured channels degrade gracefully (the back-office shows gaps).

## Architecture shortcuts

- **Single reservation logic**: `src/lib/reservations.ts` is the only path for both the web form and the conversational agent. Never add a second codepath.
- **Agent tools**: `src/lib/agent/tools.ts` defines tools, but every tool calls through `reservations.ts`. The agent loop is hand-rolled in `src/lib/agent/index.ts` (not the SDK's tool runner) to enforce ownership checks.
- **Proxy**: `src/proxy.ts` handles locale routing, admin Basic auth, CSP nonce, and security headers. Runs on the Edge — no Prisma/Node access here.
- **Admin auth is double-checked**: The proxy is the first barrier; every server action and admin page re-verifies via `src/lib/admin-auth.ts`. Next action IDs are build-global, so a POST to a public page with `Next-Action` header would bypass the proxy without this.
- **Time model**: No date library. Timezone conversions use `Intl` in `src/lib/time.ts`. "Minutes since midnight" (`1500` = 1 AM next day) groups late-night reservations with the correct service date.
- **Locale**: French is the base locale. Arabic and English must match its dictionary keys exactly (enforced at compile time via TypeScript).

## Testing

- 29 tests in 3 files under `src/lib/`: `time.test.ts`, `hours.test.ts`, `phone.test.ts`.
- Co-located `*.test.ts` pattern. Run a single file: `npx vitest run src/lib/time.test.ts`.
- No DB required — these are pure-logic tests. Integration tests for `reservations.ts` and agent tools are noted as future work (they'd need a test database).

## Gotchas

- **CSP nonce**: Every page renders dynamically (nonce changes per request). This is intentional and reversible — see the comment at the top of `src/app/[locale]/layout.tsx`.
- **Prisma generated client**: Do not edit `src/generated/`. It's gitignored and regenerated on install.
- **`allowImportingTsExtensions`**: tsconfig enables `.ts` imports explicitly because `prisma/seed.mjs` runs under Node directly.
- **Upstash Redis**: Rate limiting is shared only if `UPSTASH_REDIS_REST_URL` is set. Without it, counters are per-instance.
- **`npm run forget -- +216…`**: GDPR data erasure script. Only works if `DATABASE_URL` is configured.
- **Next.js 16**: This is the App Router with Turbopack. The `proxy.ts` file replaces the older `middleware.ts` convention.
