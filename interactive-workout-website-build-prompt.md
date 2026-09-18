# Build Prompt — InteractiveWorkout Waitlist Website

Use this as a direct prompt for a coding agent (Claude Code, etc.) to scaffold and build the site.

---

## Context

Build a single-page marketing/waitlist website for **InteractiveWorkout** — a motion-controlled endless runner game where a player's real body movements (jumps, squats, lateral steps, burpees), captured through the front camera via pose estimation, control an endless-runner game. No product exists yet; this site's only job is to explain the idea and collect email signups before launch.

Tone: energetic, kinetic, confident — this is a fitness-meets-gaming product, not a clinical or corporate one. The clinical/PT angle should not be foregrounded here; this is the consumer-facing teaser.

---

## Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS.
- **Backend:** Go, exposing a small REST API.
- **Database:** PostgreSQL via Prisma. *(Note: Prisma's primary client is Node/TS — if the Go backend owns the schema and migrations directly, consider whether Prisma is used only for schema modeling/migrations while Go's own SQL/ORM layer, e.g. `sqlc`, `pgx`, or `gorm`, handles runtime queries; if the intent is Prisma as the live query layer, that implies a Node service — flag this decision explicitly back to me before assuming an architecture, since it changes how the backend is structured.)*
- **Hosting assumption:** deployable as a static/SSR Next.js frontend + a small standalone Go API service, sharing one Postgres instance.

---

## Visual & interaction direction

This needs to feel alive, not like a static brochure — motion and responsiveness are the whole pitch, so the site itself should move.

- **Hero section:**
  - Large, bold headline (e.g., "Your body is the controller.") with a short supporting line.
  - An animated visual centerpiece: an SVG or canvas-based figure that reacts to scroll or cursor movement — a simple silhouette that jumps, ducks, or steps as the user scrolls past it, hinting at the gameplay without needing real gameplay footage.
  - Primary CTA: an email input + "Join the waitlist" button, visible without scrolling.
  - Subtle looping background motion (parallax obstacles or a runner-lane pattern) — tasteful, not distracting, respecting `prefers-reduced-motion`.

- **How it works section:**
  - 4 steps (step / jump / squat / burpee → lane change / jump / duck / slide), each revealed with a scroll-triggered animation (fade + slight translate, staggered).
  - Use simple animated line-art or icon-based illustrations for each movement, not stock photography.

- **Why it's different section:**
  - 3 short differentiator cards ("No hardware needed," "Your camera is the controller," "Real movement, real reps") with a light hover/tilt interaction on desktop, tap-feedback on mobile.

- **Social proof / traction section (see below):** placed after "why it's different," before the final CTA.

- **Final CTA section:** repeat the waitlist form, larger, with a live-updating headline like "Join X people already signed up."

- **Micro-interactions throughout:**
  - Button hover/press states with tactile feedback (scale/shadow shift).
  - Form field focus states that feel responsive, not default-browser.
  - Success state on signup should feel like a small win — a short celebratory animation or transition, not just a static "Thanks" text.

- **Responsiveness:** must be fully responsive mobile-first, since most traffic to a waitlist link (social/DM shares) will be on mobile. Desktop can have richer scroll-based animation; mobile should degrade gracefully to simpler fade/tap interactions rather than cutting features entirely.

- **Performance:** keep animations GPU-friendly (transform/opacity, not layout-triggering properties). This is a first impression page — it needs to load fast even with the animated hero.

---

## Traction-gain features (this is the growth engine, not just a form)

The site's job is not just "collect an email" — it should actively create shareability and urgency:

1. **Live signup counter** — show a real (or realistically incrementing) count of people on the waitlist, prominently near the CTA. Social proof drives conversion.
2. **Referral mechanic** — after signing up, give the user a unique referral link and a simple incentive framing ("move up the waitlist" or "unlock early access" for N referrals). Track referral counts per signup.
3. **Shareable moment on signup** — after submitting, show a simple, shareable graphic or pre-filled share text ("I just joined the InteractiveWorkout waitlist 🏃" with a link) for X/Twitter, WhatsApp, and copy-link. Fitness-adjacent audiences share aspirational/fun content easily — make this frictionless.
4. **Waitlist position (optional, discuss before building)** — showing someone "#482 on the waitlist" can boost both credibility and referral motivation (referring bumps you up). Only worth building if the referral mechanic above is in scope, since it's the same feature reused.
5. **Interest signal capture** — one optional field on signup: "What excites you most?" with 2–3 short options (e.g., "The game," "Getting fit without a gym," "Not sure yet, just curious"). Used later for messaging, not gatekeeping signup.
6. **Lightweight urgency, no fake countdowns** — avoid manipulative fake scarcity (fake countdown timers, "only 3 spots left"). It erodes trust fast and isn't necessary here — the live counter and referral mechanic are the honest version of urgency.

---

## Functional requirements

### Frontend (Next.js)
- Single-page app, App Router, one primary route (`/`).
- Waitlist form component: email input (required, client + server validated), optional interest-select, submit button, inline error/success states.
- Referral link generation and display after successful signup (from a token/slug returned by the backend).
- Share buttons (X/Twitter intent link, WhatsApp intent link, copy-to-clipboard) shown post-signup.
- Live counter component that fetches current signup count from the backend on load (and optionally polls or uses a lightweight real-time update — polling every 30–60s is enough, no need for websockets here).
- Fully responsive layout, Tailwind-based, mobile-first breakpoints.
- Respect `prefers-reduced-motion` — provide a non-animated fallback state for all scroll/hero animations.

### Backend (Go)
Expose a minimal REST API:
- `POST /api/waitlist` — accepts `{ email, interest?, referredBy? }`, validates email format, checks for duplicates, creates a signup record, generates a unique referral code, returns `{ referralCode, position? }`.
- `GET /api/waitlist/count` — returns the current total signup count (for the live counter).
- `GET /api/waitlist/:referralCode` *(optional, only if referral tracking is in scope)* — returns referral count for a given code, to show "X people joined through your link."
- Basic rate limiting on the signup endpoint to prevent spam submissions.
- CORS configured to allow the Next.js frontend origin.

### Database (Postgres / Prisma schema)
Minimal schema to start:

```prisma
model WaitlistSignup {
  id           String   @id @default(cuid())
  email        String   @unique
  interest     String?
  referralCode String   @unique
  referredBy   String?
  createdAt    DateTime @default(now())
}
```

- `referralCode`: short unique slug generated per signup, used both to build the user's shareable link and to attribute referrals.
- `referredBy`: stores the referral code of whoever referred this signup, if any — enables a simple referral-count query (`count(*) where referredBy = X`).
- Keep this schema minimal for v1; don't add auth, roles, or unrelated tables — this is a waitlist, not the product database.

---

## Explicit constraints

- No login/accounts, no payments, no gameplay — this is the pre-launch teaser site only.
- No multi-page navigation, blog, or FAQ in v1.
- No fake scarcity or countdown timers.
- Keep the visual language consumer/fitness/gaming — do not foreground the physical-therapy or clinical angle on this page.
- Animations must degrade gracefully for `prefers-reduced-motion` and on low-end mobile devices.

---

## Deliverable

A working Next.js frontend + Go backend + Postgres/Prisma schema that:
1. Renders the full page described above with working scroll/hover animations.
2. Successfully accepts a waitlist signup end to end (form → Go API → Postgres).
3. Displays a live signup count.
4. Generates and displays a referral link with working share actions after signup.
5. Is fully responsive and passes a basic mobile usability check.

If any part of the stack decision (especially the Prisma-in-a-Go-backend question above) needs to be resolved differently than assumed here, surface that before proceeding rather than guessing silently.
