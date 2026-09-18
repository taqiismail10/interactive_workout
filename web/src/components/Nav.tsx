"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-white/10 bg-night/80 backdrop-blur-md transition-shadow ${
        scrolled ? "shadow-[0_1px_15px_rgba(200,245,66,0.12)]" : ""
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-95"
          aria-label="InteractiveWorkout Home"
        >
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
            <Image
              src="/logo-icon.png"
              alt="InteractiveWorkout Logo"
              width={32}
              height={32}
              priority
              className="h-7 w-7 object-contain drop-shadow-[0_0_12px_rgba(200,245,66,0.35)] transition-transform motion-safe:group-hover:scale-105"
            />
          </div>
          <span className="font-brand text-base font-bold italic tracking-tight sm:text-lg">
            <span className="text-white transition-colors group-hover:text-white">Interactive</span>
            <span className="text-lime transition-colors group-hover:text-lime-soft">Workout</span>
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm" aria-label="Main">
          <a href="#how-it-works" className="hidden text-zinc-400 transition hover:text-white sm:block">
            How it works
          </a>
          <a href="#why" className="hidden text-zinc-400 transition hover:text-white sm:block">
            Why it&apos;s different
          </a>
          <a
            href="#join"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-lime px-5 py-2 font-bold text-night transition hover:bg-lime-soft motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]"
          >
            <span className="hidden sm:inline">Join waitlist</span>
            <span className="sm:hidden">Join</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
