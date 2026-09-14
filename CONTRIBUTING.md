# Contribuer à Zanzibar Lounge

Merci de votre intérêt pour contribuer à Zanzibar Lounge ! Ce guide explique
comment mettre en place votre environnement de développement et comment
soumettre vos contributions.

## Prérequis

- **Node.js** ≥ 20 (vérifier avec `node --version`)
- **PostgreSQL** ≥ 14 (ou un conteneur Docker)
- **npm** ≥ 10 (inclus avec Node 20+)
- (Optionnel) Compte **Stripe** (clés test) pour les fonctionnalités SaaS
- (Optionnel) Compte **Twilio** pour les SMS et Voice
- (Optionnel) Clé **Anthropic** pour l'agent IA
- (Optionnel) Clé **Google Calendar** pour l'intégration agenda
- (Optionnel) Clé **Resend** pour les emails transactionnels
- (Optionnel) Clé **Google Maps** pour la géocodage

## Mise en place du projet

```bash
# 1. Cloner le dépôt
git clone https://github.com/iyednefzi99/zanzibar.lounge.git
cd zanzibar.lounge

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local

# 4. Appliquer les migrations
npm run db:migrate

# 5. Peupler la base (optionnel)
npm run db:seed

# 6. Lancer le serveur
npm run dev
```

### Alternative Docker

```bash
docker compose up -d    # PostgreSQL + Redis + App
npm run db:migrate
npm run dev
```

### Variables minimales

Seule `DATABASE_URL` est obligatoire pour le développement local :

```
DATABASE_URL=postgresql://user:password@localhost:5432/zanzibar
```

## Workflow de développement

### Branches

- `master` — branche principale, toujours déployable
- `feat/*` — nouvelles fonctionnalités
- `fix/*` — corrections de bugs
- `chore/*` — maintenance, dépendances

### Conventions de commit

| Préfixe | Usage |
|---|---|
| `feat:` | Nouvelle fonctionnalité |
| `fix:` | Correction de bug |
| `docs:` | Documentation |
| `refactor:` | Refactorisation |
| `test:` | Tests |
| `chore:` | Dépendances, config |

## Style de code

### TypeScript
- **Mode strict** — aucun `any`
- Types explicites aux assertions
- Enums Prisma pour les statuts
- Imports avec préfixe `@/` (alias `src/`)

### ESLint
Règles strictes : `react-hooks/immutability`, `react-hooks/set-state-in-effect`.

### Formatage
Formatter par défaut de l'éditeur. La CI vérifie ESLint.

## Tests

```bash
npm test            # 29 tests unitaires (Vitest)
npm run test:e2e    # 29 scénarios E2E (Playwright)
npm run test:all    # Les deux
```

## Vérification avant PR

Exécuter dans cet ordre (identique à la CI) :

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Structure du projet

```
src/
├── app/
│   ├── api/
│   │   ├── v1/              # API publique REST
│   │   ├── saas/            # Routes SaaS
│   │   ├── voice/           # Voice AI
│   │   ├── kitchen/         # Kitchen Display
│   │   ├── widget/          # Widget embeddable
│   │   ├── guest/           # App client
│   │   ├── crm/             # CRM & Marketing
│   │   ├── payments/        # Paiements
│   │   ├── staff/           # Staff scheduling
│   │   ├── onboarding/      # Onboarding
│   │   ├── notifications/   # Notifications (push, in-app)
│   │   ├── wallet/          # Apple Wallet
│   │   ├── discovery/       # Marketplace
│   │   ├── admin/           # Admin (2FA, API keys, jobs)
│   │   └── health/          # Health check
│   ├── [locale]/
│   │   ├── admin/           # Back-office (35+ pages)
│   │   ├── staff/           # App mobile staff
│   │   ├── kitchen/         # Kitchen Display
│   │   ├── owner/           # Dashboard propriétaire
│   │   ├── guest/           # App client
│   │   ├── discover/        # Marketplace
│   │   ├── events/          # Événements
│   │   ├── pricing/         # Tarifs
│   │   ├── compare/         # Comparaison
│   │   ├── changelog/       # Changelog
│   │   └── r/[slug]/        # Profil restaurant
│   └── widget/              # Widget iframe
├── components/              # 50+ composants
│   ├── discovery/           # Marketplace
│   ├── pos/                 # POS integration
│   ├── payments/            # Paiements
│   ├── onboarding/          # Onboarding wizard
│   ├── mobile/              # PWA banner
│   └── ...
├── hooks/                   # Custom hooks
│   ├── use-install-prompt.ts
│   ├── use-geolocation.ts
│   └── use-offline-orders.ts
├── lib/
│   ├── agent/               # Agent IA (11 outils)
│   ├── voice/               # Voice AI
│   ├── pos/                 # POS integration
│   ├── crm/                 # CRM & Marketing
│   ├── payments/            # Paiements
│   ├── staff/               # Staff management
│   ├── onboarding/          # Onboarding
│   ├── notifications/       # Push notifications
│   ├── wallet/              # Apple Wallet
│   ├── integrations/        # Google, TripAdvisor, Resend
│   ├── cache.ts             # Redis caching
│   ├── health.ts            # Health checks
│   ├── jobs.ts              # Background jobs
│   └── *.ts                 # 30+ modules métier
├── i18n/                    # 10 langues
└── proxy.ts                 # Edge proxy

prisma/
├── schema.prisma            # 35+ modèles
├── migrations/
└── seed.mjs

k8s/                         # Kubernetes manifests
scripts/                     # Backup/restore
public/
└── sw.js                    # Service worker
```

## Modules clés

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
| Discovery | `lib/discovery.ts` | Marketplace search |
| POS | `lib/pos/` | Toast, Square integration |
| CRM | `lib/crm/` | Guest360, tags, campaigns |
| Payments | `lib/payments/` | Config, preauth, split |
| Staff | `lib/staff/` | Scheduling, timeclock |
| Onboarding | `lib/onboarding/` | Wizard, templates |
| Cache | `lib/cache.ts` | Redis (Upstash) caching |
| Health | `lib/health.ts` | Health checks |
| Jobs | `lib/jobs.ts` | Background jobs |
| Push | `lib/notifications/push.ts` | Push notifications |
| Wallet | `lib/wallet/` | Apple Wallet passes |

## Contribution guide

1. Créer une branche depuis `master`
2. Développer et tester
3. Valider `lint → typecheck → test → build`
4. Soumettre une PR avec titre clair

## Licence

MIT — En contribuant, vous acceptez la licence MIT.
