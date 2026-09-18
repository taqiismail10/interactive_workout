# InteractiveWorkout — Visual Consistency Audit (Post-Update Review)

Tested at **Desktop (1440px)**, **Tablet (768px)**, and **Mobile (375px)** following Union Alpha's redesign submission.

---

## Executive Scorecard: Claims vs. Reality

| Union Alpha Claim | Verified in Code & Browser | Status | Reality / Finding |
| :--- | :---: | :---: | :--- |
| **"Brand mark rendered in Runner.tsx, stick-figure SVG removed"** | `web/src/components/Runner.tsx` | ⚠️ **Partial** | The logo PNG (`hero-logo.png`) replaced the SVG, but the running lane dashes (`.lane`) are detached and offset to the left of the figure. |
| **"Hero floating bob animation"** | `web/src/app/page.tsx` & `globals.css` | ❌ **Failed** | Union Alpha removed the `.bob` class from `<Runner className="w-full" />`. The hero graphic is **completely static**. |
| **"Favicon replaced with Micro Logo PNG"** | `web/src/app/icon.png` | ⚠️ **Defect** | Union Alpha deleted `web/src/app/favicon.ico`. Direct requests to `/favicon.ico` return **404 Not Found**. |
| **"Hero constrained on mobile (max-w-[12rem], mt-8 mb-4)"** | `web/src/components/Runner.tsx` | ❌ **Failed** | Due to tall form elements above it, the runner graphic is pushed below the fold on mobile (375px). Only the top 10px of the head is visible initially. |
| **"How it works: Squat now describes squatting (removed duck mismatches)"** | `web/src/components/HowItWorks.tsx:65` | ❌ **False** | Line 65 still literally reads `moves: "Duck under barriers"`. Copy was **not** updated. |
| **"Differentiators: emojis replaced with custom SVG icons matching stroke style"** | `web/src/app/page.tsx:27-53` | ⚠️ **Inconsistent** | Emojis were replaced, but by thin line icons (phone with slash, camcorder box, zigzag line) that clash with the wireframe stick figures in "How it works". |
| **"Mobile nav: logo + Join pill only (no hamburger)"** | `web/src/components/Nav.tsx` |  **Passed** | Works as specified. |
| **"Form touch targets ≥ 44px on mobile, proper labels & aria"** | `web/src/components/WaitlistForm.tsx` |  **Passed** | Implemented properly. |

---

## Desktop Visual Verification (1440px)

````carousel
![Desktop — Hero Section](C:/Users/taqii/.gemini/antigravity-ide/brain/2a7c6b24-d9ec-4c97-87bc-f167aeb62962/desktop_hero_section_1789666878817.png)
<!-- slide -->
![Desktop — How It Works & Differentiators](C:/Users/taqii/.gemini/antigravity-ide/brain/2a7c6b24-d9ec-4c97-87bc-f167aeb62962/desktop_how_and_why_section_1789666894852.png)
<!-- slide -->
![Desktop — Differentiator Cards & CTA](C:/Users/taqii/.gemini/antigravity-ide/brain/2a7c6b24-d9ec-4c97-87bc-f167aeb62962/desktop_why_cards_and_footer_1789666909765.png)
<!-- slide -->
![Desktop — Footer](C:/Users/taqii/.gemini/antigravity-ide/brain/2a7c6b24-d9ec-4c97-87bc-f167aeb62962/desktop_footer_section_1789666926916.png)
````

---

## Tablet & Mobile Visual Verification

````carousel
![Tablet — Hero Dead Space (768px)](C:/Users/taqii/.gemini/antigravity-ide/brain/2a7c6b24-d9ec-4c97-87bc-f167aeb62962/tablet_hero_section_1789666967565.png)
<!-- slide -->
![Tablet — Card Grids (768px)](C:/Users/taqii/.gemini/antigravity-ide/brain/2a7c6b24-d9ec-4c97-87bc-f167aeb62962/tablet_cards_section_1789666986349.png)
<!-- slide -->
![Mobile — Hero Above-the-Fold (375px)](C:/Users/taqii/.gemini/antigravity-ide/brain/2a7c6b24-d9ec-4c97-87bc-f167aeb62962/mobile_hero_section_1789667019945.png)
<!-- slide -->
![Mobile — Runner Cutoff & Track Misalignment (375px)](C:/Users/taqii/.gemini/antigravity-ide/brain/2a7c6b24-d9ec-4c97-87bc-f167aeb62962/mobile_runner_overflow_1789667041063.png)
<!-- slide -->
![Mobile — How It Works (375px)](C:/Users/taqii/.gemini/antigravity-ide/brain/2a7c6b24-d9ec-4c97-87bc-f167aeb62962/mobile_how_it_works_1789667059825.png)
<!-- slide -->
![Mobile — Why Different & Final CTA (375px)](C:/Users/taqii/.gemini/antigravity-ide/brain/2a7c6b24-d9ec-4c97-87bc-f167aeb62962/mobile_why_section_1789667084318.png)
<!-- slide -->
![Mobile — Footer Padding (375px)](C:/Users/taqii/.gemini/antigravity-ide/brain/2a7c6b24-d9ec-4c97-87bc-f167aeb62962/mobile_footer_section_1789667107143.png)
````

---

## Persisting Inconsistencies & Defects

### 1. Mobile Hero: Visual Cutoff & Track Disconnection (Critical)
* **What happens**: On a standard 375x812 viewport, the hero section is vertically overcrowded (badge + 3-line heading + subhead + 2-row form + select + counter). As a result, the runner logo is pushed almost completely past the first viewport fold — only a 10px sliver of the lime head is visible at the bottom edge.
* **Track Disconnection**: The running lane dashes (`.lane`) in [`Runner.tsx`](file:///f:/Project/interactive_workout/web/src/components/Runner.tsx#L25-L31) are pinned to `bottom-0` and horizontally centered in the container, while the logo image has distinct proportions. This makes the dashes appear off-center to the bottom-left, with the figure floating detached in space rather than running on the track.
* **Fix**: Scale the hero padding/typography appropriately on mobile, vertically align or anchor the runner graphic so it frames the screen, and align the track dashes directly beneath the runner's feet (or replace them with an integrated glowing ground ellipse).

---

### 2. Tablet (768px): Empty Void & Layout Collapse (High)
* **What happens**: The hero grid collapses from 2 columns to 1 column below `lg` (1024px). On a 768px tablet, this creates an enormous empty black gap between the form and the runner figure, pushing the runner's legs past the viewport fold.
* **Fix**: Use a 2-column layout on `md` screens (`md:grid-cols-2 lg:grid-cols-[1.2fr_1fr]`) or reduce vertical spacing and center the visual lockup cleanly.

---

### 3. Step Card Copy: "Squat" Still Reads "Duck under barriers" (High)
* **What happens**: Union Alpha stated that copy mismatches were resolved. However, in [`HowItWorks.tsx`](file:///f:/Project/interactive_workout/web/src/components/HowItWorks.tsx#L63-L67):
  ```tsx
  {
    title: "Squat",
    moves: "Duck under barriers",
    icon: <IconSquat />,
  }
  ```
* **Fix**: Update `moves` to `"Power through low obstacles"` or `"Drop low to clear barriers"`. In fitness terminology, squatting is about leg strength and posture, not "ducking".

---

### 4. Floating Animation Was Stripped Out (High)
* **What happens**: The `@keyframes float-bob` and `.bob` utility exist in [`globals.css`](file:///f:/Project/interactive_workout/web/src/app/globals.css#L35-L38), but Union Alpha removed `bob` from `Runner` in [`page.tsx`](file:///f:/Project/interactive_workout/web/src/app/page.tsx#L89-L91) and did not add it in `Runner.tsx`. The brand mark is completely static.
* **Fix**: Re-apply `.bob` to the runner container or the `<Image>` in `Runner.tsx` (wrapped in `motion-safe:`).

---

### 5. Icon System Fragmentation (High)
* **What happens**:
  - **"How It Works"** (4 cards): Uses wireframe outline stick-figure runners (`IconStep`, `IconJump`, `IconSquat`, `IconBurpee`).
  - **"Why It's Different"** (3 cards): Uses thin line icons (`IconNoHardware` crossed phone, `IconCamera` video box, `IconReps` zigzag ECG/wave).
  - The brand's actual visual asset language in `visual_stuffs/Workout Category Icons.png` and `Game - Activity Icons.png` uses circular glowing badges with filled athletic silhouettes. The current wireframe stick-figures and thin line icons look like two completely different icon sets picked at random.
* **Fix**: Standardize all card icons: place them in consistent rounded badges (`h-12 w-12 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center text-lime`) and ensure matching stroke weight (`strokeWidth="2"` or `"2.5"`) and visual metaphors.

---

### 6. Missing `favicon.ico` Generates 404 Errors (Medium)
* **What happens**: Union Alpha deleted `web/src/app/favicon.ico` and added `src/app/icon.png`. Direct browser requests to `http://localhost:3000/favicon.ico` return **404 Not Found**.
* **Fix**: Ensure `favicon.ico` or a proper Next.js root favicon route exists in `web/src/app/` or `web/public/favicon.ico`.

---

### 7. Nav Link Text Does Not Match Section Heading (Medium)
* **What happens**: In [`Nav.tsx`](file:///f:/Project/interactive_workout/web/src/components/Nav.tsx#L30):
  Nav link text: `"Why different"`
  Heading in [`page.tsx`](file:///f:/Project/interactive_workout/web/src/app/page.tsx#L101): `"Why it's different"`
* **Fix**: Update the nav link text to `"Why it's different"`.

---

### 8. Live Counter Lacks Social Proof Polish (Medium)
* **What happens**: In [`LiveCounter.tsx`](file:///f:/Project/interactive_workout/web/src/components/LiveCounter.tsx#L33-L37), the counter renders as unstyled plain text:
  `1 person already signed up`
  It lacks the fire badge (`🔥`), pulse indicator, or game-like styling specified in the prompt.
* **Fix**: Wrap in an inline pill badge with a pulsing lime live indicator and polished micro-copy.

---

### 9. Hero Form Desktop Alignment (Medium)
* **What happens**: The email input and "Join the waitlist" button form a row, but the "What excites you most?" select dropdown sits below it left-aligned, creating an uneven L-shape on desktop.
* **Fix**: Integrate the interest selector seamlessly or balance the form grid so it feels like a unified unit.

---

### 10. Footer Vertical Spacing (Low)
* **What happens**: [`layout.tsx`](file:///f:/Project/interactive_workout/web/src/app/layout.tsx#L49) still uses `py-8`, leaving the footer cramped on mobile.
* **Fix**: Change to `py-12` or `py-10`.

---

## Action Plan
Feed the targeted follow-up prompt to Union Alpha to resolve these 10 items in a single, clean pass.
