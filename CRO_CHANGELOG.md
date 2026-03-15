# CRO Changelog — Conversion Rate Optimization

Track every analytics-driven change, the data behind it, and the measured results.

---

## #001 — PostHog Tracking Installation
**Date:** 2026-03-14
**Type:** Infrastructure
**Page:** All funnel pages (9 total)

**What was done:**
- Installed `posthog-js` SDK with project key `phc_CuzFG3ctRi1x5sM5nX2fztJhvI2bdcHiRHVHTuGCs6O`
- Created `usePostHogEvents` hook tracking: scroll depth (25/50/75/100%), button clicks, form submissions, outbound links
- Added masterclass-specific events: `optin_modal_opened`, `masterclass_lead_submitted`
- Wired into all 9 pages: masterclass, sales, agency, upsell, downsell, thank-you, booking, quiz, roadmap-info

**Baseline metrics (first 9 hours):**
- 16 pageviews (15 masterclass, 1 sales)
- Modal open rate: 6.7% (1/15)
- Form completion: 100% (1/1 modal opens)
- Lead → Sales page: 100%
- Purchase: 0%

---

## #002 — Masterclass: Sticky CTA Bar + Video Play Button Pulse
**Date:** 2026-03-14
**Type:** CRO Improvement
**Page:** `/masterclass`
**Hypothesis:** Modal open rate is 6.7% because the video play button gets zero clicks and CTAs aren't visible enough. A sticky bottom CTA bar + pulsing play button will increase modal opens to 20%+.

**PostHog data supporting change:**
- 15 pageviews → 1 modal open (6.7%)
- Video play button: 0 clicks
- "Get Free Access Now" (below fold): 1 click — the ONLY trigger
- Scroll: 4 hit 25%, only 2 reached 100% — visitors leaving before seeing lower CTAs

**What was changed:**
- Added pulsing glow animation to video play button
- Added "FREE TRAINING" text overlay on video thumbnail
- Added floating sticky CTA bar (appears after 3s, hides when modal open)
- Sticky bar includes "Watch Free Training" button + "100% Free" trust badge

**Measure success by:** Modal open rate > 20% over next 48 hours

---
