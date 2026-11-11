// Email verification codes for sign-up.
//   { action: "send",   email, name }                  -> emails a 6-digit code, returns { token, expires }
//   { action: "verify", email, code, token, expires }  -> { ok: true } if the code is right and not expired
//
// The code is never sent to the browser. The server signs (email, code, expiry) with a secret and
// hands back only the signature ("token"), so no database is needed to check the code later.
//
// Sending uses SMTP. Gmail works without owning a domain: set SMTP_USER to the Gmail address
// and SMTP_PASS to a Google "app password" (see README).

import nodemailer from "nodemailer";
import { createHmac, randomInt, timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TTL_MS = 10 * 60 * 1000; // codes last 10 minutes
const MAX_TRIES = 5;           // wrong guesses allowed per code
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const isProd = process.env.NODE_ENV === "production";

const secret = () => process.env.AUTH_SECRET || process.env.SMTP_PASS || (isProd ? "" : "dev-only-secret");
const sign = (email: string, code: string, expires: number) =>
  createHmac("sha256", secret()).update(`${email}|${code}|${expires}`).digest("hex");

// Best-effort limits, held in this server instance's memory.
const sends = new Map<string, number[]>();
const tries = new Map<string, number>();
function tooMany(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const recent = (sends.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= max) { sends.set(key, recent); return true; }
  recent.push(now);
  sends.set(key, recent);
  if (sends.size > 5000) sends.clear();
  return false;
}

const fail = (error: string, status: number) => Response.json({ error }, { status });
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

async function sendMail(to: string, name: string, code: string) {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER as string;
  let pass = process.env.SMTP_PASS as string;
  if (host.includes("gmail")) pass = pass.replace(/\s+/g, ""); // Google shows app passwords with spaces
  const transport = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  const hello = name ? `Hi ${name},` : "Hi,";
  await transport.sendMail({
    from: process.env.MAIL_FROM || `GhanaPrep <${user}>`,
    to,
    subject: `${code} is your GhanaPrep verification code`,
    text: `${hello}\n\nYour GhanaPrep verification code is ${code}\n\nIt expires in 10 minutes. If you did not sign up for GhanaPrep, you can ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:24px;color:#171717">
<p style="font-size:15px">${escapeHtml(hello)}</p>
<p style="font-size:15px">Your GhanaPrep verification code is:</p>
<p style="font-size:32px;font-weight:700;letter-spacing:6px;color:#16a34a;margin:16px 0">${code}</p>
<p style="font-size:13px;color:#525252">It expires in 10 minutes. If you did not sign up for GhanaPrep, you can ignore this email.</p>
</div>`,
  });
}

export async function POST(req: Request) {
  // Only accept calls made from this site.
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host) {
    let originHost = "";
    try { originHost = new URL(origin).host; } catch {}
    if (originHost !== host) return fail("Forbidden origin.", 403);
  }

  let body: any;
  try { body = await req.json(); } catch { return fail("Invalid request.", 400); }

  const email = String(body?.email ?? "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return fail("Enter a valid email address.", 400);
  if (!secret()) return fail("Email verification is not set up yet. Please contact support.", 500);

  if (body?.action === "send") {
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
    if (tooMany(`ip:${ip}`, 6, TTL_MS) || tooMany(`to:${email}`, 4, TTL_MS)) {
      return fail("Too many codes requested. Wait a few minutes, then try again.", 429);
    }
    const code = String(randomInt(100000, 1000000));
    const expires = Date.now() + TTL_MS;
    const token = sign(email, code, expires);
    const configured = !!process.env.SMTP_USER && !!process.env.SMTP_PASS;

    if (!configured) {
      // Local development without email set up: show the code on screen instead of emailing it.
      if (!isProd) return Response.json({ token, expires, devCode: code });
      return fail("Email sending is not set up yet. Please contact support.", 500);
    }
    try {
      await sendMail(email, String(body?.name ?? "").replace(/[\r\n]/g, " ").trim().slice(0, 60), code);
    } catch (e) {
      console.error("Verification email failed:", (e as Error)?.message);
      return fail("We could not send the email. Check the address and try again.", 502);
    }
    return Response.json({ token, expires });
  }

  if (body?.action === "verify") {
    const code = String(body?.code ?? "").trim();
    const token = String(body?.token ?? "");
    const expires = Number(body?.expires);
    if (!/^\d{6}$/.test(code) || !/^[0-9a-f]{64}$/.test(token) || !Number.isFinite(expires)) return fail("Incorrect code. Try again.", 400);
    if (Date.now() > expires) return fail("This code has expired. Request a new one.", 400);
    const used = tries.get(token) || 0;
    if (used >= MAX_TRIES) return fail("Too many wrong tries. Request a new code.", 429);
    const good = Buffer.from(sign(email, code, expires));
    if (!timingSafeEqual(good, Buffer.from(token))) {
      tries.set(token, used + 1);
      if (tries.size > 5000) tries.clear();
      return fail("Incorrect code. Try again.", 400);
    }
    tries.delete(token);
    return Response.json({ ok: true });
  }

  return fail("Invalid request.", 400);
}
