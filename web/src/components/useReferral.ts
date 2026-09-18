"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchReferral } from "@/lib/api";

const REF_KEY = "iw-ref";

export function useReferral(): string | null {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    let stored: string | null = null;
    try {
      if (ref && /^[A-Za-z0-9_-]{24}$/.test(ref)) {
        localStorage.setItem(REF_KEY, ref);
        stored = ref;
        const url = new URL(window.location.href);
        url.searchParams.delete("ref");
        window.history.replaceState(null, "", url.pathname + url.search);
      } else {
        stored = localStorage.getItem(REF_KEY);
      }
    } catch {
      stored = ref;
    }
    if (stored) {
      setDeferredCode(setCode, stored);
    }
  }, []);

  return code;
}

function setDeferredCode(set: (value: string | null) => void, value: string | null) {
  setTimeout(() => set(value), 0);
}

export function useReferralStats(code: string | null) {
  const [stats, setStats] = useState<{ position: number; referralCount: number } | null>(null);

  const refresh = useCallback(() => {
    if (!code) return;
    fetchReferral(code)
      .then((data) => setStats({ position: data.position, referralCount: data.referralCount }))
      .catch(() => {});
  }, [code]);

  useEffect(() => {
    if (!code) return;
    refresh();
    const interval = setInterval(refresh, 45000);
    return () => clearInterval(interval);
  }, [code, refresh]);

  return stats;
}
