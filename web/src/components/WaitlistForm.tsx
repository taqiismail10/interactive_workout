"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  INTEREST_OPTIONS,
  referralUrl,
  signup,
  type InterestValue,
  type SignupSuccess,
} from "@/lib/api";
import { ShareButtons } from "./ShareButtons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface WaitlistFormProps {
  referredBy: string | null;
  compact?: boolean;
}

export function WaitlistForm({ referredBy, compact = false }: WaitlistFormProps) {
  const id = useId();
  const emailId = `${id}-email`;
  const interestId = `${id}-interest`;
  const errorId = `${id}-error`;
  const referralId = `${id}-referral`;
  const successRef = useRef<HTMLHeadingElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState<InterestValue>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SignupSuccess | null>(null);
  const [invalidEmail, setInvalidEmail] = useState(false);

  useEffect(() => {
    if (result) successRef.current?.focus();
  }, [result]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized) || normalized.length > 254) {
      setInvalidEmail(true);
      setError("Enter a valid email address.");
      emailRef.current?.focus();
      return;
    }
    setInvalidEmail(false);
    setError(null);
    setSubmitting(true);
    try {
      const success = await signup(normalized, interest, referredBy);
      setResult(success);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="relative w-full max-w-md rounded-2xl border border-lime/30 bg-night-soft/90 p-6 text-center shadow-[0_0_60px_rgba(200,245,66,0.08)]">
        <Confetti />
        <div className="pop-in relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-lime/40 bg-lime/10 text-lime" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m8 3 4 5 4-5M7 3h10" />
            <circle cx="12" cy="14" r="7" />
            <path d="m9 14 2 2 4-4" />
          </svg>
        </div>
        <p id={`${id}-badge`} className="mt-4 inline-flex items-center gap-2 rounded-full border border-lime/40 bg-lime/10 px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-lime">
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
              clipRule="evenodd"
            />
          </svg>
          Founding Athlete Registered
        </p>
        <h3
          ref={successRef}
          tabIndex={-1}
          aria-describedby={`${id}-badge ${id}-position`}
          className="pop-in mt-3 text-xl font-bold text-lime outline-none"
          style={{ animationDelay: "80ms" }}
        >
          You&apos;re in!
        </h3>
        <p id={`${id}-position`} className="mt-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-300">
          Waitlist position{" "}
          <span className="font-mono text-base font-bold text-white">#{result.position}</span>
        </p>
        <p className="mt-4 text-xs uppercase tracking-widest text-zinc-400" id={referralId}>
          Your referral link — share it to move up
        </p>
        <input
          type="text"
          readOnly
          value={referralUrl(result.referralCode)}
          aria-labelledby={referralId}
          onFocus={(e) => e.currentTarget.select()}
          className="mt-2 min-h-[44px] w-full select-text cursor-text rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-lime outline-none transition-colors focus:border-lime focus:ring-2 focus:ring-lime/30"
        />
        <div className="mt-4 flex justify-center">
          <ShareButtons result={result} />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md" aria-label="Join the waitlist" aria-busy={submitting} aria-describedby={error ? errorId : undefined} noValidate>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor={emailId}>
          Email address
        </label>
        <input
          ref={emailRef}
          id={emailId}
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (invalidEmail) {
              setInvalidEmail(false);
              setError(null);
            }
          }}
          className={`min-h-[48px] min-w-0 flex-1 rounded-full border bg-black/40 px-5 py-3 text-white placeholder:text-zinc-500 outline-none transition focus:ring-2 focus:ring-lime/30 ${
            invalidEmail
              ? "border-red-500/60 focus:border-red-400"
              : "border-white/15 focus:border-lime"
          }`}
          aria-invalid={invalidEmail ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <button
          type="submit"
          disabled={submitting}
          className="min-h-[48px] rounded-full bg-lime px-7 py-3 font-bold text-night shadow-[0_0_20px_rgba(200,245,66,0.25)] transition-colors hover:bg-lime-soft motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Joining…" : compact ? "Join" : "Join the waitlist"}
        </button>
      </div>
      {!compact && (
        <div className="mt-3 flex items-center gap-2">
          <label
            htmlFor={interestId}
            className="max-w-28 shrink-0 text-left text-xs leading-relaxed text-zinc-400 sm:max-w-none"
          >
            What excites you most?
          </label>
          <select
            id={interestId}
            value={interest}
            onChange={(e) => setInterest(e.target.value as InterestValue)}
            className="min-h-[44px] min-w-0 flex-1 cursor-pointer appearance-none rounded-full border border-white/10 bg-black/30 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2012%208%22%3E%3Cpath%20d%3D%22M1%201l5%205%205-5%22%20fill%3D%22none%22%20stroke%3D%22%23a1a1aa%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65rem] bg-[position:right_1rem_center] bg-no-repeat px-4 py-2 pr-9 text-xs text-zinc-300 outline-none transition focus:border-lime/60 sm:w-auto sm:flex-1"
          >
            <option value="" className="bg-night">Choose an interest (optional)</option>
            {INTEREST_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-night">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-400" role="alert" id={errorId}>
          {error}
        </p>
      )}
    </form>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 24 }, (_, i) => {
    const left = `${(i * 97) % 100}%`;
    const drift = `${((i % 7) - 3) * 8}px`;
    const delay = `${(i % 5) * 120}ms`;
    const colors = ["#c8f542", "#8b7bff", "#ffffff", "#e2ff7a"];
    const color = colors[i % colors.length];
    return { left, drift, delay, color, key: i };
  });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl motion-reduce:hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.key}
          className="confetti-piece"
          style={{
            left: p.left,
            animationDelay: p.delay,
            background: p.color,
            ["--drift" as string]: p.drift,
          }}
        />
      ))}
    </div>
  );
}
