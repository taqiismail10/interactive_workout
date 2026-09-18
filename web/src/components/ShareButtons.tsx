"use client";

import { useId, useState } from "react";
import {
  copyToClipboard,
  referralUrl,
  type SignupSuccess,
} from "@/lib/api";

interface ShareButtonsProps {
  result: SignupSuccess;
}

const SHARE_TEXT = "I just joined the InteractiveWorkout waitlist — your body is the controller.";

export function ShareButtons({ result }: ShareButtonsProps) {
  const feedbackId = useId();
  const [copyState, setCopyState] = useState<"idle" | "copying" | "copied" | "failed">("idle");
  const url = referralUrl(result.referralCode);
  const encodedText = encodeURIComponent(`${SHARE_TEXT} ${url}`);

  const shareLinks = [
    {
      label: "Share on X",
      href: `https://twitter.com/intent/tweet?text=${encodedText}`,
    },
    {
      label: "Share on WhatsApp",
      href: `https://wa.me/?text=${encodedText}`,
    },
  ];

  async function handleCopy() {
    if (copyState === "copying") return;
    setCopyState("copying");
    try {
      const ok = await copyToClipboard(url);
      setCopyState(ok ? "copied" : "failed");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <div className="flex flex-wrap items-start justify-center gap-2.5">
      {shareLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${link.label} (opens in a new tab)`}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-sm font-medium text-zinc-200 transition-colors hover:border-lime/60 hover:bg-lime/10 hover:text-lime focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime"
        >
          {link.label === "Share on X" ? <XIcon /> : <WhatsAppIcon />}
          {link.label}
        </a>
      ))}
      <button
        type="button"
        onClick={handleCopy}
        disabled={copyState === "copying"}
        aria-describedby={feedbackId}
        className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime disabled:opacity-60 ${
          copyState === "copied"
            ? "border-lime/60 bg-lime/10 text-lime"
            : copyState === "failed"
              ? "border-red-500/60 bg-red-500/10 text-red-400"
              : "border-white/15 bg-white/5 text-zinc-200 hover:border-lime/60 hover:bg-lime/10 hover:text-lime"
        }`}
      >
        {copyState === "copied" ? (
          <>
            <CheckIcon />
            Copied!
          </>
        ) : copyState === "failed" ? (
          <>
            <AlertIcon />
            Copy failed — select the link above
          </>
        ) : (
          <>
            <LinkIcon />
            Copy link
          </>
        )}
      </button>
      <p id={feedbackId} role="status" className="sr-only">
        {copyState === "copied"
          ? "Referral link copied to clipboard."
          : copyState === "failed"
            ? "Copy failed. Select the referral link above to copy it manually."
            : ""}
      </p>
    </div>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 10.89-5.335 10.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}
