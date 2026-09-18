"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  adminVerify,
  adminGetSettings,
  adminUpdateSettings,
  adminGetSubscribers,
  adminDeleteSubscriber,
  adminSendEmail,
  adminGetCampaigns,
  copyToClipboard,
  type SiteSettings,
  type Subscriber,
  type CampaignRecord,
} from "@/lib/api";
import { SocialIcon } from "@/components/Footer";

const PLATFORMS = [
  { id: "twitter", name: "X / Twitter", placeholder: "https://x.com/yourhandle" },
  { id: "instagram", name: "Instagram", placeholder: "https://instagram.com/yourhandle" },
  { id: "youtube", name: "YouTube", placeholder: "https://youtube.com/@yourchannel" },
  { id: "discord", name: "Discord", placeholder: "https://discord.gg/yourinvite" },
  { id: "tiktok", name: "TikTok", placeholder: "https://tiktok.com/@yourhandle" },
  { id: "github", name: "GitHub", placeholder: "https://github.com/yourorg" },
  { id: "linkedin", name: "LinkedIn", placeholder: "https://linkedin.com/company/yourcompany" },
];

export default function AdminPage() {
  const [secret, setSecret] = useState<string>("");
  const [tokenInput, setTokenInput] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !!sessionStorage.getItem("iw_admin_secret");
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState<"subscribers" | "mailer" | "settings">("subscribers");

  // Data states
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({
    showWaitlistCount: true,
    socialLinks: {},
  });
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Subscribers filters
  const [searchQuery, setSearchQuery] = useState("");
  const [interestFilter, setInterestFilter] = useState("");

  // Email form state
  const [emailSubject, setEmailSubject] = useState("Exciting Update from InteractiveWorkout!");
  const [emailContent, setEmailContent] = useState(
    "Hey Athlete,\n\nYou are currently at position #{{position}} on the InteractiveWorkout early roster!\n\nWant to jump higher up the list? Share your unique invite link with other runners and gamers:\n{{referralUrl}}\n\nGet your camera ready,\nThe InteractiveWorkout Team",
  );
  const [emailAudience, setEmailAudience] = useState("all");
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showConfirmBroadcast, setShowConfirmBroadcast] = useState(false);

  // Settings form dirty state
  const [savingSettings, setSavingSettings] = useState(false);

  // Toast notification helper
  const notify = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Initial token check
  useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem("iw_admin_secret") : null;
    if (!saved) return;
    let active = true;
    adminVerify(saved)
      .then((ok) => {
        if (!active) return;
        if (ok) {
          setSecret(saved);
          setIsAuthenticated(true);
        } else {
          sessionStorage.removeItem("iw_admin_secret");
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setCheckingAuth(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Fetch all data when authenticated
  useEffect(() => {
    if (!secret) return;
    let active = true;
    Promise.resolve()
      .then(() => {
        if (active) setLoadingData(true);
        return Promise.all([
          adminGetSubscribers(secret),
          adminGetSettings(secret),
          adminGetCampaigns(secret),
        ]);
      })
      .then(([subs, sets, camps]) => {
        if (!active) return;
        setSubscribers(subs);
        setSettings(sets);
        setCampaigns(camps);
      })
      .catch(() => {
        if (active) notify("Failed to load dashboard data. Check connection.", "error");
      })
      .finally(() => {
        if (active) setLoadingData(false);
      });
    return () => {
      active = false;
    };
  }, [secret]);

  const refreshDashboardData = async () => {
    if (!secret) return;
    setLoadingData(true);
    try {
      const [subs, sets, camps] = await Promise.all([
        adminGetSubscribers(secret),
        adminGetSettings(secret),
        adminGetCampaigns(secret),
      ]);
      setSubscribers(subs);
      setSettings(sets);
      setCampaigns(camps);
    } catch {
      notify("Failed to load dashboard data. Check connection.", "error");
    } finally {
      setLoadingData(false);
    }
  };

  // Auth handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const token = tokenInput.trim();
    if (!token) return;

    try {
      const ok = await adminVerify(token);
      if (ok) {
        sessionStorage.setItem("iw_admin_secret", token);
        setSecret(token);
        setIsAuthenticated(true);
      } else {
        setAuthError("Invalid passcode. Please try again.");
      }
    } catch {
      setAuthError("Failed to verify credentials with server.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("iw_admin_secret");
    setSecret("");
    setIsAuthenticated(false);
    setTokenInput("");
  };

  // Settings Handlers
  const toggleSocialPlatform = (id: string) => {
    setSettings((prev) => {
      const current = prev.socialLinks[id] || { enabled: false, url: "" };
      return {
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [id]: {
            ...current,
            enabled: !current.enabled,
          },
        },
      };
    });
  };

  const updateSocialUrl = (id: string, url: string) => {
    setSettings((prev) => {
      const current = prev.socialLinks[id] || { enabled: false, url: "" };
      return {
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [id]: {
            ...current,
            url,
          },
        },
      };
    });
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const updated = await adminUpdateSettings(secret, settings);
      setSettings(updated);
      notify("Site settings and social media links saved successfully!");
    } catch {
      notify("Failed to save site settings.", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  // Subscribers Handlers
  const handleDeleteSubscriber = async (id: string, email: string) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from the waitlist?`)) {
      return;
    }
    try {
      await adminDeleteSubscriber(secret, id);
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      notify(`Removed ${email} from waitlist.`);
    } catch {
      notify("Failed to delete subscriber.", "error");
    }
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      notify("No subscribers to export.", "error");
      return;
    }
    const headers = ["Position", "Email", "Interest", "ReferralCode", "ReferredBy", "ReferralCount", "DateJoined"];
    const rows = subscribers.map((s) => [
      s.position,
      `"${s.email}"`,
      `"${s.interest || ""}"`,
      s.referralCode,
      `"${s.referredBy || ""}"`,
      s.referralCount,
      `"${new Date(s.createdAt).toISOString()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `interactiveworkout_waitlist_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify("CSV exported successfully!");
  };

  const handleCopyAllEmails = async () => {
    if (filteredSubscribers.length === 0) return;
    const emails = filteredSubscribers.map((s) => s.email).join(", ");
    const ok = await copyToClipboard(emails);
    if (ok) {
      notify(`Copied ${filteredSubscribers.length} email addresses to clipboard!`);
    } else {
      notify("Failed to copy to clipboard.", "error");
    }
  };

  // Filtered subscribers list
  const filteredSubscribers = subscribers.filter((sub) => {
    const matchesSearch =
      !searchQuery ||
      sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.referralCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesInterest = !interestFilter || sub.interest === interestFilter;
    return matchesSearch && matchesInterest;
  });

  // Mailer Handlers
  const handleSendTestEmail = async () => {
    if (!testEmailAddress.trim()) {
      notify("Please provide a test recipient email address.", "error");
      return;
    }
    setSendingEmail(true);
    try {
      const res = await adminSendEmail(secret, {
        subject: emailSubject,
        content: emailContent,
        targetAudience: "test",
        isTest: true,
        testEmail: testEmailAddress,
      });
      notify(`Test email preview sent to ${testEmailAddress} (Status: ${res.status}).`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send test email.";
      notify(msg, "error");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendBroadcast = async () => {
    setShowConfirmBroadcast(false);
    setSendingEmail(true);
    try {
      const res = await adminSendEmail(secret, {
        subject: emailSubject,
        content: emailContent,
        targetAudience: emailAudience,
        isTest: false,
      });
      notify(`Broadcast dispatched to ${res.recipientCount} subscribers (Status: ${res.status})!`);
      // Reload campaigns
      const updatedCampaigns = await adminGetCampaigns(secret);
      setCampaigns(updatedCampaigns);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send broadcast.";
      notify(msg, "error");
    } finally {
      setSendingEmail(false);
    }
  };

  // Insert template tag into email editor
  const insertTemplateTag = (tag: string) => {
    setEmailContent((prev) => prev + tag);
  };

  // Target audience count
  const audienceCount = emailAudience === "all"
    ? subscribers.length
    : subscribers.filter((s) => s.interest === emailAudience).length;

  // Loading state
  if (checkingAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-lime">
          <span className="h-3 w-3 animate-ping rounded-full bg-lime" />
          <span className="font-mono text-sm tracking-widest uppercase">Validating portal security…</span>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Unauthenticated Login Modal
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-night-soft/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-lime/30 bg-lime/10 text-lime">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="mt-4 font-brand text-2xl font-bold tracking-tight text-white">
              Interactive<span className="text-lime">Workout</span>
            </h1>
            <p className="mt-1 text-xs uppercase tracking-widest text-zinc-400">Admin Control Center</p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label htmlFor="admin-passcode" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Admin Passcode
              </label>
              <input
                id="admin-passcode"
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter secret passcode…"
                autoFocus
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-lime focus:bg-night focus:outline-none"
              />
              <p className="mt-1.5 text-[11px] text-zinc-500">
                Default for local development: <code className="text-lime">admin123</code>
              </p>
            </div>

            {authError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-lime py-3 text-sm font-bold text-night transition hover:bg-lime-soft active:scale-[0.99]"
            >
              Authenticate & Enter
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-zinc-500 hover:text-lime transition">
              ← Return to Landing Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Authenticated Admin Dashboard
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-night pb-24 text-zinc-100">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3 shadow-2xl backdrop-blur-md transition-all ${
            notification.type === "success"
              ? "border-lime/40 bg-night-soft text-lime"
              : "border-red-500/40 bg-night-soft text-red-400"
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-current" />
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Confirmation Modal for Broadcast */}
      {showConfirmBroadcast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-night-soft p-6 shadow-2xl">
            <h3 className="font-brand text-xl font-bold text-white">Confirm Promotional Broadcast</h3>
            <p className="mt-2 text-sm text-zinc-300">
              You are about to send this promotional email to{" "}
              <strong className="text-lime">{audienceCount} athletes</strong> ({emailAudience} segment).
            </p>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-400 font-mono">
              <strong>Subject:</strong> {emailSubject}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmBroadcast(false)}
                className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendBroadcast}
                className="rounded-xl bg-lime px-5 py-2 text-xs font-bold text-night hover:bg-lime-soft"
              >
                Confirm & Send to {audienceCount} Athletes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Top Banner / Navbar */}
      <div className="border-b border-white/10 bg-night-soft/60 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-lime pulse-ring" />
            <span className="font-brand text-lg font-bold italic tracking-tight text-white">
              Interactive<span className="text-lime">Workout</span>{" "}
              <span className="not-italic text-xs font-mono font-normal uppercase tracking-widest text-zinc-400 ml-1">
                Admin Console
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={refreshDashboardData}
              disabled={loadingData}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-300 transition hover:border-lime/30 hover:text-white disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${loadingData ? "animate-spin text-lime" : ""}`} fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
              Refresh
            </button>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-300 transition hover:text-lime"
            >
              View Site ↗
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-red-400 transition hover:bg-red-500/20"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="mx-auto flex max-w-7xl gap-2 px-6 pt-2">
          <button
            onClick={() => setActiveTab("subscribers")}
            className={`border-b-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "subscribers"
                ? "border-lime text-lime"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            📋 Listed Emails ({subscribers.length})
          </button>
          <button
            onClick={() => setActiveTab("mailer")}
            className={`border-b-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "mailer"
                ? "border-lime text-lime"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            ✉️ Promotional Mailer
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`border-b-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "settings"
                ? "border-lime text-lime"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            ⚙️ Social Media & Footer Settings
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-6 pt-8">
        {/* ========================================================= */}
        {/* TAB 1: LISTED EMAILS & WAITLIST MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === "subscribers" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-night-soft p-5">
                <p className="text-xs uppercase tracking-wider text-zinc-400">Total Athletes</p>
                <p className="mt-2 font-mono text-3xl font-black text-lime">{subscribers.length.toLocaleString()}</p>
                <p className="mt-1 text-xs text-zinc-500">Waitlist signups</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-night-soft p-5">
                <p className="text-xs uppercase tracking-wider text-zinc-400">Referrals Generated</p>
                <p className="mt-2 font-mono text-3xl font-black text-violet">
                  {subscribers.reduce((sum, s) => sum + s.referralCount, 0).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-zinc-500">Total viral invites</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-night-soft p-5">
                <p className="text-xs uppercase tracking-wider text-zinc-400">Primary Motivation</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-sm font-bold text-zinc-200">
                    Game: {subscribers.filter((s) => s.interest === "game").length}
                  </span>
                  <span className="text-xs text-zinc-500">
                    • Fitness: {subscribers.filter((s) => s.interest === "fitness").length}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Curious: {subscribers.filter((s) => s.interest === "curious" || !s.interest).length}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-night-soft p-5">
                <p className="text-xs uppercase tracking-wider text-zinc-400">Landing Page Counter</p>
                <p className="mt-2 text-lg font-bold">
                  {settings.showWaitlistCount ? (
                    <span className="inline-flex items-center gap-1.5 text-lime">
                      <span className="h-2 w-2 rounded-full bg-lime" /> Visible (Active)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-zinc-400">
                      <span className="h-2 w-2 rounded-full bg-zinc-500" /> Hidden (Off)
                    </span>
                  )}
                </p>
                <button
                  onClick={() => setActiveTab("settings")}
                  className="mt-1 text-xs text-lime underline hover:text-lime-soft"
                >
                  Configure in settings →
                </button>
              </div>
            </div>

            {/* Controls Row: Search, Filter, Copy All, Export */}
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-night-soft p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by email or referral code…"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 pl-9 text-xs text-white placeholder-zinc-500 focus:border-lime focus:outline-none"
                  />
                  <svg viewBox="0 0 24 24" className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>

                <select
                  value={interestFilter}
                  onChange={(e) => setInterestFilter(e.target.value)}
                  className="rounded-xl border border-white/10 bg-night px-3 py-2 text-xs text-zinc-300 focus:border-lime focus:outline-none"
                >
                  <option value="">All Interests</option>
                  <option value="game">The Game</option>
                  <option value="fitness">Fitness / Workout</option>
                  <option value="curious">Curious</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAllEmails}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-200 transition hover:border-lime/40 hover:bg-lime/10 hover:text-lime"
                >
                  📋 Copy All ({filteredSubscribers.length})
                </button>
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-lime px-4 py-2 text-xs font-bold text-night transition hover:bg-lime-soft"
                >
                  ⬇ Export CSV
                </button>
              </div>
            </div>

            {/* Subscribers Table */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-night-soft">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    <tr>
                      <th className="px-5 py-3.5">Rank</th>
                      <th className="px-5 py-3.5">Email Address</th>
                      <th className="px-5 py-3.5">Interest</th>
                      <th className="px-5 py-3.5">Referral Code</th>
                      <th className="px-5 py-3.5">Referred By</th>
                      <th className="px-5 py-3.5">Invites</th>
                      <th className="px-5 py-3.5">Joined Date</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredSubscribers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-12 text-center text-sm text-zinc-500">
                          No subscribers found matching the filters.
                        </td>
                      </tr>
                    ) : (
                      filteredSubscribers.map((sub) => (
                        <tr key={sub.id} className="transition hover:bg-white/[0.02]">
                          <td className="px-5 py-3 font-mono font-bold text-lime">#{sub.position}</td>
                          <td className="px-5 py-3 font-medium text-white">
                            <div className="flex items-center gap-2">
                              <span>{sub.email}</span>
                              <button
                                onClick={() => {
                                  copyToClipboard(sub.email);
                                  notify("Email copied!");
                                }}
                                title="Copy Email"
                                className="text-zinc-500 hover:text-lime"
                              >
                                📋
                              </button>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                                sub.interest === "game"
                                  ? "bg-violet/20 text-violet border border-violet/30"
                                  : sub.interest === "fitness"
                                  ? "bg-lime/20 text-lime border border-lime/30"
                                  : "bg-white/10 text-zinc-400 border border-white/15"
                              }`}
                            >
                              {sub.interest || "general"}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-mono text-zinc-400">
                            <span className="bg-white/5 px-2 py-0.5 rounded text-[11px]">{sub.referralCode}</span>
                          </td>
                          <td className="px-5 py-3 font-mono text-zinc-500">
                            {sub.referredBy ? (
                              <span className="text-zinc-300">{sub.referredBy}</span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-5 py-3 font-mono font-bold text-zinc-200">
                            {sub.referralCount > 0 ? (
                              <span className="rounded-md bg-lime/10 px-2 py-0.5 text-lime border border-lime/20">
                                +{sub.referralCount}
                              </span>
                            ) : (
                              "0"
                            )}
                          </td>
                          <td className="px-5 py-3 text-zinc-400">
                            {new Date(sub.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                              className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400"
                              title="Delete from waitlist"
                            >
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PROMOTIONAL MAILER & CAMPAIGN DISPATCHER */}
        {/* ========================================================= */}
        {activeTab === "mailer" && (
          <div className="space-y-8">
            {/* Notice / Status */}
            <div className="flex items-start gap-4 rounded-2xl border border-lime/30 bg-lime/5 p-4 text-xs text-lime">
              <span className="text-lg">💡</span>
              <div>
                <p className="font-bold">Promotional Mailer & Template Engine Active</p>
                <p className="mt-0.5 text-zinc-300">
                  You can personalize emails using dynamic tags like <code className="text-lime font-mono">{"{{position}}"}</code>,{" "}
                  <code className="text-lime font-mono">{"{{referralCode}}"}</code>, and{" "}
                  <code className="text-lime font-mono">{"{{referralUrl}}"}</code>. If SMTP is not configured in{" "}
                  <code className="text-lime font-mono">api/.env</code>, campaigns run in <strong>Simulation Mode</strong> without failing.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* Left Column: Email Composer */}
              <div className="space-y-5 lg:col-span-7 rounded-2xl border border-white/10 bg-night-soft p-6">
                <h2 className="font-brand text-xl font-bold text-white">Compose Promotional Mail</h2>

                {/* Target Audience */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Target Audience
                  </label>
                  <select
                    value={emailAudience}
                    onChange={(e) => setEmailAudience(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-night px-4 py-2.5 text-sm text-zinc-200 focus:border-lime focus:outline-none"
                  >
                    <option value="all">All Waitlist Athletes ({subscribers.length} total)</option>
                    <option value="game">Gaming Focus Segment ({subscribers.filter((s) => s.interest === "game").length} athletes)</option>
                    <option value="fitness">Fitness Focus Segment ({subscribers.filter((s) => s.interest === "fitness").length} athletes)</option>
                    <option value="curious">Curious Segment ({subscribers.filter((s) => s.interest === "curious" || !s.interest).length} athletes)</option>
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Email Subject Line
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Enter email subject…"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-lime focus:outline-none"
                  />
                </div>

                {/* Template Tag Chips */}
                <div>
                  <p className="text-xs text-zinc-400 mb-1.5">Click to insert personalized dynamic tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { tag: "{{position}}", label: "# Position Rank" },
                      { tag: "{{referralCode}}", label: "Referral Code" },
                      { tag: "{{referralUrl}}", label: "Full Referral URL" },
                      { tag: "{{email}}", label: "Athlete Email" },
                    ].map((item) => (
                      <button
                        key={item.tag}
                        type="button"
                        onClick={() => insertTemplateTag(item.tag)}
                        className="rounded-lg border border-lime/30 bg-lime/10 px-2.5 py-1 text-xs font-mono text-lime transition hover:bg-lime/20"
                      >
                        + {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Body Content */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Message Body (Text / HTML)
                  </label>
                  <textarea
                    rows={9}
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-4 font-mono text-xs leading-relaxed text-white focus:border-lime focus:outline-none"
                  />
                </div>

                {/* Send Buttons & Test Area */}
                <div className="border-t border-white/10 pt-5 space-y-4">
                  {/* Test email send */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="email"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      placeholder="Enter test email address…"
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-lime focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={sendingEmail}
                      onClick={handleSendTestEmail}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:border-lime hover:text-lime disabled:opacity-50"
                    >
                      Send Test Preview
                    </button>
                  </div>

                  {/* Main Broadcast Button */}
                  <button
                    type="button"
                    disabled={sendingEmail || audienceCount === 0}
                    onClick={() => setShowConfirmBroadcast(true)}
                    className="w-full rounded-xl bg-lime py-3 text-sm font-bold text-night transition hover:bg-lime-soft disabled:opacity-50"
                  >
                    {sendingEmail
                      ? "Dispatching Emails…"
                      : `Dispatch Promotional Broadcast to ${audienceCount} Athletes`}
                  </button>
                </div>
              </div>

              {/* Right Column: Live Email Preview Pane */}
              <div className="space-y-4 lg:col-span-5">
                <div className="rounded-2xl border border-white/10 bg-night-soft p-5">
                  <h3 className="font-brand text-sm font-bold uppercase tracking-wider text-zinc-300">
                    Live Recipient Preview
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Showing how it will look for a sample athlete (Position #42)
                  </p>

                  <div className="mt-4 rounded-xl border border-white/10 bg-[#0e0e18] p-5 shadow-inner">
                    <div className="border-b border-white/10 pb-3 text-xs">
                      <div className="text-zinc-400">
                        <strong className="text-zinc-200">From:</strong> InteractiveWorkout &lt;noreply@interactiveworkout.game&gt;
                      </div>
                      <div className="text-zinc-400 mt-1">
                        <strong className="text-zinc-200">Subject:</strong> {emailSubject}
                      </div>
                    </div>

                    <div className="pt-4 text-xs leading-relaxed text-zinc-200 whitespace-pre-wrap font-sans">
                      {emailContent
                        .replace(/\{\{position\}\}/g, "42")
                        .replace(/\{\{referralCode\}\}/g, "SAMPLE_ROSTER_CODE")
                        .replace(/\{\{referralUrl\}\}/g, "http://localhost:3000/?ref=SAMPLE_ROSTER_CODE")
                        .replace(/\{\{email\}\}/g, "athlete@sample.com")}
                    </div>

                    <div className="mt-6 border-t border-white/10 pt-4 text-[11px] text-zinc-500 text-center">
                      InteractiveWorkout — Your body is the controller.
                    </div>
                  </div>
                </div>

                {/* Campaign History Log */}
                <div className="rounded-2xl border border-white/10 bg-night-soft p-5">
                  <h3 className="font-brand text-sm font-bold uppercase tracking-wider text-zinc-300">
                    Campaign Broadcast History
                  </h3>
                  <div className="mt-3 space-y-2.5">
                    {campaigns.length === 0 ? (
                      <p className="text-xs text-zinc-500 py-3 text-center">No past campaigns recorded.</p>
                    ) : (
                      campaigns.map((c) => (
                        <div key={c.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white truncate max-w-[200px]">{c.subject}</span>
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold ${
                                c.status === "sent" ? "bg-lime/20 text-lime" : "bg-violet/20 text-violet"
                              }`}
                            >
                              {c.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-400">
                            <span>Audience: {c.targetAudience} ({c.recipientCount} sent)</span>
                            <span>{new Date(c.sentAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: SOCIAL MEDIA & SITE SETTINGS */}
        {/* ========================================================= */}
        {activeTab === "settings" && (
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* 1. Live Waitlist Count Toggle */}
            <div className="rounded-2xl border border-white/10 bg-night-soft p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-brand text-xl font-bold text-white">
                    Show Athlete Waitlist Count on Landing Page
                  </h2>
                  <p className="mt-1 text-xs text-zinc-400 leading-relaxed max-w-xl">
                    Toggle ON to display the real-time waitlist counter (e.g. &ldquo;1,234 athletes on the early roster&rdquo;)
                    in the Hero and Bottom CTA sections. Toggle OFF to hide it completely for future use.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      showWaitlistCount: !prev.showWaitlistCount,
                    }))
                  }
                  className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.showWaitlistCount ? "bg-lime" : "bg-zinc-700"
                  }`}
                  role="switch"
                  aria-checked={settings.showWaitlistCount}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-night shadow-lg ring-0 transition duration-200 ease-in-out ${
                      settings.showWaitlistCount ? "translate-x-8" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-white/5 bg-white/5 p-3 flex items-center justify-between text-xs">
                <span className="text-zinc-400">Current status on landing page:</span>
                <span
                  className={`font-mono font-bold ${
                    settings.showWaitlistCount ? "text-lime" : "text-zinc-500"
                  }`}
                >
                  {settings.showWaitlistCount ? "✓ COUNTER IS DISPLAYED" : "✕ COUNTER IS HIDDEN"}
                </span>
              </div>
            </div>

            {/* 2. Social Media Accounts Configuration */}
            <div className="rounded-2xl border border-white/10 bg-night-soft p-6 space-y-6">
              <div>
                <h2 className="font-brand text-xl font-bold text-white">
                  Social Media Links in Landing Page Footer
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Enable the platforms you want to make available. When toggled <strong>ON</strong> and given a valid link,
                  the icon will dynamically appear in the landing page footer.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {PLATFORMS.map((platform) => {
                  const link = settings.socialLinks[platform.id] || { enabled: false, url: "" };
                  return (
                    <div
                      key={platform.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition-all ${
                        link.enabled
                          ? "border-lime/30 bg-white/[0.03]"
                          : "border-white/5 bg-white/[0.01] opacity-75"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                            link.enabled
                              ? "border-lime/40 bg-lime/10 text-lime"
                              : "border-white/10 bg-white/5 text-zinc-500"
                          }`}
                        >
                          <SocialIcon platform={platform.id} className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{platform.name}</p>
                          <p className="text-[11px] text-zinc-500">
                            {link.enabled ? "Visible in footer" : "Disabled (hidden)"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-1 items-center gap-3 max-w-lg">
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateSocialUrl(platform.id, e.target.value)}
                          placeholder={platform.placeholder}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:border-lime focus:outline-none"
                        />

                        {link.url && (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-2 text-zinc-500 hover:text-lime"
                            title="Test Link"
                          >
                            ↗
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleSocialPlatform(platform.id)}
                          className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            link.enabled ? "bg-lime" : "bg-zinc-700"
                          }`}
                          role="switch"
                          aria-checked={link.enabled}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-night shadow-lg ring-0 transition duration-200 ease-in-out ${
                              link.enabled ? "translate-x-6" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Footer Preview */}
              <div className="rounded-xl border border-white/10 bg-[#0e0e18] p-5">
                <p className="text-[11px] uppercase tracking-wider font-bold text-zinc-400 mb-3">
                  Live Footer Social Icons Preview
                </p>
                <div className="flex items-center gap-3">
                  {Object.entries(settings.socialLinks).filter(([, l]) => l.enabled && l.url).length === 0 ? (
                    <span className="text-xs text-zinc-500 italic">No social media links currently enabled.</span>
                  ) : (
                    Object.entries(settings.socialLinks)
                      .filter(([, l]) => l.enabled && l.url)
                      .map(([platform]) => (
                        <div
                          key={platform}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-lime/40 bg-lime/10 text-lime"
                        >
                          <SocialIcon platform={platform} className="h-4 w-4" />
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={handleSaveSettings}
                  className="rounded-xl bg-lime px-8 py-3 text-sm font-bold text-night transition hover:bg-lime-soft active:scale-[0.99] disabled:opacity-50"
                >
                  {savingSettings ? "Saving Settings…" : "Save All Settings & Links"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
