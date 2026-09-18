"use client";

import { useReveal } from "./useReveal";
import type { ReactNode } from "react";

interface Step {
  title: string;
  moves: string;
  icon: ReactNode;
}

function IconJump() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 36h9m14 0h9M18 40V28h12v12M24 22V7m-7 7 7-7 7 7" />
      <path d="M8 26c0-8 4-13 9-16m23 16c0-8-4-13-9-16" opacity="0.5" />
    </svg>
  );
}

function IconStep() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 24h34M14 17l-7 7 7 7m20-14 7 7-7 7" />
      <path d="M16 7v5m16-5v5M16 36v5m16-5v5M24 6v8m0 20v8" opacity="0.5" />
    </svg>
  );
}

function IconSquat() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 20V8h32v12M24 15v17m-7-7 7 7 7-7M14 40h20" />
      <path d="M8 28v12m32-12v12" opacity="0.5" />
    </svg>
  );
}

function IconBurpee() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m27 5-15 22h11l-2 16 15-23H25l2-15Z" />
      <path d="M7 12h8M5 19h5m28 10h5m-9 7h7" opacity="0.5" />
    </svg>
  );
}

const STEPS: Step[] = [
  {
    title: "Lane Shift",
    moves: "Step side-to-side to switch lanes",
    icon: <IconStep />,
  },
  {
    title: "Jump",
    moves: "Leap over hurdles and pits",
    icon: <IconJump />,
  },
  {
    title: "Squat",
    moves: "Drop low to clear barriers",
    icon: <IconSquat />,
  },
  {
    title: "Burpee",
    moves: "Explode up for high-speed turbo boosts",
    icon: <IconBurpee />,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-5xl px-6 py-24">
      <Reveal>
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          Move in real life.{" "}
          <span className="text-lime">Play in the game.</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-zinc-400">
          Your camera reads your movement — every rep is an input.
        </p>
      </Reveal>
      <ol className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <Reveal delay={index * 120} className="tilt-card h-full rounded-2xl border border-white/10 bg-night-soft/80 p-6 backdrop-blur-sm hover:border-lime/40">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-lime/20 bg-lime/10 text-lime">{step.icon}</div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Step {index + 1}
              </p>
              <h3 className="mt-1 text-lg font-bold">{step.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">→ {step.moves}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ ["--reveal-delay" as string]: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
