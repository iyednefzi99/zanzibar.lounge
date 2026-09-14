# Zanzibar Lounge

Plateforme complète de réservation de restaurant — vitrine trilingue, agent IA conversationnel,
SaaS multi-établissement, analytics avancés, application mobile staff, et bien plus.

> **Plateforme de classe mondiale** — 10 langues, 150+ routes, agent vocal IA,
> système de caisse cuisine, widget embeddable, analytics prédictifs,
> déploiement Docker/Kubernetes, et 29 tests unitaires.

---

## Fonctionnalités

### Phase 1 — Foundations
- **Sentry** error tracking (client + server + edge)
- **Error boundaries** (global, page, not-found, loading)
- **SEO** (sitemap, robots, JSON-LD, OG images, Twitter cards)
- **PWA** (manifest, icons, offline, service worker)
- **Playwright E2E** (29 scénarios)
- **Vercel Analytics** + Speed Insights

### Phase 2 — Market Differentiation
- **Stripe payments** (checkout, webhooks, refunds, dépôts)
- **Notifications avancées** (rappels J-1, offres flash, anniversaire, météo)
- **Analytics prédictifs** (occupation, recommandations, tendances, segments)
- **Pages publiques** (découverte, profil restaurant avec SEO local)
- **Plan de salle interactif** (SVG, 3 zones, statut temps réel)

### Phase 3 — SaaS Platform
- **Onboarding** (tokens d'inscription, création restaurant)
- **Stripe Billing** (4 plans, abonnements, portail client)
- **Dashboard propriétaire** (settings, équipe, facturation, usage)
- **API publique** (6 endpoints REST documentés)
- **API SaaS** (onboard, plan, portal, staff, webhooks)

### Phase 4 — Ecosystem
- **OpenAPI 3.1** (13 endpoints, 15 schémas)
- **MIT License**
- **CONTRIBUTING.md** (guide en français)
- **CI/CD** (Vercel deploy, Prisma migrate)

### Phase 5 — Intelligence
- **Agent V2** (11 outils, suggestions intelligentes, multi-établissement)
- **Intégrations** (Google Calendar, Google Business, TripAdvisor)
- **White-Label** (branding dynamique, CSS custom properties)
- **Marketplace** (filtres, profils, réservation inline)

### Phase 6 — Advanced
- **Analytics avancés** (temps réel, revenus, guests, heatmap 7×24)
- **App mobile staff** (login, réservations, commandes, scanner QR)
- **Sécurité** (2FA TOTP, audit logs, rate limiting, API keys)
- **Enterprise** (webhooks HMAC, delivery tracking, feature flags)

### Phase 7 — Operations
- **Kitchen Display System** (KDS plein écran, auto-refresh, audio beep)
- **Widget embeddable** (iframe, composant React, API publique)
- **Notification center** (in-app, 6 types, bell badge)

### Phase 8 — Voice AI
- **Twilio Voice** (appels entrants/sortants, TwiML)
- **Speech-to-text** (Whisper API, détection langue/intent)
- **Agent vocal** (conversation par appel, outils existants)

### Phase 9 — Menu & Inventory
- **Gestion menu** (catégories, items, specials journaliers, allergènes)
- **Inventaire** (stock, alertes basse库存, déduction auto)
- **Éditeur menu** (drag-and-drop, inline editing)

### Phase 10 — Guest App
- **Dashboard client** (réservations à venir, fidélité, commandes)
- **Réservations** (historique, annulation, notation)
- **Fidélité** (points, paliers, récompenses)
- **Profil** (préférences, avatar, notifications)

### Phase 11 — Multi-language
- **10 langues** (fr, ar, en, de, es, it, pt, ru, zh, ja)
- **i18n manager** (monnaie, dates, nombres par locale)
- **RTL** (arabe, japonais, chinois, russe)
- **Admin traductions** (complétude par locale)

### Phase 12 — Social & Community
- **Parrainage** (codes, double récompense)
- **File d'attente** (position, notifications)
- **Événements** (création, réservation, capacité)
- **Galerie** (photos restaurant)

### Phase 13 — Performance & SEO
- **ISR** (revalidation horaire)
- **Cache** (in-mémoire avec TTL)
- **SEO avancé** (schemas.org, hreflang, preconnect)
- **Core Web Vitals** (LCP, FID, CLS tracking)

### Phase 14 — AI Analytics
- **Prédiction revenus** (moving average saisonnière, CI 95%)
- **Risque no-show** (scoring par réservation)
- **Pricing dynamique** (happy hour, peak surcharge)
- **Sentiment analysis** (mots-clés + étoiles)
- **A/B testing** (z-test, intervalles de confiance)
- **Segmentation marketing** (VIP, high-value, at-risk)

### Phase 15 — DevOps
- **Dockerfile** (3 stages, non-root)
- **Docker Compose** (Postgres 17, Redis 7)
- **Kubernetes** (deployment, service, ingress, HPA, PDB)
- **CI Docker** (GitHub Container Registry)
- **Backup/Restore** (pg_dump, S3, rétention 30j)
- **Health check** (/api/health)
- **Monitoring** (métriques, santé, mémoire)

### Phase 16 — Marketplace & Discovery
- **Discovery engine** (recherche avancée, filtres, tri)
- **Restaurant profiles** (galerie, avis, menus, horaires)
- **SEO optimisé** (schema.org, breadcrumbs, OG)
- **Réservation directe** depuis la découverte
- **10 composants** discovery (cards, filtres, grille, hero)

### Phase 17 — POS & Integrations
- **Toast POS** (sync commandes, webhook)
- **Square POS** (sync commandes, webhook)
- **Email transactionnels** (Resend, templates HTML)
- **Google Maps** (géocodage, nearby, statiques)
- **Admin POS** (configuration, historique sync)

### Phase 18 — CRM & Marketing
- **Guest360** (vue complète, timeline, notes)
- **Segmentation** (VIP, réguliers, occasionnels, nouveaux)
- **Tags** (assignation, filtrage)
- **Campagnes email** (création, envoi, stats)
- **3 pages admin** (CRM, guests, campaigns)

### Phase 19 — Paiements & Anti No-Show
- **Config paiements** (acompte, pré-autorisation)
- **Bill splitting** (également, par items, tips)
- **Frais d'annulation** configurables
- **Stripe pre-auth** (autorisation, capture, annulation)

### Phase 20 — Staff Management & Scheduling
- **Shift management** (CRUD, bulk, copy week)
- **Disponibilités** (horaires hebdo, vérification)
- **Timeclock** (clock in/out, pauses, heures)
- **Performance** (couvertures, heures, notes)

### Phase 21 — Onboarding & Growth
- **Wizard 3 étapes** (infos, cuisine, modèle menu)
- **5 modèles** (Tunisienne, Italienne, Japonaise, Française, Mexicaine)
- **Page pricing** (3 plans : Starter 29€, Pro 79€, Enterprise 199€)
- **Page comparaison** (vs OpenTable, Resy, TheFork)
- **Changelog** (timeline des versions)

### Phase 22 — Excellence Technique
- **Redis caching** (Upstash REST, TTL, invalidation)
- **Background jobs** (queue mémoire, handlers)
- **Health checks** (DB, mémoire, uptime, metrics)
- **API health** (/api/health, /api/admin/jobs)

### Phase 23 — Mobile App & Offline
- **PWA premium** (manifest, service worker, install)
- **Offline orders** (queue locale, sync automatique)
- **Push notifications** (VAPID, subscriptions)
- **Apple Wallet** (pass HTML pour réservations)
- **Géolocalisation** (nearby restaurants)

---

## Pile technique

| Technologie | Rôle |
|---|---|
| **Next.js 16** (App Router, Turbopack) | Rendu, routes API, proxy |
| **React 19** | Interface utilisateur |
| **TypeScript 5** | Typage de bout en bout |
| **Tailwind CSS 4** | Styles avec palette night/shell/brass/coral/lagoon |
| **Prisma 7** + **PostgreSQL** | Base de données (adaptateur) |
| **SDK Anthropic** (`claude-opus-5`) | Agent conversationnel IA |
| **Twilio** | Voice + SMS |
| **WhatsApp Cloud API** | Canal WhatsApp |
| **Stripe** | Paiements + Billing |
| **Resend** | Email transactionnels |
| **Google Maps** | Géocodage, nearby |
| **Sentry** | Error tracking |
| **Vercel** | Hosting + Analytics |
| **Docker/Kubernetes** | Déploiement |
| **Vitest** | Tests unitaires |
| **Playwright** | Tests E2E |

---

## Installation

**Prérequis** — Node.js 20+ (développé sous 24), npm 10+, PostgreSQL 14+.

```bash
git clone https://github.com/iyednefzi99/zanzibar.lounge.git
cd zanzibar.lounge
npm install
cp .env.example .env.local
```

Renseignez `.env.local` (voir `.env.example` pour la liste complète).

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

### Docker (alternative)

```bash
docker compose up -d    # PostgreSQL + Redis + App
npm run db:migrate
npm run dev
```

### Kubernetes

```bash
kubectl apply -f k8s/
```

---

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Compilation de production |
| `npm start` | Sert la compilation |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Tests Vitest |
| `npm run test:e2e` | Tests Playwright |
| `npm run db:migrate` | Migration dev |
| `npm run db:deploy` | Migration prod |
| `npm run db:seed` | Données d'exemple |

---

## Architecture

```
150+ routes API
├── Public:      /api/v1/restaurants/*
├── Booking:     /api/reservations, /api/availability
├── Orders:      /api/orders, /api/menu
├── SaaS:        /api/saas/{onboard,setup,plan,portal,staff,webhooks}
├── Voice:       /api/voice/{incoming,gather,outbound}
├── Kitchen:     /api/kitchen/orders/*
├── Widget:      /api/widget/{config,availability,reserve}
├── Guest:       /api/guest/{profile,reservations,reviews}
├── Admin:       /api/admin/{export,orders,2fa,apikeys,jobs}
├── Analytics:   /api/analytics/realtime
├── Discovery:   /api/discovery/{search,featured,restaurants}
├── CRM:         /api/crm/{guests,tags,campaigns}
├── Payments:    /api/payments/{config,preauth,split}
├── Staff:       /api/staff/{schedule,timeclock,performance}
├── Onboarding:  /api/onboarding/complete
├── Push:        /api/notifications/push
├── Wallet:      /api/wallet/pass
├── Health:      /api/health
└── Webhooks:    /api/webhooks/{whatsapp,twilio}
```

---

## Routes principales

| Page | Rôle |
|---|---|
| `/{locale}` | Accueil (horaires, CTA réservation) |
| `/{locale}/reserver` | Formulaire réservation |
| `/{locale}/commander` | Commande en ligne |
| `/{locale}/carte` | Menu du restaurant |
| `/{locale}/discover` | Marketplace découverte |
| `/{locale}/r/[slug]` | Profil restaurant |
| `/{locale}/events` | Événements |
| `/{locale}/waitlist` | File d'attente |
| `/{locale}/pricing` | Tarifs (3 plans) |
| `/{locale}/compare` | Comparaison concurrents |
| `/{locale}/changelog` | Changelog |
| `/{locale}/guest` | Dashboard client |
| `/{locale}/staff` | App mobile staff |
| `/{locale}/kitchen` | Kitchen Display System |
| `/{locale}/admin` | Back-office service |
| `/{locale}/admin/analytics` | Analytics dashboard |
| `/{locale}/admin/analytics/realtime` | Dashboard temps réel |
| `/{locale}/admin/analytics/revenue` | Revenus |
| `/{locale}/admin/analytics/guests` | Clients |
| `/{locale}/admin/analytics/heatmap` | Heatmap 7×24 |
| `/{locale}/admin/analytics/insights` | Insights IA |
| `/{locale}/admin/analytics/experiments` | A/B testing |
| `/{locale}/admin/menu` | Gestion menu |
| `/{locale}/admin/inventory` | Inventaire |
| `/{locale}/admin/floor` | Plan de salle |
| `/{locale}/admin/orders` | Commandes |
| `/{locale}/admin/chat` | Chat clients |
| `/{locale}/admin/reviews` | Avis clients |
| `/{locale}/admin/voice` | Paramètres vocaux |
| `/{locale}/admin/security` | Sécurité (2FA, audit) |
| `/{locale}/admin/integrations` | Intégrations tierces |
| `/{locale}/admin/integrations/pos` | Configuration POS |
| `/{locale}/admin/notifications` | Centre de notifications |
| `/{locale}/admin/widget` | Widget embeddable |
| `/{locale}/admin/translations` | Gestion traductions |
| `/{locale}/admin/crm` | CRM & Marketing |
| `/{locale}/admin/crm/guests` | Liste clients |
| `/{locale}/admin/crm/campaigns` | Campagnes email |
| `/{locale}/admin/payments` | Configuration paiements |
| `/{locale}/owner` | Dashboard propriétaire |
| `/{locale}/owner/settings` | Paramètres restaurant |
| `/{locale}/owner/team` | Gestion équipe |
| `/{locale}/owner/billing` | Facturation |
| `/{locale}/owner/schedule` | Planning staff |
| `/{locale}/owner/onboarding` | Configuration initiale |
| `/widget/{slug}` | Widget réservation (iframe) |
| `/offline` | Page hors ligne |

---

## Tests

```bash
npm test            # 29 tests unitaires
npm run test:e2e    # 29 scénarios Playwright
```

| Fichier | Couverture |
|---|---|
| `src/lib/time.test.ts` | Conversions fuseau, minutes, dates |
| `src/lib/hours.test.ts` | Horaires, créneaux, préavis |
| `src/lib/phone.test.ts` | Normalisation E.164 |
| `e2e/*.spec.ts` | Homepage, booking, menu, admin, user flows |

---

## Contribuer

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour le guide complet.

```bash
git clone https://github.com/iyednefzi99/zanzibar.lounge.git
cd zanzibar.lounge
npm install
npm run dev
```

Avant de valider :
```bash
npm run lint && npm run typecheck && npm test && npm run build
```

---

## Licence

MIT — Voir [LICENSE](LICENSE)

---

## Auteur

**Iyed Nefzi** — [iyednefzi99](https://github.com/iyednefzi99)
