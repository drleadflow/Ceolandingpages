# Titan Dashboard — Project Instructions

## Project Overview

Health professional marketing platform with sales funnels, quiz-based lead capture, course checkout, and agency booking. Built for HealthProCEO / DoctorLeadFlow.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Express + tRPC |
| ORM | Drizzle (MySQL) |
| Database | MySQL on Railway |
| AI | OpenAI gpt-4o-mini (`server/_core/llm.ts`) |
| Checkout | Whop embedded (`@whop/checkout/react`) |
| PDF | jsPDF (client-side, `client/src/lib/pdfGenerator.ts`) |
| Testing | Vitest |
| Deployment | Railway (use `railway up`, not GitHub auto-deploy) |

## Directory Structure

```
client/src/
  components/funnel/   # Reusable funnel UI (PathSelector, PricingTiers, ExitIntentPopup, etc.)
  pages/funnel/        # Route pages (SalesPage, AgencyPage, QuizPage, ThankYouPage)
  hooks/               # Custom hooks (usePixelTracking, etc.)
  contexts/            # React contexts (FunnelContext)
  lib/                 # Utilities (trpc client, funnelTracking, pdfGenerator)

server/
  _core/               # Core utils (llm.ts, db connection)
  routes/              # tRPC routers
  trackingService.ts   # Server-side pixel/CAPI firing
  funnelRouter.ts      # Funnel API routes
  roadmapRouter.ts     # Quiz/roadmap API routes
```

## Funnel Pages & Flows

### Sales Page (`/fb-ads-course`)
- **Default flow**: Hero → Video → Social Proof → Value Stack → Testimonials → Checkout Form → FAQ
- **Dual-path flow** (`?flow=dual`): Hero → Video → **PathSelector** → Social Proof → Value Stack → Testimonials → **PricingTiers** → FAQ → **ExitIntentPopup**
  - PathSelector shows immediately (no lead gate)
  - "Courses" → scrolls to PricingTiers (3 tiers, each with own checkout form)
  - "Agency" → navigates to `/agency`
  - Exit popup: desktop-only, once per session, links to `/quiz?ref=sales-exit`

### Agency Page (`/agency`)
- Done-for-you service page with GHL booking calendar embed
- Has ExitIntentPopup → `/quiz?ref=agency-exit`

### Quiz (`/quiz`)
- Lead capture quiz → generates practice growth roadmap
- Accepts `?ref=` param for attribution tracking

## Key Components

| Component | File | Purpose |
|-----------|------|---------|
| PathSelector | `client/src/components/funnel/PathSelector.tsx` | Time vs money card selector |
| PricingTiers | `client/src/components/funnel/PricingTiers.tsx` | 3-tier pricing with per-tier checkout |
| ExitIntentPopup | `client/src/components/funnel/ExitIntentPopup.tsx` | Desktop exit-intent modal → quiz |
| FunnelVideoPlayer | `client/src/components/funnel/FunnelVideoPlayer.tsx` | VSL video with overlay styles |
| SenjaTestimonials | `client/src/components/funnel/SenjaTestimonials.tsx` | Testimonial widget |

## Tracking & Analytics

- **Admin panel**: `/admin/funnel/tracking`
- **Client-side**: `usePixelTracking(pageSlug)` hook injects pixel scripts
- **Server-side**: Facebook CAPI + Hyros API on purchase/upsell events
- **Configured**: Meta Pixel (x2), GTM, Hyros
- **Events tracked**: page_view, checkout_start, purchase (via tRPC `funnelAdmin.events.track`)

## Database

- **ORM**: Drizzle with MySQL
- **Migrations**: `npx drizzle-kit push --force` to sync schema
- **Config**: `drizzle.config.ts` reads `DATABASE_URL` from `.env`
- **Data inserts**: `npx tsx -e` with Drizzle ORM (no local mysql CLI)

## Development Commands

```bash
npm run dev          # Start dev server (Vite + Express)
npx tsc --noEmit     # Type check
npx vite build       # Production build
npx drizzle-kit push --force  # Sync DB schema
railway up           # Deploy to Railway
```

## Conventions

- **Immutable patterns**: Never mutate state directly; always create new objects
- **Small files**: Prefer many small files over few large ones (200-400 lines typical)
- **Error handling**: Handle errors explicitly, user-friendly messages in UI, detailed logs server-side
- **Input validation**: Validate at boundaries using Zod schemas (tRPC routers use Zod)
- **CSS**: Tailwind utility classes + CSS custom properties (`var(--titan-*)`) for theming
- **Commits**: Conventional commits (`feat:`, `fix:`, `refactor:`, etc.)

## Deployment Workflow

1. Make code changes
2. Commit + push to GitHub
3. Run `railway up` to deploy (don't rely on auto-deploy)
