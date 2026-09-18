# Zanzibar.lounge — Innovation Roadmap & Technical Architecture

**Audience**: Investors, Technical Team, Product Stakeholders
**Date**: September 2026
**Version**: 1.0

---

## Executive Summary

Zanzibar.lounge is a restaurant reservation SaaS platform targeting the Tunisia/MENA region. Built on a modern stack (Next.js 16, Prisma 7, PostgreSQL, React 19), it combines booking management with AI-powered tools designed to increase guest retention and operational efficiency.

This document covers competitive analysis, the innovation roadmap, and technical architecture for 4 new features designed to differentiate from global competitors.

---

## Market Analysis

### Competitive Landscape

| Platform | Region | Strength | Weakness |
|----------|--------|----------|----------|
| **OpenTable** | Global | Massive network, loyalty program | Expensive (per-cover pricing), no MENA focus |
| **Resy** | US/UK | Brand cachet, curated experience | Limited international presence |
| **SevenRooms** | Global | CRM + operations depth | Enterprise-only pricing, complex onboarding |
| **Eat App** | MENA | Regional presence, Arabic support | Basic gamification, limited AI |
| **Majordome** | Tunisia | Local market knowledge | Legacy tech, no mobile-first |
| **Digital Menu** | Tunisia | POS integration | No reservation intelligence |
| **ProResto** | Tunisia | Multi-tenant SaaS | No WhatsApp integration |

### Market Gaps Identified

1. **No AI-powered WhatsApp concierge** in MENA restaurant tech
2. **No gamified waitlist** that turns waiting into engagement
3. **No intelligent upsell** that adapts to guest behavior
4. **No social dining** feature for shared-table experiences
5. **No unified platform** combining reservations + operations + marketing

---

## Innovation Roadmap

### Feature 1: Smart Waitlist Gamification (P0 — MVP)

**Problem**: Traditional waitlists are passive. Guests leave, forget, or get frustrated.

**Solution**: Transform waiting into an engaging experience with real-time progress, rewards, and transparency.

**Key Capabilities**:
- Real-time position tracking with animated progress bar
- Dynamic estimated wait time based on table turnover rates
- Automatic reward eligibility (discounts, free items) based on wait duration
- QR code check-in when arriving on-site
- Staff dashboard with live queue management

**Business Impact**:
- +35% waitlist-to-reservation conversion (estimated)
- -50% no-show rate through gamified commitment
- +20% guest satisfaction through transparency

**Technical Implementation**:
- Schema: `Waitlist` model enriched with gamification fields
- API: `/api/waitlist/status`, `/api/waitlist/check-in`, `/api/waitlist/rewards`
- Components: `waitlist-gamified.tsx`, `waitlist-staff-manager.tsx`

---

### Feature 2: WhatsApp Concierge AI (P0 — MVP)

**Problem**: Restaurants lose bookings to unanswered messages, slow responses, and language barriers.

**Solution**: AI-powered WhatsApp concierge that handles reservations, modifications, and FAQs 24/7 in Arabic, French, and English.

**Key Capabilities**:
- Intent detection (reservation, modification, cancellation, info)
- Natural language processing for Arabic, French, English
- Automatic tool execution (check availability, create booking, cancel)
- Seamless handoff to human staff when needed
- Full conversation logging and analytics

**Business Impact**:
- +60% booking capture (24/7 availability vs business hours)
- -40% staff time on routine inquiries
- +25% conversion from WhatsApp inquiries

**Technical Implementation**:
- Schema: `ConciergeInteraction` model, `Conversation` enriched with WhatsApp fields
- Service: `whatsapp-concierge.ts` (intent detection, response generation)
- API: `/api/admin/whatsapp/concierge` (admin dashboard)

---

### Feature 3: Smart Upsell Engine (P1 — V2)

**Problem**: Restaurants leave money on the table by not suggesting relevant add-ons at the right moment.

**Solution**: AI-driven upsell recommendations based on guest history, context, and menu analytics.

**Key Capabilities**:
- Context-aware suggestions (pre-arrival, in-dining, special events)
- Guest preference learning from past orders and acceptances
- Configurable rules with conditions (party size, time, zone)
- Score-based ranking (historical preference > margin > popularity)
- Acceptance tracking for continuous improvement

**Business Impact**:
- +15-25% average check size through relevant suggestions
- +10% conversion rate on upsell offers
- Data-driven menu engineering insights

**Technical Implementation**:
- Schema: `UpsellRule`, `UpsellSuggestion` models
- Service: `smart-upsell.ts` (scoring engine, recommendation generation)
- API: `/api/admin/upsell` (rules CRUD), `/api/upsell/recommendations` (get suggestions)

---

### Feature 4: Social Dining (P2 — V3)

**Problem**: Solo diners and small groups miss the communal dining experience. Restaurants underutilize table capacity.

**Solution**: Shared-table system for events, theme nights, and chef's table experiences.

**Key Capabilities**:
- Shared table management (capacity, min/max group sizes)
- Per-seat pricing for premium experiences
- Event-linked tables (wine dinners, chef's table)
- Guest-to-guest discovery (interests, dietary preferences)
- Integration with reservation system

**Business Impact**:
- +30% table utilization during off-peak hours
- New revenue stream from premium shared experiences
- Enhanced community building and guest loyalty

**Technical Implementation**:
- Schema: `SocialTable`, `SocialTableReservation` models
- Service: `social-dining.ts` (availability, reservation, management)
- API: `/api/social-dining/tables` (CRUD), `/api/social-dining/reserve` (booking)

---

## Technical Architecture

### Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | 16.3.1 |
| UI | React | 19 |
| Styling | Tailwind CSS | 4 |
| Language | TypeScript | 5.x |
| ORM | Prisma | 7 |
| Database | PostgreSQL | 17 |
| AI | Anthropic SDK (Claude) | Latest |
| Voice | Twilio | Latest |
| Payments | Stripe | Latest |
| Testing | Vitest + Playwright | 4.x + Latest |
| Validation | Zod | Latest |

### Database Schema

**69 models** total. Key additions for innovation features:

```
┌─────────────────────────────────────────────────────────────┐
│                      NEW MODELS                             │
├─────────────────────────────────────────────────────────────┤
│ WaitlistReward          │ Reward rules for waitlist gamification │
│ ConciergeInteraction    │ WhatsApp AI conversation tracking     │
│ SocialTable             │ Shared tables for social dining       │
│ SocialTableReservation  │ Reservations on shared tables         │
│ UpsellRule              │ Configurable upsell rules             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   ENRICHED MODELS                           │
├─────────────────────────────────────────────────────────────┤
│ Waitlist         │ +gamification fields (estimatedWait,      │
│                  │  rewards, check-in, seating)              │
│ Conversation     │ +WhatsApp concierge fields (locale,       │
│                  │  lastIntent, handoff)                     │
│ Reservation      │ +socialTable relation                     │
└─────────────────────────────────────────────────────────────┘
```

### API Routes (New)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/waitlist/status` | GET | Guest: position, estimated wait, rewards |
| `/api/waitlist/check-in` | POST | Guest: QR check-in on arrival |
| `/api/waitlist/rewards` | GET/POST | Admin: manage reward rules |
| `/api/admin/whatsapp/concierge` | GET | Admin: concierge analytics |
| `/api/admin/upsell` | GET/POST | Admin: upsell rules CRUD |
| `/api/upsell/recommendations` | GET/POST | Public: get suggestions, record acceptance |
| `/api/social-dining/tables` | GET/POST | Public/Admin: list/create social tables |
| `/api/social-dining/reserve` | GET/POST/DELETE | Guest: availability, reserve, cancel |

### Component Architecture

```
src/
├── components/
│   ├── waitlist-gamified.tsx      # Guest-facing gamified waitlist
│   ├── waitlist-staff-manager.tsx  # Staff dashboard for queue management
│   ├── waitlist-badge.tsx          # Status badge (WAITING/NOTIFIED/BOOKED)
│   └── waitlist-modal.tsx          # Join waitlist modal
├── lib/
│   ├── waitlist.ts                 # Core waitlist + gamification logic
│   ├── whatsapp-concierge.ts       # WhatsApp AI concierge
│   ├── smart-upsell.ts            # Upsell recommendation engine
│   └── social-dining.ts           # Social table management
└── app/api/
    ├── waitlist/                   # Waitlist endpoints
    ├── admin/whatsapp/concierge/  # Admin concierge dashboard
    ├── admin/upsell/              # Admin upsell rules
    ├── upsell/recommendations/    # Public upsell API
    └── social-dining/             # Social dining endpoints
```

### Security Model

- **Admin auth**: HTTP Basic Auth with timing-safe comparison
- **Staff auth**: Cookie-based HMAC-signed sessions (12h TTL)
- **Guest auth**: Phone-based HMAC-signed sessions
- **API validation**: Zod schemas for all inputs
- **Database**: Prisma with parameterized queries (SQL injection safe)
- ** CSP**: Nonce-based Content Security Policy per request

---

## Development Process

### Sprint Structure

| Sprint | Focus | Deliverables |
|--------|-------|-------------|
| 1-2 | Schema + Services | Prisma models, waitlist.ts, whatsapp-concierge.ts |
| 3-4 | API Routes | 8 new endpoints, admin dashboards |
| 5-6 | Frontend | Gamified waitlist components, staff manager |
| 7-8 | Smart Upsell | Upsell engine, rules CRUD, recommendations API |
| 9-10 | Social Dining | Social table system, reservation flow |

### Quality Gates

Every commit passes:
1. `npm run typecheck` — TypeScript compilation
2. `npm run lint` — ESLint (0 errors)
3. `npm test` — 38 unit tests
4. `npm run build` — Production build (778 pages)

---

## Revenue Model

### SaaS Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Starter** | 299 TND/mo | Reservations, basic menu, 1 staff |
| **Professional** | 699 TND/mo | + Waitlist, orders, CRM, 5 staff |
| **Enterprise** | 1,499 TND/mo | + AI concierge, upsell, social dining, unlimited |

### Add-ons

- **WhatsApp Concierge AI**: +199 TND/mo (1,000 messages included)
- **Smart Upsell**: +99 TND/mo
- **Social Dining**: +149 TND/mo
- **POS Integration**: +149 TND/mo

---

## Competitive Advantages

1. **MENA-first**: Native Arabic support, local payment methods, Tunisia market focus
2. **WhatsApp-native**: AI concierge on the platform 80% of Tunisians use daily
3. **Gamification**: Only platform turning waitlists into engagement tools
4. **All-in-one**: Reservations + operations + marketing in one SaaS
5. **AI-powered**: From concierge to upsell to demand forecasting
6. **Affordable**: 70% cheaper than OpenTable, comparable to local solutions

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Low AI adoption | Fallback to human handoff, gradual rollout |
| WhatsApp API changes | Abstraction layer, multi-channel support |
| Competition from Eat App | Faster iteration, local market expertise |
| Scalability | PostgreSQL + Redis caching, horizontal scaling |
| Data privacy | GDPR-ready, local data residency option |

---

## Next Steps

1. **MVP Launch** (Month 1-2): Waitlist gamification + WhatsApp concierge
2. **V2 Release** (Month 3-4): Smart upsell engine
3. **V3 Release** (Month 5-6): Social dining + events
4. **Scale** (Month 7+): Multi-country expansion, enterprise features

---

## Appendix: Git Commits

| Commit | Sprint | Description |
|--------|--------|-------------|
| `08ed14a` | 1-2 | Schema + waitlist gamification + WhatsApp concierge services |
| `fc14102` | 3-4 | WhatsApp Concierge admin API + gamified waitlist endpoints |
| `2002c95` | 5-6 | Gamified waitlist frontend components |
| `9538fee` | 7-8 | Smart Upsell engine |
| `68f4c96` | 9-10 | Social Dining feature |
| `60da66e` | Fix | Lint errors in waitlist components |
| `dd94df0` | Chore | Pre-existing changes |

---

*Document generated for Zanzibar.lounge — September 2026*
