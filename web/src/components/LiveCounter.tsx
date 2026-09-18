"use client";

import { useEffect, useState } from "react";
import { fetchCount, fetchSettings } from "@/lib/api";

export function LiveCounter({ className = "" }: { className?: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [showCounter, setShowCounter] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetchSettings()
      .then((s) => {
        if (active) setShowCounter(s.showWaitlistCount);
      })
      .catch(() => {
        if (active) setShowCounter(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (showCounter === false) return;
    let active = true;
    let loading = false;
    const load = () => {
      if (loading) return;
      loading = true;
      fetchCount()
        .then((n) => {
          if (!Number.isSafeInteger(n) || n < 0) throw new Error("Invalid count");
          if (active) {
            setCount(n);
            setFailed(false);
          }
        })
        .catch(() => {
          if (active) {
            setCount(null);
            setFailed(true);
          }
        })
        .finally(() => {
          loading = false;
        });
    };
    load();
    const interval = setInterval(load, 45000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [showCounter]);

  if (showCounter === false) {
    return null;
  }

  return (
    <div
      className={`inline-flex min-h-[34px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-zinc-300 backdrop-blur-sm ${className}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
        {count !== null && !failed && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75 motion-reduce:hidden" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            failed || count === null ? "bg-zinc-500" : "bg-lime"
          }`}
        />
      </span>
      {count === null ? (
        failed ? (
          <span>Roster count unavailable right now</span>
        ) : (
          <span>Checking the roster…</span>
        )
      ) : (
        <span>
          <strong className="font-mono font-bold text-lime">{count.toLocaleString()}</strong>{" "}
          {count === 1 ? "athlete" : "athletes"} on the early roster
        </span>
      )}
    </div>
  );
}
