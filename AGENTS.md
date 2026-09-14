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
- 25+ models: Restaurant, Guest, Reservation, Order, MenuItem, Staff, Subscription, Payment, Review, Conversation, Message, PushSubscription, LoyaltyAccount, LoyaltyTransaction, PhoneVerification, ProcessedEvent, StaffSession, SetupToken, WebhookEndpoint, Notification, MenuCategory, Inventory, InventoryLog, Referral, Waitlist, Event, EventBooking, Gallery, GuestProfile, AuditLog, ApiKey, WebhookDelivery
- `npm install` triggers `prisma generate` via `postinstall`.
- Database URL is in `prisma.config.ts` (reads `DATABASE_URL` from `.env.local`).
- `npm run db:migrate` applies migrations in dev. `npm run db:deploy` applies in prod.

## Env validation

Environment variables are validated at startup via Zod in `src/lib/env.ts`. Missing or invalid values throw immediately.

Required: `DATABASE_URL`
Optional: Anthropic, WhatsApp, Twilio, Stripe, Sentry, Google Calendar, Google Business, TripAdvisor, VAPID keys

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
| Payments | `lib/payments.ts` | Stripe integration |
| Forecast | `lib/forecast.ts` | Predictive analytics |
| Analytics | `lib/analytics.ts` | Basic statistics |
| Notifier | `lib/notifier.ts` | Push notifications |

## Routes overview

**100+ API routes:**
- Public: `/api/v1/restaurants/*` (6 endpoints)
- Booking: `/api/reservations`, `/api/availability`
- Orders: `/api/orders`, `/api/menu`
- SaaS: `/api/saas/{onboard,setup,plan,portal,staff,webhooks}`
- Voice: `/api/voice/{incoming,gather,outbound}`
- Kitchen: `/api/kitchen/orders/*`
- Widget: `/api/widget/{config,availability,reserve}`
- Guest: `/api/guest/{profile,reservations,reviews}`
- Admin: `/api/admin/{export,orders,2fa,apikeys}`
- Analytics: `/api/analytics/realtime`
- Health: `/api/health`
- Webhooks: `/api/webhooks/{whatsapp,twilio}`
- Notifications: `/api/notifications/*`

**Key pages:**
- `/{locale}/admin` — 30+ admin pages (analytics, menu, inventory, floor, orders, chat, reviews, voice, security, integrations, notifications, widget, translations)
- `/{locale}/staff` — Mobile staff app (reservations, orders, QR scanner)
- `/{locale}/kitchen` — Kitchen Display System
- `/{locale}/owner` — Owner dashboard (settings, team, billing)
- `/{locale}/guest` — Guest app (reservations, loyalty, profile)
- `/{locale}/discover` — Marketplace
- `/{locale}/events` — Events
- `/widget/{slug}` — Embeddable booking widget

## Testing

- 29 tests in 3 files: `time.test.ts`, `hours.test.ts`, `phone.test.ts`
- 29 E2E scenarios: `e2e/*.spec.ts`
- Run: `npm test` (unit), `npm run test:e2e` (E2E), `npm run test:all` (both)

## Docker / Kubernetes

- `Dockerfile` — 3-stage build (deps, builder, runner)
- `docker-compose.yml` — Local dev (Postgres 17, Redis 7)
- `k8s/` — Full Kubernetes manifests (deployment, service, ingress, HPA, PDB)
- `scripts/backup.sh` — Database backup with S3 upload
- `scripts/restore.sh` — Database restore

## Gotchas

- **CSP nonce**: Every page renders dynamically (nonce changes per request).
- **Prisma generated client**: Do not edit `src/generated/`. Gitignored, regenerated on install.
- **Upstash Redis**: Rate limiting shared only if `UPSTASH_REDIS_REST_URL` is set.
- **`npm run forget -- +216…`**: GDPR data erasure script.
- **Next.js 16**: App Router with Turbopack. `proxy.ts` replaces `middleware.ts`.
- **Widget**: Runs in iframes — uses `<img>` not `next/image` intentionally.
- **Voice AI**: Requires `OPENAI_API_KEY` for Whisper STT (falls back gracefully).
- **Kitchen Display**: Auto-refreshes every 10s — optimize for tablet screens.
