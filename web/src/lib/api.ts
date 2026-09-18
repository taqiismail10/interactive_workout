export const INTEREST_OPTIONS = [
  { value: "game", label: "The game" },
  { value: "fitness", label: "Getting fit without a gym" },
  { value: "curious", label: "Just curious" },
] as const;

export type InterestValue = (typeof INTEREST_OPTIONS)[number]["value"] | "";

export interface SignupSuccess {
  referralCode: string;
  position: number;
  referralCount: number;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");

export function referralUrl(code: string): string {
  if (typeof window === "undefined") return `/?ref=${code}`;
  return `${window.location.origin}/?ref=${code}`;
}

export async function signup(
  email: string,
  interest: InterestValue,
  referredBy: string | null,
): Promise<SignupSuccess> {
  const body: Record<string, string> = { email };
  if (interest) body.interest = interest;
  if (referredBy) body.referredBy = referredBy;
  const res = await fetch(`${API_BASE}/api/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? "Something went wrong. Please try again.");
  }
  return data as unknown as SignupSuccess;
}

export async function fetchCount(): Promise<number> {
  const res = await fetch(`${API_BASE}/api/waitlist/count`, { cache: "no-store" });
  if (!res.ok) throw new ApiError(res.status, "Count unavailable");
  const data = (await res.json()) as { count: number };
  return data.count;
}

export async function fetchReferral(
  code: string,
): Promise<{ referralCode: string; position: number; referralCount: number }> {
  const res = await fetch(`${API_BASE}/api/waitlist/${code}`, { cache: "no-store" });
  if (!res.ok) throw new ApiError(res.status, "Referral not found");
  return res.json();
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export interface SocialLink {
  enabled: boolean;
  url: string;
}

export interface SiteSettings {
  showWaitlistCount: boolean;
  socialLinks: Record<string, SocialLink>;
}

export interface Subscriber {
  id: string;
  email: string;
  interest: string | null;
  referralCode: string;
  referredBy: string | null;
  referralCount: number;
  position: number;
  createdAt: string;
}

export interface EmailCampaignInput {
  subject: string;
  content: string;
  targetAudience: string;
  isTest?: boolean;
  testEmail?: string;
}

export interface CampaignRecord {
  id: string;
  subject: string;
  content: string;
  targetAudience: string;
  recipientCount: number;
  status: string;
  sentAt: string;
}

export async function fetchSettings(): Promise<SiteSettings> {
  const res = await fetch(`${API_BASE}/api/settings`, { cache: "no-store" });
  if (!res.ok) throw new ApiError(res.status, "Settings unavailable");
  return res.json();
}

function adminHeaders(secret: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${secret}`,
  };
}

export async function adminVerify(secret: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/admin/verify`, {
    headers: adminHeaders(secret),
    cache: "no-store",
  });
  return res.ok;
}

export async function adminGetSettings(secret: string): Promise<SiteSettings> {
  const res = await fetch(`${API_BASE}/api/admin/settings`, {
    headers: adminHeaders(secret),
    cache: "no-store",
  });
  if (!res.ok) throw new ApiError(res.status, "Failed to get settings");
  return res.json();
}

export async function adminUpdateSettings(secret: string, settings: SiteSettings): Promise<SiteSettings> {
  const res = await fetch(`${API_BASE}/api/admin/settings`, {
    method: "PUT",
    headers: adminHeaders(secret),
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new ApiError(res.status, "Failed to update settings");
  return res.json();
}

export async function adminGetSubscribers(
  secret: string,
  query?: string,
  interest?: string,
): Promise<Subscriber[]> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (interest) params.set("interest", interest);
  const url = `${API_BASE}/api/admin/subscribers${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, {
    headers: adminHeaders(secret),
    cache: "no-store",
  });
  if (!res.ok) throw new ApiError(res.status, "Failed to load subscribers");
  const data = await res.json();
  return data.subscribers || [];
}

export async function adminDeleteSubscriber(secret: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/subscribers/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: adminHeaders(secret),
  });
  if (!res.ok) throw new ApiError(res.status, "Failed to delete subscriber");
}

export async function adminSendEmail(
  secret: string,
  payload: EmailCampaignInput,
): Promise<{ status: string; recipientCount: number; isTest: boolean }> {
  const res = await fetch(`${API_BASE}/api/admin/send-email`, {
    method: "POST",
    headers: adminHeaders(secret),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || "Failed to send email");
  return data;
}

export async function adminGetCampaigns(secret: string): Promise<CampaignRecord[]> {
  const res = await fetch(`${API_BASE}/api/admin/campaigns`, {
    headers: adminHeaders(secret),
    cache: "no-store",
  });
  if (!res.ok) throw new ApiError(res.status, "Failed to fetch campaigns");
  const data = await res.json();
  return data.campaigns || [];
}
