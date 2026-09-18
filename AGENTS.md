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

- Schema: `prisma/schema.prisma`. Client generated to `src/generated/prisma` (gitignored, regenerated on `postinstall`).
- 69 models. See schema for full list.
- Connection uses `@prisma/adapter-pg` (PrismaPg adapter). Client in `src/lib/db.ts` is lazy — proxy defers connection until first query, so `next build` works without a database.
- Database URL is in `prisma.config.ts` (reads `DATABASE_URL` from `.env.local`). Env schema marks it optional, but `db.ts` throws if missing at runtime.
- `npm run db:migrate` applies migrations in dev. `npm run db:deploy` applies in prod. `npm run db:seed` populates test data.

## Env validation

Environment variables are validated at startup via Zod in `src/lib/env.ts`. Invalid values throw immediately.

All keys are marked `.optional()` in the schema, but `DATABASE_URL` is required at runtime (`src/lib/db.ts:22` throws if missing). The site runs without Anthropic/WhatsApp/Twilio keys — only the AI agent and messaging channels are disabled.

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
| Staff auth | `lib/staff-session.ts` | Staff session management |
| Guest app | `lib/guest-app.ts` | Guest dashboard logic |
| Menu | `lib/menu-manager.ts` | Menu CRUD |
| Inventory | `lib/inventory.ts` | Stock management |
| Social | `lib/social.ts` | Referrals, waitlist, events |
| AI Analytics | `lib/ai-analytics.ts` | Predictions, insights |
| A/B Testing | `lib/ab-testing.ts` | Experiments framework |
| Notifications | `lib/notifications.ts` | In-app notifications |
| Security | `lib/security.ts` | 2FA, audit logs, API keys |
| Webhooks | `lib/webhooks.ts` | Webhook delivery + signing |
| White-label | `lib/white-label.ts` | Branding, integrations |
| Performance | `lib/performance.ts` | Cache, throttle, debounce |
| SEO | `lib/seo.ts` | Meta, schemas, keywords |
| i18n | `lib/i18n-manager.ts` | Locale utilities |
| Monitoring | `lib/monitoring.ts` | Health checks, metrics |
| Payments | `lib/payments/` | Stripe preauth, split |
| Forecast | `lib/forecast.ts` | Predictive analytics |
| Analytics | `lib/analytics.ts` | Basic statistics |
| Notifier | `lib/notifier.ts` | Push notifications |
| Discovery | `lib/discovery.ts` | Marketplace search engine |
| POS | `lib/pos/` | Toast, Square integration |
| Email | `lib/integrations/email.ts` | Resend email |
| Maps | `lib/integrations/google-maps.ts` | Geocoding, nearby |
| CRM | `lib/crm/` | Guest360, tags, campaigns |
| Staff | `lib/staff/` | Scheduling, availability, timeclock, performance |
| Onboarding | `lib/onboarding/` | Wizard, menu templates |
| Cache | `lib/cache.ts` | Redis caching (Upstash REST) |
| Health | `lib/health.ts` | Health checks, metrics |
| Jobs | `lib/jobs.ts` | Background job queue |
| Push | `lib/notifications/push.ts` | Push subscriptions |
| Wallet | `lib/wallet/` | Apple Wallet passes |
| AI Brain | `lib/ai/` | AI routing, audit, cost tracking, fallback |
| Predict | `lib/predict/` | Demand forecasting, scheduling, waste, menu engineering, no-show |
| Personalization | `lib/personalization/` | Guest AI profiles, recommendations, personalized menus, loyalty |
| Enterprise | `lib/enterprise/` | Multi-property dashboard, cross-property CRM, central menu |
| Sustainability | `lib/sustainability/` | Carbon tracking, allergen AI, food safety, compliance |
| Real-Time | `lib/realtime/` | Floor heatmap, live revenue, kitchen metrics, dynamic pricing, wait time |
| Innovation | `lib/innovation/` | Gamification, social proof, sentiment, AI sommelier, maintenance |

## Routes overview

**150+ API routes:**
- Public: `/api/v1/restaurants/*` (6 endpoints)
- Booking: `/api/reservations`, `/api/availability`
- Orders: `/api/orders`, `/api/menu`
- SaaS: `/api/saas/{onboard,setup,plan,portal,staff,webhooks}`
- Voice: `/api/voice/{incoming,gather,outbound}`
- Kitchen: `/api/kitchen/orders/*`
- Widget: `/api/widget/{config,availability,reserve}`
- Guest: `/api/guest/{profile,reservations,reviews}`
- Discovery: `/api/discovery/{search,featured,restaurants}`
- CRM: `/api/crm/{guests,tags,campaigns}`
- Payments: `/api/payments/{config,preauth,split}`
- Staff: `/api/staff/{schedule,timeclock,performance}`
- Onboarding: `/api/onboarding/complete`
- Push: `/api/notifications/push`
- Wallet: `/api/wallet/pass`
- Admin: `/api/admin/{export,orders,2fa,apikeys,jobs}`
- AI: `/api/admin/ai/{config,audit}`
- Predict: `/api/admin/predict/{waste,forecast}`
- Voice Commerce: `/api/admin/voice/{calls,orders}`
- Personalization: `/api/admin/personalization/{profile,recommendations}`
- Enterprise: `/api/admin/enterprise/groups`
- Sustainability: `/api/admin/sustainability/{carbon,compliance}`
- Real-Time: `/api/admin/realtime/metrics`
- Innovation: `/api/admin/innovation/social-proof`
- Analytics: `/api/analytics/realtime`
- Health: `/api/health`
- Webhooks: `/api/webhooks/{whatsapp,twilio}`
- Notifications: `/api/notifications/*`

**Key pages:**
- `/{locale}/admin` — 45+ admin pages (analytics, menu, inventory, floor, orders, chat, reviews, voice, security, integrations, POS, notifications, widget, translations, CRM, payments, AI, predict, personalization, enterprise, sustainability, realtime, innovation)
- `/{locale}/staff` — Mobile staff app (reservations, orders, QR scanner)
- `/{locale}/kitchen` — Kitchen Display System
- `/{locale}/owner` — Owner dashboard (settings, team, billing, schedule, onboarding)
- `/{locale}/guest` — Guest app (reservations, loyalty, profile)
- `/{locale}/discover` — Marketplace
- `/{locale}/events` — Events
- `/{locale}/pricing` — Pricing plans
- `/{locale}/compare` — Comparison page
- `/{locale}/changelog` — Changelog
- `/widget/{slug}` — Embeddable booking widget

## Testing

- 29 tests in 3 files: `time.test.ts`, `hours.test.ts`, `phone.test.ts`
- 29 E2E scenarios: `e2e/*.spec.ts`
- Run: `npm test` (unit), `npm run test:watch` (unit watch), `npm run test:e2e` (E2E), `npm run test:all` (both)

## Docker / Kubernetes

- `Dockerfile` — 3-stage build (deps, builder, runner)
- `docker-compose.yml` — Local dev (Postgres 17, Redis 7)
- `k8s/` — Full Kubernetes manifests (deployment, service, ingress, HPA, PDB)
- `scripts/backup.sh` — Database backup with S3 upload
- `scripts/restore.sh` — Database restore

## Gotchas

- **CSP nonce**: Every page renders dynamically (nonce changes per request).
- **Prisma generated client**: Do not edit `src/generated/`. Gitignored, regenerated on install.
- **Upstash Redis**: Caching uses REST API, not @upstash/redis package.
- **`npm run forget -- +216…`**: GDPR data erasure script.
- **Next.js 16**: App Router with Turbopack. `proxy.ts` replaces `middleware.ts`.
- **Widget**: Runs in iframes — uses `<img>` not `next/image` intentionally.
- **Voice AI**: Requires `OPENAI_API_KEY` for Whisper STT (falls back gracefully).
- **Kitchen Display**: Auto-refreshes every 10s — optimize for tablet screens.
- **POS integration**: Prisma `Json` fields need type casting (`as unknown as Record<string, string>`).
- **Schema relations**: New models require explicit opposite relation fields on parent models.
