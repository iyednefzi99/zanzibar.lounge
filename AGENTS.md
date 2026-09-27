<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Verification order

CI runs these in strict order (`.github/workflows/ci.yml`). Run them locally in the same sequence before committing:

```bash
npx prisma generate   # CI does this first; client must exist for lint/typecheck
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev --audit-level=high  # CI runs this after build
```

## Prisma 7 specifics

- Schema: `prisma/schema.prisma`. Client generated to `src/generated/prisma` (gitignored, regenerated on `postinstall`).
- Connection uses `@prisma/adapter-pg` (PrismaPg adapter). Client in `src/lib/db.ts` is lazy — proxy defers connection until first query, so `next build` works without a database.
- Database URL is in `prisma.config.ts` (reads `DATABASE_URL` from `.env.local`). `db.ts:22` throws if missing at runtime.
- `npm run db:migrate` applies migrations in dev. `npm run db:deploy` applies in prod. `npm run db:seed` populates test data.

## Env validation

Environment variables are validated at startup via Zod in `src/lib/env.ts`. Invalid values throw immediately.

All keys are marked `.optional()` in the schema, but `DATABASE_URL` is required at runtime. The site runs without Anthropic/WhatsApp/Twilio keys — only the AI agent and messaging channels are disabled.

## Architecture shortcuts

- **Single reservation logic**: `src/lib/reservations.ts` is the only path for both the web form and the conversational agent. Never add a second codepath.
- **Agent tools**: `src/lib/agent/tools.ts` — 11 tools (check_availability, create_booking, list_my_bookings, reschedule_booking, cancel_booking, confirm_booking, hand_off_to_staff, get_menu_info, get_reviews, get_restaurant_info, suggest_alternatives).
- **Agent loop**: Hand-rolled in `src/lib/agent/index.ts` (not the SDK's tool runner) to enforce ownership checks.
- **Voice agent**: `src/lib/voice/voice-agent.ts` — per-call conversation state, integrates with existing tools.
- **Proxy**: `src/proxy.ts` handles locale routing, admin/staff/owner auth, CSP nonce, security headers. Edge runtime.
- **Admin auth**: Double-checked (proxy + `lib/admin-auth.ts` in every action/page).
- **Staff auth**: Cookie-based HMAC-signed sessions (`lib/staff-session.ts`).
- **Guest auth**: Phone-based HMAC-signed sessions (`lib/guest-session.ts`).
- **Time model**: No date library. `Intl` in `src/lib/time.ts`. Minutes since midnight convention.
- **Locale**: French is the base locale. 10 locales: fr, ar, en, de, es, it, pt, ru, zh, ja.

## Key modules

| Module | Path | Purpose |
|---|---|---|
| Reservations | `lib/reservations.ts` | Core booking logic |
| Orders | `lib/orders.ts` | Online orders |
| Agent | `lib/agent/` | AI conversation (11 tools) |
| Voice | `lib/voice/` | Voice AI (Twilio, STT, TTS) |
| SaaS | `lib/saas.ts` | Multi-tenancy, billing |
| Menu | `lib/menu-manager.ts` | Menu CRUD |
| CRM | `lib/crm/` | Guest360, tags, campaigns |
| Payments | `lib/payments/` | Stripe preauth, split |
| POS | `lib/pos/` | Toast, Square integration |
| Staff | `lib/staff/` | Scheduling, timeclock |
| AI Brain | `lib/ai/` | AI routing, audit, cost tracking |
| Predict | `lib/predict/` | Demand forecasting, waste, no-show |

## Routes overview

- Public: `/api/v1/restaurants/*` — Booking: `/api/reservations`, `/api/availability`
- Orders: `/api/orders`, `/api/menu` — SaaS: `/api/saas/{onboard,setup,plan,portal,staff,webhooks}`
- Voice: `/api/voice/{incoming,gather,outbound}` — Kitchen: `/api/kitchen/orders/*`
- Widget: `/api/widget/{config,availability,reserve}` — Guest: `/api/guest/{profile,reservations,reviews}`
- CRM: `/api/crm/{guests,tags,campaigns}` — Payments: `/api/payments/{config,preauth,split}`
- Staff: `/api/staff/{schedule,timeclock,performance}` — Admin: `/api/admin/{export,orders,2fa,apikeys,jobs}`
- Health: `/api/health` — Webhooks: `/api/webhooks/{whatsapp,twilio}`

**Key pages:** `/{locale}/admin` (45+ pages), `/{locale}/staff`, `/{locale}/kitchen`, `/{locale}/owner`, `/{locale}/guest`, `/{locale}/discover`, `/widget/{slug}` (iframe).

## Testing

- 4 unit test files: `time.test.ts`, `hours.test.ts`, `phone.test.ts`, `waitlist.test.ts`
- 5 E2E specs: `e2e/*.spec.ts` (admin, booking, homepage, menu, user-flows)
- Unit: `npm test` / `npm run test:watch` — E2E: `npm run test:e2e` — Both: `npm run test:all`

## Gotchas

- **CSP nonce**: Every page renders dynamically (nonce changes per request).
- **Prisma generated client**: Do not edit `src/generated/`. Gitignored, regenerated on install.
- **Upstash Redis**: Caching uses REST API, not `@upstash/redis` package.
- **`npm run forget -- +216…`**: GDPR data erasure script.
- **Next.js 16**: App Router with Turbopack. `proxy.ts` replaces `middleware.ts`.
- **Widget**: Runs in iframes — uses `<img>` not `next/image` intentionally.
- **Voice AI**: Requires `OPENAI_API_KEY` for Whisper STT (falls back gracefully).
- **POS integration**: Prisma `Json` fields need type casting (`as unknown as Record<string, string>`).
- **Schema relations**: New models require explicit opposite relation fields on parent models.
