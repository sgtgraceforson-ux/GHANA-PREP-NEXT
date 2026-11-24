// Server-side sign-in helpers: password hashing, signed session cookies and signed one-time proofs.
import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/* ---------- passwords (scrypt, random salt per password) ---------- */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password.normalize("NFKC"), salt, 32, SCRYPT);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}
export async function checkPassword(password: string, stored: string | null | undefined) {
  if (!stored || !stored.startsWith("scrypt$")) return false;
  const [, s, h] = stored.split("$");
  const want = Buffer.from(h, "base64");
  const got = await scrypt(password.normalize("NFKC"), Buffer.from(s, "base64"), want.length, SCRYPT);
  return got.length === want.length && timingSafeEqual(got, want);
}

/* ---------- signing ---------- */
const isProd = process.env.NODE_ENV === "production";
export function authSecret() {
  const s = process.env.AUTH_SECRET || "";
  if (!s && isProd) throw new Error("AUTH_SECRET is not set");
  return s || "dev-only-auth-secret";
}
const mac = (purpose: string, data: string) => createHmac("sha256", authSecret()).update(purpose + "|" + data).digest("base64url");

/** Signs a small JSON payload for one purpose ("session", "google"...). */
export function signToken(purpose: string, payload: object) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${mac(purpose, data)}`;
}
/** Returns the payload if the signature is right and it has not expired (payload.exp, ms). */
export function readToken<T extends { exp: number }>(purpose: string, token: string | undefined | null): T | null {
  if (!token || typeof token !== "string" || token.length > 4000) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const good = Buffer.from(mac(purpose, data)), given = Buffer.from(sig);
  if (good.length !== given.length || !timingSafeEqual(good, given)) return null;
  try {
    const p = JSON.parse(Buffer.from(data, "base64url").toString()) as T;
    return typeof p.exp === "number" && p.exp > Date.now() ? p : null;
  } catch { return null; }
}

/* ---------- session cookie ---------- */
export const SESSION_COOKIE = "gp_sid";
const SESSION_DAYS = 30;
export type Session = { uid: string; role: string; exp: number };

export function sessionCookie(uid: string, role: string) {
  const token = signToken("session", { uid, role, exp: Date.now() + SESSION_DAYS * 86400000 });
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${isProd ? "; Secure" : ""}`;
}
export const clearSessionCookie = () => `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProd ? "; Secure" : ""}`;

export function readSession(req: Request): Session | null {
  const raw = req.headers.get("cookie") || "";
  const m = raw.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return readToken<Session>("session", m ? decodeURIComponent(m[1]) : null);
}
