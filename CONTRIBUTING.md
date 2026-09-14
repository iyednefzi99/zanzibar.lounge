# Contribuer à Zanzibar Lounge

Merci de votre intérêt pour contribuer à Zanzibar Lounge ! Ce guide explique
comment mettre en place votre environnement de développement et comment
soumettre vos contributions.

## Prérequis

- **Node.js** ≥ 20 (vérifier avec `node --version`)
- **PostgreSQL** ≥ 14 (ou un conteneur Docker)
- **npm** ≥ 10 (inclus avec Node 20+)
- Un compte **Stripe** (clés test) pour les fonctionnalités SaaS
- (Optionnel) Un compte **Twilio** pour les SMS
- (Optionnel) Une clé **Anthropic** pour l'agent IA

## Mise en place du projet

```bash
# 1. Cloner le dépôt
git clone https://github.com/zanzibar-lounge/zanzibar.lounge.git
cd zanzibar.lounge

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos valeurs (voir ci-dessous)

# 4. Créer la base de données
# Créer une base PostgreSQL nommée "zanzibar" (ou le nom de votre choix)
createdb zanzibar

# 5. Appliquer les migrations
npm run db:migrate

# 6. Peupler la base avec les données d'exemple
npm run db:seed

# 7. Lancer le serveur de développement
npm run dev
```

### Variables d'environnement minimales

Seule `DATABASE_URL` est obligatoire pour le développement local :

```
DATABASE_URL=postgresql://user:password@localhost:5432/zanzibar
```

Les autres variables sont optionnelles et désactivent gracieusement les
fonctionnalités associées (WhatsApp, SMS, agent IA).

## Workflow de développement

### Branches

- `main` — branche de production, toujours déployable
- `develop` — branche d'intégration
- `feat/*` — nouvelles fonctionnalités
- `fix/*` — corrections de bugs
- `chore/*` — maintenance, dépendances, documentation

### Processus

1. Créer une branche depuis `develop` :
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/nom-de-la-fonctionnalite
   ```

2. Développer vos changements
3. Soumettre régulièrement avec des messages clairs :
   ```bash
   git add .
   git commit -m "feat: ajouter la vérification OTP pour les réservations"
   ```

4. Pousser et créer une Pull Request :
   ```bash
   git push -u origin feat/nom-de-la-fonctionnalite
   ```

### Conventions de commit

Nous suivons la spécification [Conventional Commits](https://www.conventionalcommits.org/) :

| Préfixe   | Usage                                          |
|-----------|------------------------------------------------|
| `feat:`   | Nouvelle fonctionnalité                        |
| `fix:`    | Correction de bug                              |
| `docs:`   | Documentation                                  |
| `style:`  | Formatage, point-virgule manquant, etc.        |
| `refactor:` | Refactorisation sans changement de comportement |
| `test:`   | Ajout ou correction de tests                   |
| `chore:`  | Dépendances, configuration, outillage          |

Exemples :
```
feat: ajout du canal WhatsApp pour les réservations
fix: corriger le calcul des créneaux hors service
docs: mettre à jour l'OpenAPI avec les endpoints SaaS
```

## Style de code

### TypeScript

- **Mode strict** : `strict: true` dans `tsconfig.json` — aucun `any`
- Préférer les types explicites aux assertions (`as`)
- Utiliser les enums Prisma pour les statuts et catégories
- Les chemins d'importation utilisent le préfixe `@/` (alias `src/`)

### ESLint

```bash
npm run lint
```

Les règles sont dans `eslint.config.mjs`. Le linting est exécuté automatiquement
en CI — les PR qui ne passent pas le lint ne seront pas fusionnées.

### Formatage

Utiliser le formatage par défaut de votre éditeur (VS Code recommande le
paramètre `"editor.defaultFormatter": "esbenp.prettier-vscode"`). La CI
vérifie uniquement ESLint, mais un code propre facilite les revues.

## Tests

### Tests unitaires (Vitest)

```bash
# Exécuter tous les tests
npm run test

# Exécuter un fichier spécifique
npx vitest run src/lib/time.test.ts

# Mode watch pendant le développement
npm run test:watch
```

Les tests sont dans `src/lib/*.test.ts` (pattern co-localisé). Ils testent
la logique pure sans base de données : formatage de téléphone, calcul
d'heures, fuseaux horaires.

### Tests E2E (Playwright)

```bash
# Installer les navigateurs
npx playwright install

# Exécuter les tests E2E
npm run test:e2e

# Exécuter avec l'interface graphique
npm run test:e2e:ui
```

### Tous les tests

```bash
npm run test:all
```

## Vérification avant de soumettre une PR

Exécuter dans cet ordre exact (identique à la CI) :

```bash
npm run lint        # Linting ESLint
npm run typecheck   # Vérification TypeScript
npm test            # Tests unitaires
npm run build       # Build de production
```

Si une commande échoue, corriger les erreurs avant de soumettre la PR.

## Conventions pour les Pull Requests

1. **Titre clair** : décrire le changement en une ligne
2. **Description** : expliquer le contexte, le problème résolu, et la solution
3. **Petites PR** : préférer des PRs ciblées (< 400 lignes) à des PRs monolithiques
4. **Tests** : ajouter des tests pour les nouvelles fonctionnalités
5. **Pas de secrets** : ne jamais inclure de clés, mots de passe ou tokens
6. **Pas de `package-lock.json` modifié** sans raison valable

## Structure du projet

```
src/
├── app/                    # Routes Next.js (App Router)
│   ├── api/                # API routes
│   │   ├── v1/             # API publique v1
│   │   └── saas/           # Routes SaaS (gestion)
│   └── [locale]/           # Pages i18n
├── components/             # Composants React
├── content/                # Contenu statique (site.ts, dictionnaires)
├── generated/              # Client Prisma généré (gitignoré)
├── lib/                    # Logique métier
│   ├── agent/              # Agent IA (boucle, outils, prompt)
│   ├── channels/           # WhatsApp, SMS
│   └── *.ts               # Modules indépendants
└── proxy.ts               # Proxy Edge (locale, auth, CSP)

prisma/
├── schema.prisma           # Schéma de la base de données
├── config.ts               # Configuration Prisma 7
└── seed.mjs                # Données d'exemple
```

## Aide

- Consulter la [documentation Next.js 16](https://nextjs.org/docs) (App Router)
- Lire `AGENTS.md` à la racine du projet pour les règles spécifiques
- En cas de doute, ouvrir une issue avant de commencer le développement

## Licence

En contribuant, vous acceptez que vos contributions soient licenciées sous la
licence MIT du projet.
