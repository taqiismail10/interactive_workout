"use client";

import { HowItWorks, Reveal } from "@/components/HowItWorks";
import { Runner } from "@/components/Runner";
import { LiveCounter } from "@/components/LiveCounter";
import { WaitlistForm } from "@/components/WaitlistForm";
import { useReferral } from "@/components/useReferral";

const DIFFERENTIATORS = [
  {
    title: "Zero hardware barrier",
    body: "No VR headset, no balance board, no wearables. A phone or laptop with a camera is all you need.",
    icon: <IconNoHardware />,
  },
  {
    title: "Movement becomes input",
    body: "Camera-powered pose estimation translates your jumps, squats, and lane shifts into game controls. Just you, in motion.",
    icon: <IconCamera />,
  },
  {
    title: "A workout that feels like gaming",
    body: "Chase the next high score, not the clock. Real jumps, real squats, and an endless runner that keeps you moving.",
    icon: <IconGame />,
  },
];

function IconNoHardware() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 27v-8a8 8 0 0 1 8-8h12a8 8 0 0 1 8 8v8M16 11V7h16v4M8 8l32 32" />
      <path d="M11 32h8l5-5 5 5h8M16 38h16" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="6" y="14" width="24" height="20" rx="4" />
      <path d="M30 21 L42 15 L42 33 L30 27" />
      <circle cx="18" cy="24" r="4" />
    </svg>
  );
}

function IconGame() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 15h18c5 0 7 5 8 11l1 6c1 5-4 7-7 3l-4-5H17l-4 5c-3 4-8 2-7-3l1-6c1-6 3-11 8-11Z" />
      <path d="M16 20v8m-4-4h8m10-3h.01M35 26h.01M21 9h6" />
    </svg>
  );
}

export default function Home() {
  const referredBy = useReferral();
  return (
    <main className="flex-1">
      <Hero referredBy={referredBy} />
      <HowItWorks />
      <Differentiators />
      <FinalCta referredBy={referredBy} />
    </main>
  );
}

function Hero({ referredBy }: { referredBy: string | null }) {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-x-8 gap-y-4 px-6 pb-12 pt-8 md:grid-cols-2 md:gap-y-6 md:py-16 lg:grid-cols-[1.2fr_1fr] lg:py-24">
        <div className="min-w-0 md:col-start-1 md:row-start-1">
          <p className="inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-lime">
            <span className="h-1.5 w-1.5 rounded-full bg-lime pulse-ring" />
            Beta Roster Open
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-7xl">
            Your body is{" "}
            <span className="text-lime">the controller.</span>
          </h1>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-zinc-300 lg:mt-5 lg:text-lg">
            An endless runner powered by you — jump, squat, and dodge using your
            camera. No hardware needed.
          </p>
        </div>
        <Runner className="w-full md:col-start-2 md:row-span-2 md:row-start-1" />
        <div className="min-w-0 md:col-start-1 md:row-start-2">
          <WaitlistForm referredBy={referredBy} />
          <LiveCounter className="mt-4" />
        </div>
      </div>
    </section>
  );
}

function Differentiators() {
  return (
    <section id="why" className="mx-auto w-full max-w-5xl px-6 py-24">
      <Reveal>
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          Why it&apos;s different
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-zinc-400">
          Most fitness games sell you gear. This one just needs you.
        </p>
      </Reveal>
      <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
        {DIFFERENTIATORS.map((item, index) => (
          <Reveal key={item.title} delay={index * 120}>
            <div className="tilt-card h-full rounded-2xl border border-white/10 bg-night-soft/80 p-6 backdrop-blur-sm hover:border-lime/40">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-lime/20 bg-lime/10 text-lime">{item.icon}</div>
              <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FinalCta({ referredBy }: { referredBy: string | null }) {
  return (
    <section id="join" className="relative overflow-hidden px-6 py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_20rem_at_50%_100%,rgba(200,245,66,0.15),transparent_70%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <Reveal>
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
            Ready to <span className="text-lime">run?</span>
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Join the first wave of Founding Athletes. Secure your place on the roster and invite a runner to move up the list.
          </p>
        </Reveal>
        <Reveal delay={120} className="mt-8 flex w-full flex-col items-center">
          <LiveCounter />
          <div className="mt-6 flex w-full justify-center">
            <WaitlistForm referredBy={referredBy} compact />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
