// Signing for the 6-digit email verification codes (used by /api/auth/code and /api/auth/register).
// The server signs (email, code, expiry); the browser only ever holds the signature.
import { createHmac, timingSafeEqual } from "node:crypto";

const secret = () => process.env.AUTH_SECRET || process.env.SMTP_PASS || "test-mode-secret";

export const signEmailCode = (email: string, code: string, expires: number) =>
  createHmac("sha256", secret()).update(`${email}|${code}|${expires}`).digest("hex");

/** True when `code` is the code that was sent to `email` and has not expired. */
export function emailCodeValid(email: string, code: unknown, token: unknown, expires: unknown) {
  const c = String(code ?? "").trim(), t = String(token ?? ""), e = Number(expires);
  if (!/^\d{6}$/.test(c) || !/^[0-9a-f]{64}$/.test(t) || !Number.isFinite(e) || Date.now() > e) return false;
  const good = Buffer.from(signEmailCode(email, c, e));
  return timingSafeEqual(good, Buffer.from(t));
}
