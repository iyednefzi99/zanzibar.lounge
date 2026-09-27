# E-Coffee Node

Plateforme SaaS de gestion de restaurant — réservations en ligne, commande, agent IA, multi-établissement.

[![CI](https://github.com/iyednefzi99/zanzibar.lounge/actions/workflows/ci.yml/badge.svg)](https://github.com/iyednefzi99/zanzibar.lounge/actions/workflows/ci.yml)
[![Licence](https://img.shields.io/badge/licence-MIT-blue.svg)](LICENSE)

---

## Fonctionnalités

- **Réservations & commandes** — formulaire multi-étapes, disponibilités en temps réel, file d'attente, anti no-show (OTP, pré-autorisation Stripe, frais d'annulation)
- **Agent IA conversationnel** — 11 outils (disponibilité, création/modification/cancellation de réservation, menu, avis…), sur WhatsApp, SMS et web ; agent vocal Twilio (STT/TTS)
- **SaaS multi-établissement** — onboarding, 3 plans (Starter 29 € / Pro 79 € / Enterprise 199 €), Stripe Billing, dashboard propriétaire, white-label
- **Back-office** — 25 pages admin : menu (drag-and-drop), inventaire, plan de salle SVG, commandes, CRM (Guest360, tags, campagnes email), analytics (revenus, heatmap 7×24, A/B testing, prévisions), sécurité (2FA TOTP, audit logs, API keys)
- **Kitchen Display System** — plein écran, auto-refresh, beep audio
- **Staff** — planning, timeclock, performances ; app mobile (scanner QR, hors-ligne PWA)
- **Intégrations** — Stripe, Flouci, D17, Toast POS, Square, Twilio, WhatsApp Cloud API, Resend, Google Maps/Calendar/Business, TripAdvisor, Sentry, Upstash Redis
- **Multilingue** — 10 langues (fr, ar, en, de, es, it, pt, ru, zh, ja), RTL pour l'arabe
- **Widget embeddable** — iframe + API publique pour les sites tiers
- **Sécurité & ops** — 2FA TOTP, audit logs, rate limiting, API keys, Sentry, CI GitHub Actions, Docker/Kubernetes

---

## Prérequis

- **Node.js** ≥ 20 (développé et testé sous 24)
- **npm** ≥ 10
- **PostgreSQL** ≥ 14 (ou Docker)

Seule `DATABASE_URL` est obligatoire pour démarrer : sans clés Anthropic/WhatsApp/Twilio, l'agent IA et les canaux de messagerie sont simplement désactivés (`src/lib/env.ts`).

---

## Pile technique

| Technologie | Rôle |
|---|---|
| **Next.js 16** (App Router, Turbopack) | Rendu, routes API, proxy Edge |
| **React 19** | Interface |
| **TypeScript 5** (strict) | Typage de bout en bout |
| **Tailwind CSS 4** | Styles (palette night/shell/brass/coral/lagoon) |
| **Prisma 7** + **PostgreSQL** | Données (adaptateur `@prisma/adapter-pg`, client dans `src/generated/`) |
| **Anthropic SDK** (`claude-opus-5`) | Agent conversationnel + vocal |
| **Twilio** | Voice + SMS |
| **WhatsApp Cloud API** | Canal WhatsApp |
| **Stripe** | Paiements + Billing |
| **Vitest** + **Playwright** | Tests unitaires (38) + E2E (29) |

---

## Installation

```bash
git clone https://github.com/iyednefzi99/zanzibar.lounge.git
cd zanzibar.lounge
npm install                 # génère aussi le client Prisma (postinstall)
cp .env.example .env.local  # renseigner DATABASE_URL
npm run db:migrate
npm run db:seed             # données d'exemple (optionnel)
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) (redirige vers `/fr`).

### Docker (alternative)

```bash
docker compose up -d    # PostgreSQL 17 + Redis 7 + App
npm run db:migrate
npm run dev
```

### Kubernetes

```bash
kubectl apply -f k8s/
```

---

## Configuration

Copier `.env.example` en `.env.local` (jamais versionné). Variables principales — la liste complète et commentaires sont dans `.env.example` :

| Variable | Rôle | Requis |
|---|---|---|
| `DATABASE_URL` | Connexion PostgreSQL (pooler) | **Oui** |
| `DIRECT_DATABASE_URL` | Connexion directe pour les migrations Prisma | Recommandé |
| `NEXT_PUBLIC_SITE_URL` | URL publique (signature webhooks Twilio) | Prod |
| `ADMIN_USER` / `ADMIN_PASSWORD` | Auth HTTP Basic du back-office `/{locale}/admin` | Prod |
| `CRON_SECRET` | Protège `/api/cron/*` | Prod |
| `ANTHROPIC_API_KEY` | Agent IA conversationnel + vocal | Optionnel |
| `WHATSAPP_*` | Canal WhatsApp Cloud API | Optionnel |
| `TWILIO_*` | SMS et Voice | Optionnel |
| `STRIPE_*` | Paiements et abonnements | Optionnel |
| `UPSTASH_REDIS_REST_*` | Rate limiting partagé, cache | Optionnel |
| `SENTRY_*` / `NEXT_PUBLIC_SENTRY_DSN` | Error tracking | Optionnel |
| `VAPID_*` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Push notifications | Optionnel |

Validation Zod au démarrage : une valeur invalide lève une erreur immédiate
(`src/lib/env.ts`). `productionGaps()` liste les manques bloquants en prod.

---

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement (Turbopack) |
| `npm run build` | Compilation de production |
| `npm start` | Sert la compilation |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Tests unitaires (Vitest) |
| `npm run test:watch` | Tests en mode watch |
| `npm run test:e2e` | Tests E2E (Playwright) |
| `npm run test:all` | Unitaires + E2E |
| `npm run db:migrate` | Migration (dev) |
| `npm run db:deploy` | Migration (prod) |
| `npm run db:seed` | Données d'exemple |
| `npm run db:studio` | Prisma Studio |
| `npm run forget -- +216…` | Effacement RGPD d'un client (`scripts/forget-guest.mjs`) |

---

## Architecture

```
src/
├── app/
│   ├── api/                 # 107 routes (route.ts)
│   │   ├── v1/              # API publique REST
│   │   ├── reservations/    # Réservations, availability
│   │   ├── orders/          # Commandes en ligne
│   │   ├── saas/            # Onboarding, plans, portail
│   │   ├── voice/           # Voice AI (Twilio)
│   │   ├── kitchen/         # Kitchen Display
│   │   ├── widget/          # Widget embeddable
│   │   ├── guest/           # Espace client
│   │   ├── crm/             # Guests, tags, campagnes
│   │   ├── payments/        # Config, preauth, split
│   │   ├── staff/           # Planning, timeclock
│   │   ├── admin/           # Export, 2FA, API keys, jobs
│   │   ├── webhooks/        # WhatsApp, Twilio
│   │   └── health/          # /api/health
│   ├── [locale]/            # 55 pages (10 langues)
│   │   ├── admin/           # Back-office (25 pages)
│   │   ├── staff/           # App mobile staff
│   │   ├── kitchen/         # KDS
│   │   ├── owner/           # Dashboard propriétaire
│   │   ├── guest/           # Espace client
│   │   ├── discover/        # Marketplace
│   │   └── r/[slug]/        # Profil restaurant
│   └── widget/              # Widget iframe
├── components/              # UI (booking, menu, hero, layout…)
├── hooks/
├── lib/
│   ├── agent/               # Agent IA (11 outils, boucle maison)
│   ├── voice/               # Voice AI (Twilio, STT, TTS)
│   ├── ai/                  # Routing provider, audit, coûts
│   ├── predict/             # Prévisions demande, no-show, waste
│   ├── crm/                 # Guest360, tags, campagnes
│   ├── payments/            # Stripe preauth, bill splitting
│   ├── pos/                 # Toast, Square
│   ├── staff/               # Planning, timeclock
│   ├── reservations.ts      # LOGIQUE UNIQUE de réservation
│   ├── orders.ts            # Commandes
│   ├── saas.ts              # Multi-tenancy, billing
│   ├── env.ts               # Validation Zod des variables
│   └── time.ts              # Fuseaux via Intl (pas de date lib)
├── i18n/                    # config + dictionnaires (10 langues)
└── proxy.ts                 # Edge : routing locale, admin auth, CSP nonce

prisma/
├── schema.prisma            # 75 modèles
├── migrations/
└── seed.mjs

e2e/                         # Specs Playwright
k8s/                         # Manifests Kubernetes
docs/                        # OpenAPI, docs produit
```

Points clés :

- **Réservation unique** : `src/lib/reservations.ts` est le seul codepath (formulaire web **et** agent IA).
- **Auth à trois niveaux** : admin (Basic, proxy + double vérification), staff (cookies HMAC), guest (téléphone HMAC).
- **Proxy Next 16** : `src/proxy.ts` remplace `middleware.ts` (Edge) — locale, admin, CSP nonce.
- **Pas de date library** : `Intl` dans `src/lib/time.ts`, convention « minutes depuis minuit ».

---

## Tests

```bash
npm test            # 38 tests unitaires (Vitest)
npm run test:e2e    # 29 scénarios E2E (Playwright)
```

| Fichier | Couverture |
|---|---|
| `src/lib/time.test.ts` | Fuseaux, minutes, dates, calendrier |
| `src/lib/hours.test.ts` | Horaires, créneaux, préavis, après-minuit |
| `src/lib/phone.test.ts` | Normalisation E.164, affichage |
| `src/lib/waitlist.test.ts` | File d'attente (join, notify, cleanup) |
| `e2e/homepage.spec.ts` | Redirect, meta, OG, JSON-LD |
| `e2e/booking.spec.ts` | Formulaire, titre, créneaux API |
| `e2e/menu.spec.ts` | Carte, i18n (ar/en), API menu |
| `e2e/admin.spec.ts` | Auth back-office (6 routes) |
| `e2e/user-flows.spec.ts` | Navigation, i18n, RTL, avis |

Vérification avant de valider (ordre de la CI) :

```bash
npx prisma generate
npm run lint
npm run typecheck
npm test
npm run build
```

---

## API

- **OpenAPI 3.1** : [`docs/openapi.yaml`](docs/openapi.yaml)
- **API publique** : `/api/v1/restaurants/*`
- **Widget** : `/{locale}/admin/widget` → iframe `/widget/{slug}`

Groupes principaux (107 routes `route.ts` au total) :

| Domaine | Routes |
|---|---|
| Réservations | `/api/reservations`, `/api/availability` |
| Commandes | `/api/orders`, `/api/menu` |
| SaaS | `/api/saas/{onboard,setup,plan,portal,staff,webhooks}` |
| Voice | `/api/voice/{incoming,gather,outbound}` |
| Kitchen | `/api/kitchen/orders/*` |
| Widget | `/api/widget/{config,availability,reserve}` |
| Guest | `/api/guest/{profile,reservations,reviews}` |
| CRM | `/api/crm/{guests,tags,campaigns}` |
| Payments | `/api/payments/{config,preauth,split}` |
| Staff | `/api/staff/{schedule,timeclock,performance}` |
| Admin | `/api/admin/{export,orders,2fa,apikeys,jobs}` |
| Health | `GET /api/health` — DB, mémoire, uptime |
| Webhooks | `/api/webhooks/{whatsapp,twilio}` |

---

## Déploiement

- **Vercel** — build `npm run build`, migrations via `npm run db:deploy`
- **Docker** — `Dockerfile` multi-stage (non-root), `docker compose up -d`
- **Kubernetes** — manifests dans [`k8s/`](k8s/) (deployment, service, ingress, HPA, PDB)
- **Santé** — `GET /api/health` (DB, mémoire, uptime)

---

## Contribuer

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour le workflow, les conventions de commit et la structure détaillée.

---

## Licence

MIT — Voir [LICENSE](LICENSE)

---

## Auteur

**Iyed Nefzi** — [iyednefzi99](https://github.com/iyednefzi99)
