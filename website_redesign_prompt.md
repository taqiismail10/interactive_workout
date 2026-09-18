# InteractiveWorkout — Style & Theme Polish Prompt (Structure Locked)

> **Directive**: Update the **style, theme, and visual polish** of the InteractiveWorkout waitlist landing page based on the current desktop screenshots. **DO NOT change the existing structure, sections, or content layout.** Keep all headings, card titles, sections, and flows exactly as shown in the screenshots, but elevate the theme, fix visual inconsistencies, and make the design feel cohesive, premium, and dynamic.
> **Tech Stack**: Next.js 16 (App Router), Tailwind CSS v4, TypeScript.
> **Target Directory**: `web/` only (API untouched).

---

## 1. Ground Rules: Structure is Locked

Do **NOT** add new sections, do **NOT** reorder sections, and do **NOT** rewrite the headline or core copy. The structure captured in the screenshots is locked:

1. **Sticky Nav**: Logo (`InteractiveWorkout`) · `How it works` · `Why it's different` · `[Join waitlist]` pill button (mobile: Logo + `[Join]` pill).
2. **Hero**:
   - `COMING SOON` pulsing pill badge
   - H1: `Your body is the controller.` (`the controller.` in lime)
   - Subhead: `An endless runner powered by you — jump, squat, and dodge with your camera.`
   - Form: Email input + `[Join the waitlist]` button
   - Selector: `What excites you most?` + `<select>` dropdown
   - Counter: Live athlete counter
   - Right Column: Brand runner mark with floating motion & ground track
3. **"How It Works"**:
   - Heading: `Move in real life. Play in the game.` (`Play in the game.` in lime)
   - Subhead: `Your camera reads your movement — every rep is an input.`
   - 4 Step Cards:
     - `Step 1`: **Step** → `→ Shift lanes in the game`
     - `Step 2`: **Jump** → `→ Jump over obstacles`
     - `Step 3`: **Squat** → `→ Drop low to clear barriers` *(fix the copy from "duck under barriers" to accurate squat terminology)*
     - `Step 4`: **Burpee** → `→ Earn a burst of speed`
4. **"Why It's Different"**:
   - Heading: `Why it's different`
   - Subhead: `Most fitness games sell you gear. This one just needs you.`
   - 3 Cards:
     - `No hardware needed` → `No headset, no ring, no treadmill. If you have a phone or laptop, you have the full game.`
     - `Your camera is the controller` → `Pose estimation reads your real movement through your front camera. Nothing extra to buy or set up.`
     - `Real movement, real reps` → `Jumps are jumps. Squats are squats. You finish the run having actually moved — that's the point.`
5. **Final CTA ("Ready to run?")**:
   - Heading: `Ready to run?` (`run?` in lime)
   - Subhead: `Early access goes to the top of the list. Literally.`
   - Live counter + Email waitlist form
6. **Footer**:
   - Minimal copyright + `hello@interactiveworkout.com` contact email.

---

## 2. Style & Theme Upgrades (What to Fix & Polish)

Update the styling and theme to match the sleek dark cyberpunk sports-tech aesthetic from the screenshots and brand assets (`visual_stuffs/`):

### A. Theme Colors & Atmosphere
- **Base Background**: Deep near-black `#0B0B12`.
- **Atmospheric Glow**: Rich radial ambient glow effects (soft electric lime `#C8F542` glow at bottom-left/center, subtle violet `#8B7BFF` depth highlight at upper-right) with clean vignette falloff.
- **Card Surfaces**: Sleek dark glass (`bg-[#131320]/80` or `bg-night-soft/70 border border-white/10 backdrop-blur-md`).
- **Accent**: Pure electric lime `#C8F542` with soft highlight `#E2FF7A`.

### B. Hero Section Polish (`Runner.tsx` & `page.tsx`)
1. **Restore Floating Animation**:
   - In `web/src/components/Runner.tsx`, apply the `bob` animation (`motion-safe:bob` using `@keyframes float-bob` in `globals.css`: 5s ease-in-out infinite `translateY(-1rem)`) to the runner image. The brand mark must float smoothly, not sit frozen.
2. **Align Ground Track & Runner**:
   - The `.lane` dashes currently sit at `bottom-0` and are horizontally displaced to the bottom-left, while the runner figure is to the right.
   - Either center the animated lane dashes directly beneath the runner figure's feet, OR anchor the runner with a glowing ground-plane ellipse (`h-6 w-48 rounded-[100%] bg-lime/20 blur-md mx-auto mt-2`) so the figure looks grounded and anchored on a glowing track.
   - Ensure the runner has its glowing drop-shadow: `drop-shadow-[0_0_40px_rgba(200,245,66,0.22)]`.
3. **Mobile (375px) Viewport Sizing**:
   - The hero content currently pushes the runner graphic off-screen on mobile.
   - Tighten mobile paddings (`pt-8 pb-10` on mobile) and scale the typography (`text-4xl sm:text-6xl lg:text-7xl`) so the headline, form, and runner figure fit gracefully into the initial mobile screen without cutting the runner's head in half at the fold.
4. **Tablet (768px) Dead Space**:
   - Keep a 2-column layout on tablet (`md:grid-cols-2 lg:grid-cols-[1.2fr_1fr]`) so the runner sits to the right of the form instead of collapsing into a single column with a massive black void.

### C. Form & Live Counter Polish (`WaitlistForm.tsx` & `LiveCounter.tsx`)
1. **Interest Select Dropdown**:
   - Polish the dropdown layout: seamless rounded-full dark glass border (`border-white/10 bg-black/40 px-4 py-2 text-xs text-zinc-300 focus:border-lime/60`), cleanly aligned with the form.
2. **Live Counter Styling**:
   - Don't render as unstyled plain text (`1 person already signed up`).
   - Style it as a sleek glowing status pill:
     ```tsx
     <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-zinc-300">
       <span className="relative flex h-2 w-2">
         <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
         <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
       </span>
       <span>
         <strong className="text-lime font-mono">{count > 0 ? count.toLocaleString() : "1"}</strong> {count === 1 ? "athlete" : "athletes"} already signed up
       </span>
     </div>
     ```

### D. Icon System Cohesion (`HowItWorks.tsx` & `page.tsx`)
- Currently, "How It Works" uses wireframe stick figures while "Why It's Different" uses generic thin geometric line boxes. They feel like two unrelated icon sets.
- **Harmonize the icon system across both sections**:
  - Place every icon inside a matching sports-tech badge container:
    `h-12 w-12 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center text-lime mb-4`
  - Use unified stroke aesthetics: `stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"`
  - "How It Works" icons: Step, Jump, Squat, Burpee (movement actions).
  - "Why It's Different" icons: No Hardware (phone with slash), Camera Controller (lens/camera), Real Movement (athletic pulse/reps).
- Ensure cards in both sections share the same `tilt-card` hover interaction (`hover:border-lime/30 hover:shadow-[0_1rem_2.5rem_rgba(200,245,66,0.08)]`).

### E. Copy Bug Fix in `HowItWorks.tsx`
In `web/src/components/HowItWorks.tsx` line 65:
- Change:
  ```tsx
  {
    title: "Squat",
    moves: "Duck under barriers",
    icon: <IconSquat />,
  }
  ```
  to:
  ```tsx
  {
    title: "Squat",
    moves: "Drop low to clear barriers",
    icon: <IconSquat />,
  }
  ```

### F. Navigation & Header Synchronization (`Nav.tsx`)
- Line 30: Change nav link from `"Why different"` to `"Why it's different"` so it matches the section heading exactly.
- Keep mobile nav clean: Logo + compact lime `[Join]` pill button.

### G. Technical Fixes
1. **Restore `favicon.ico`**:
   - Provide a valid `favicon.ico` in `web/public/favicon.ico` or `web/src/app/favicon.ico` alongside `icon.png` so direct browser/crawler requests to `/favicon.ico` do not 404.
2. **Footer Spacing**:
   - Increase footer padding in `web/src/app/layout.tsx` to `py-12` so the copyright and contact email have clean breathing room on mobile.

---

## 3. Checklist for Verification

After applying these style and theme updates:
1. `npm run lint` passes without warnings.
2. `tsc --noEmit` passes with 0 errors.
3. `npm run build` succeeds cleanly.
4. On `http://localhost:3000`:
   - Hero brand mark floats smoothly with a 5s bob animation.
   - Runner figure sits naturally over an aligned ground track / glowing ground plane.
   - At 375px (mobile), the hero headline, form, and runner mark fit harmoniously above the fold without truncation.
   - At 768px (tablet), hero maintains a balanced 2-column layout without empty black dead space.
   - Card icons in both "How It Works" and "Why It's Different" share the same glowing badge container and stroke weight.
   - Step 3 copy reads "Drop low to clear barriers".
   - Live counter displays as a styled live beacon pill.
   - Direct requests to `/favicon.ico` return 200 OK.
