// "Continue with Google": checks the ID token that Google's sign-in button gives the browser.
// POST { credential } -> { email, name } when the token is genuine, was issued for this app,
// has not expired and belongs to a Google account with a verified email.
//
// Needs NEXT_PUBLIC_GOOGLE_CLIENT_ID (the OAuth "Web application" client ID, see README).
// No client secret is used: this flow only proves who the person is.

import { sameOrigin, clientIp, tooLarge, limited, MINUTE } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number) => Response.json({ error }, { status });

export async function POST(req: Request) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return fail("Google sign-in is not set up yet.", 500);

  // Only accept calls made by this site's own pages (blocks other websites and plain scripts).
  if (!sameOrigin(req)) return fail("Forbidden origin.", 403);
  if (tooLarge(req, 10_000)) return fail("Request too large.", 413);
  if (limited(`google:${clientIp(req)}`, 20, 10 * MINUTE)) return fail("Too many sign-in attempts. Wait a few minutes, then try again.", 429);

  let body: any;
  try { body = await req.json(); } catch { return fail("Invalid request.", 400); }
  const credential = typeof body?.credential === "string" ? body.credential : "";
  if (!credential || credential.length > 4096 || credential.split(".").length !== 3) return fail("Google sign-in failed. Try again.", 400);

  // Google checks the token's signature and expiry for us and returns its contents.
  let info: any;
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, { cache: "no-store" });
    if (!res.ok) return fail("Google sign-in failed. Try again.", 401);
    info = await res.json();
  } catch {
    return fail("Could not reach Google. Check your connection and try again.", 502);
  }

  const issuerOk = info?.iss === "accounts.google.com" || info?.iss === "https://accounts.google.com";
  const notExpired = Number(info?.exp) * 1000 > Date.now();
  if (info?.aud !== clientId || !issuerOk || !notExpired) return fail("Google sign-in failed. Try again.", 401);
  if (String(info?.email_verified) !== "true" || !info?.email) return fail("Your Google account's email is not verified.", 403);

  return Response.json({
    email: String(info.email).trim().toLowerCase(),
    name: String(info.name || "").trim().slice(0, 80),
  });
}
