import type { Bindings } from "./types";

const encoder = new TextEncoder();
const personalDomains = new Set([
  "aol.com",
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "mail.com",
  "outlook.com",
  "proton.me",
  "protonmail.com",
  "yahoo.com",
  "yahoo.fr",
]);

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function parseEmail(value: unknown): { email: string; domain: string } | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  const domain = email.slice(email.lastIndexOf("@") + 1);
  return { email, domain };
}

export function parseProfessionalEmail(value: unknown): { email: string; domain: string } | null {
  const parsed = parseEmail(value);
  if (!parsed) return null;
  const { email, domain } = parsed;
  if (personalDomains.has(domain)) return null;
  return { email, domain };
}

export async function isGodmodeEmail(email: string, expectedDigest: string | undefined): Promise<boolean> {
  const normalizedDigest = expectedDigest?.trim().toLowerCase() ?? "";
  if (!/^[0-9a-f]{64}$/.test(normalizedDigest)) return false;
  const actualDigest = await sha256(email.trim().toLowerCase());
  const subtle = crypto.subtle as SubtleCrypto & {
    timingSafeEqual(a: ArrayBufferView, b: ArrayBufferView): boolean;
  };
  return subtle.timingSafeEqual(
    encoder.encode(actualDigest),
    encoder.encode(normalizedDigest),
  );
}

export function cookieValue(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=") || null;
  }
  return null;
}

export function sessionCookieName(environment: Bindings["APP_ENV"]): string {
  return environment === "development" ? "parkventory_session" : "__Host-parkventory_session";
}

export function sessionCookie(token: string, environment: Bindings["APP_ENV"]): string {
  const secure = environment === "development" ? "" : "; Secure";
  return `${sessionCookieName(environment)}=${token}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=604800`;
}

export function expiredSessionCookie(environment: Bindings["APP_ENV"]): string {
  const secure = environment === "development" ? "" : "; Secure";
  return `${sessionCookieName(environment)}=; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=0`;
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (origin) return origin === new URL(request.url).origin;
  const fetchSite = request.headers.get("Sec-Fetch-Site");
  return fetchSite === "same-origin";
}

interface TurnstileResponse {
  success: boolean;
  hostname?: string;
  "error-codes"?: string[];
}

export async function verifyTurnstile(
  secret: string,
  response: unknown,
  remoteIp: string | undefined,
): Promise<boolean> {
  if (!secret || typeof response !== "string" || response.length > 2048) return false;
  const body = new FormData();
  body.set("secret", secret);
  body.set("response", response);
  if (remoteIp) body.set("remoteip", remoteIp);
  const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  if (!verification.ok) return false;
  return ((await verification.json()) as TurnstileResponse).success === true;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;",
  })[character] ?? character);
}
