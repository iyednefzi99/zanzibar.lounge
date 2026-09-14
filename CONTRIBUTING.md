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
│   │   ├── notifications/   # Notification center
│   │   ├── admin/           # Admin (2FA, API keys)
│   │   └── health/          # Health check
│   ├── [locale]/
│   │   ├── admin/           # Back-office (30+ pages)
│   │   ├── staff/           # App mobile staff
│   │   ├── kitchen/         # Kitchen Display
│   │   ├── owner/           # Dashboard propriétaire
│   │   ├── guest/           # App client
│   │   ├── discover/        # Marketplace
│   │   ├── events/          # Événements
│   │   └── r/[slug]/        # Profil restaurant
│   └── widget/              # Widget iframe
├── components/              # 40+ composants
├── lib/
│   ├── agent/               # Agent IA (11 outils)
│   ├── voice/               # Voice AI
│   ├── integrations/        # Google, TripAdvisor
│   ├── *.ts                 # 30+ modules métier
├── i18n/                    # 10 langues
└── proxy.ts                 # Edge proxy

prisma/
├── schema.prisma            # 25+ modèles
├── migrations/
└── seed.mjs

k8s/                         # Kubernetes manifests
scripts/                     # Backup/restore
```

## Contribution guide

1. Créer une branche depuis `master`
2. Développer et tester
3. Valider `lint → typecheck → test → build`
4. Soumettre une PR avec titre clair

## Licence

MIT — En contribuant, vous acceptez la licence MIT.
