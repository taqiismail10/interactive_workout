# PRD — InteractiveWorkout Waitlist Website

**Owner:** Jarif (CEO & co-founder)
**Status:** Draft v1
**Scope:** A single, basic marketing website whose only job is to explain the product in one screen and collect waitlist signups.

---

## 1. Problem & goal

There's no public-facing surface for InteractiveWorkout yet. Before the game or any clinical layer is ready, we need a way to:
- Explain the idea in a few seconds to someone who's never heard of it.
- Capture interest (email signups) so there's a list to reach out to when a playable build exists.
- Start collecting a rough signal on who's interested (consumer vs. someone reacting to the PT angle), without overbuilding.

**Goal:** ship a single-page site that gets someone from "what is this" to "I signed up" in under a minute, with minimal engineering effort.

**Non-goal:** this is not the product. No gameplay, no accounts, no dashboard, no payment. Just a landing page and a list.

---

## 2. Target audience

Two loose segments will land here, and the copy should speak to both without forking into two separate pages:
1. **Curious early adopters** — people who see "move your body to play a game" and think it's cool.
2. **PT-adjacent / clinically curious** — people who see the physical-therapy angle and are interested for recovery/rehab reasons.

The page doesn't need to fully commit to one framing yet — keep it broad ("an interactive workout game," not "a PT product") since we haven't validated which framing converts better.

---

## 3. Scope — what's in v1

### 3.1 Page sections
1. **Hero** — one-line value prop, a short supporting line, and the primary CTA (email capture).
2. **How it works** — 3–4 step visual explainer (e.g., "move your body → the game reacts → jump, duck, dodge in real life"). Can reuse the movement-to-input mapping table from the product doc, simplified into icons/short labels.
3. **Why it's different** — 2–3 short points (no hardware needed, real movement not a controller, works from your phone/laptop camera). Keep it to a sentence each.
4. **Waitlist form** — email input + submit. Placed in the hero and repeated once more near the bottom of the page.
5. **Footer** — basic links (contact/social if applicable), copyright.

### 3.2 Waitlist form requirements
- **Fields:** email (required). Optionally, one soft-signal field — e.g., a single-select "What are you most interested in?" (General fitness / Physical therapy or recovery / Just curious). Keep it to one extra field max — every additional field lowers conversion.
- **On submit:** show a clear confirmation state (inline message or redirect to a thank-you state) — no dead-end silent submits.
- **Storage:** emails need to land somewhere usable (a simple database table, or a third-party waitlist/email tool) — final choice is an implementation detail, not a product requirement, but it must be exportable as a list.
- **No duplicate spam protection needed for v1** beyond basic email format validation. Don't over-engineer this.

### 3.3 Content needed before build
- Final one-line value prop and supporting line (copy).
- 3–4 short "how it works" steps.
- 2–3 differentiator lines.
- Any visual asset (the movement/pose illustration style already used in the internal one-pager can likely be adapted).

---

## 4. Out of scope for v1

- Multi-page site / navigation.
- Blog, FAQ, press page.
- Any login, account, or user dashboard.
- Payment or pricing of any kind.
- Mobile app links (there is no app yet).
- Therapist-facing content (the clinical service layer is deprioritized per the product doc — don't build a page around it yet).
- Analytics beyond basic signup counting (can add a simple pageview/conversion tracker, but no need for a full analytics stack).

---

## 5. Platform & technical notes

- **Desktop-first, must still work on mobile** — this is a marketing page, not the game itself, so unlike the product build, this needs to be responsive from day one. Most early traffic to a waitlist link (social, DMs) will be on mobile.
- Single static page is sufficient — no need for a full app framework unless the team already has a preferred stack to reuse.
- Keep the build fast and simple; this should be a days-not-weeks effort. It's a placeholder for interest, not the product.

---

## 6. Success metrics

Since this is just a waitlist page, keep measurement minimal:
- **Primary:** number of email signups.
- **Secondary (if the optional interest field is included):** rough split between "general fitness" vs. "PT/recovery" interest — useful signal for which framing to lean into later.
- No conversion-rate target set yet; first goal is just to get the page live and start collecting signal.

---

## 7. Open questions

- Do we want the optional "what are you interested in" field in v1, or keep the form to just email for maximum conversion, and ask this later via a follow-up email instead?
- Where should signups land — a simple hosted waitlist tool (fastest to ship) vs. our own database (more control, reusable later for the real product's auth)?
- Any name/domain decided yet, or is this still under the working title?

---

## 8. Definition of done

- Page is live at a public URL.
- Hero, how-it-works, differentiators, and waitlist form are all present and match approved copy.
- Form submission successfully stores an email and shows a confirmation state.
- Page is responsive and usable on mobile and desktop.
- Signups are exportable as a list.
