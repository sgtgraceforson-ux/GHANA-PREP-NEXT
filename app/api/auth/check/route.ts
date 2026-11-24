// Before a verification code is emailed: is this phone number or email already registered?
import { sameOrigin, clientIp, tooLarge, limited, MINUTE } from "@/lib/api-guard";
import { NotConfigured } from "@/lib/server/db";
import { cleanEmail, cleanPhone, fail, findAccount, json } from "@/lib/server/users";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Forbidden origin.", 403);
  if (tooLarge(req, 2_000)) return fail("Request too large.", 413);
  if (limited(`check:${clientIp(req)}`, 30, 10 * MINUTE)) return fail("Too many requests. Wait a few minutes.", 429);
  let b: any;
  try { b = await req.json(); } catch { return fail("Invalid request.", 400); }
  try {
    const phone = cleanPhone(b?.phone), email = cleanEmail(b?.email);
    if (phone && (await findAccount("phone", phone))) return json({ taken: "This phone number is already registered." });
    if (email && (await findAccount("email", email))) return json({ taken: "This email address is already registered. Sign in instead." });
    return json({ taken: "" });
  } catch (e) {
    if (e instanceof NotConfigured) return fail("Accounts are not set up yet. Please contact GhanaPrep support.", 500);
    return fail("Could not check right now. Try again.", 500);
  }
}
