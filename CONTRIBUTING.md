# Contribuer à E-Coffee Node

Merci de votre intérêt pour contribuer à E-Coffee Node ! Ce guide explique
comment mettre en place votre environnement de développement et comment
soumettre vos contributions.

## Prérequis

- **Node.js** ≥ 20 (vérifier avec `node --version`)
- **PostgreSQL** ≥ 14 (ou un conteneur Docker)
- **npm** ≥ 10 (inclus avec Node 20+)
- **Seule `DATABASE_URL` est obligatoire** — sans clés Anthropic/WhatsApp/Twilio,
  l'agent IA et les canaux de messagerie sont désactivés, le reste tourne
  (`src/lib/env.ts`)
- (Optionnel) Comptes/clés pour les intégrations : Stripe, Twilio, Anthropic,
  Google Calendar/Maps, Resend, Upstash Redis, Sentry — voir `.env.example`

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

Seule `DATABASE_URL` est obligatoire pour le développement local (liste
complète commentée dans `.env.example`) :

```
DATABASE_URL=postgresql://user:password@localhost:5432/e_coffee
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
- **Mode strict** — éviter `any` (les intégrations POS exigent parfois un cast
  JSON : `as unknown as Record<string, string>`)
- Enums Prisma pour les statuts
- Imports avec préfixe `@/` (alias `src/`)
- Pas de date library : utiliser `src/lib/time.ts` (Intl, « minutes depuis minuit »)

### ESLint
Règles strictes : `react-hooks/immutability`, `react-hooks/set-state-in-effect`.

### Formatage
Formatter par défaut de l'éditeur. La CI vérifie ESLint.

### Next.js 16
Ce projet n'utilise pas la doc Next.js classique : `middleware.ts` a été remplacé
par `src/proxy.ts` (Edge). Consulter `node_modules/next/dist/docs/` avant
d'ajouter du code concernant le routing ou les conventions App Router.

## Tests

```bash
npm test            # 38 tests unitaires (Vitest)
npm run test:e2e    # 29 scénarios E2E (Playwright)
npm run test:all    # Les deux
```

## Vérification avant PR

Exécuter dans cet ordre (identique à la CI — voir
`.github/workflows/ci.yml`) :

```bash
npx prisma generate
npm run lint
npm run typecheck
npm test
npm run build
```

La CI ajoute ensuite `npm audit --omit=dev --audit-level=high` après le build.

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
│   │   └── health/          # Health check (+ 34 autres groupes, 107 route.ts)
│   ├── [locale]/            # 55 pages total
│   │   ├── admin/           # Back-office (25 pages)
│   │   ├── staff/           # App mobile staff
│   │   ├── kitchen/         # Kitchen Display
│   │   ├── owner/           # Dashboard propriétaire
│   │   ├── guest/           # Espace client
│   │   ├── discover/        # Marketplace
│   │   └── r/[slug]/        # Profil restaurant
│   └── widget/              # Widget iframe
├── components/              # UI (booking, menu, hero, layout…)
├── hooks/                   # 3 hooks (install prompt, géoloc, offline orders)
├── lib/
│   ├── agent/               # Agent IA (11 outils, boucle maison)
│   ├── ai/                  # Routing provider, audit, coûts
│   ├── predict/             # Prévisions demande, no-show, waste
│   ├── voice/               # Voice AI (Twilio, STT, TTS)
│   ├── crm/                 # Guest360, tags, campagnes
│   ├── payments/            # Stripe preauth, bill splitting
│   ├── pos/                 # Toast, Square
│   ├── staff/               # Planning, timeclock
│   ├── reservations.ts      # Logique unique de réservation (web + agent)
│   ├── orders.ts            # Commandes
│   ├── saas.ts              # Multi-tenancy, billing
│   ├── env.ts               # Validation Zod des variables
│   └── time.ts              # Fuseaux via Intl
├── i18n/                    # config + dictionnaires (10 langues)
└── proxy.ts                 # Edge proxy (locale, admin auth, CSP nonce)

prisma/
├── schema.prisma            # 75 modèles
├── migrations/
└── seed.mjs

k8s/                         # Kubernetes manifests
scripts/                     # Backup/restore
public/
└── sw.js                    # Service worker
```

## Modules clés

Le détail complet est dans [AGENTS.md](AGENTS.md#key-modules). Les plus
importants :

| Module | Path | Rôle |
|---|---|---|
| Reservations | `lib/reservations.ts` | Logique unique de réservation (web + agent) |
| Orders | `lib/orders.ts` | Commandes en ligne |
| Agent | `lib/agent/` | Conversation IA (11 outils, ownership checks) |
| Voice | `lib/voice/` | Voice AI (Twilio, STT, TTS) |
| SaaS | `lib/saas.ts` | Multi-tenancy, billing |
| Staff auth | `lib/staff-session.ts` | Sessions staff (cookies HMAC) |
| Guest auth | `lib/guest-session.ts` | Sessions client (téléphone HMAC) |
| Menu | `lib/menu-manager.ts` | CRUD menu |
| Env | `lib/env.ts` | Validation Zod des variables |

## Contribution guide

1. Créer une branche depuis `master`
2. Développer et tester
3. Valider `prisma generate → lint → typecheck → test → build`
4. Soumettre une PR avec titre clair

## Licence

MIT — En contribuant, vous acceptez la licence MIT.

Voir aussi : [AGENTS.md](AGENTS.md) (règles pour les assistants IA),
[INNOVATION-ROADMAP.md](INNOVATION-ROADMAP.md), [docs/](docs/).
