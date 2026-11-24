// Email + password sign-in.
import { sameOrigin, clientIp, tooLarge, limited, MINUTE } from "@/lib/api-guard";
import { checkPassword } from "@/lib/server/auth";
import { NotConfigured } from "@/lib/server/db";
import { cleanEmail, fail, findAccount, signedIn } from "@/lib/server/users";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Forbidden origin.", 403);
  if (tooLarge(req, 4_000)) return fail("Request too large.", 413);
  let b: any;
  try { b = await req.json(); } catch { return fail("Invalid request.", 400); }
  const email = cleanEmail(b?.email), password = String(b?.password ?? "");
  if (!email || !password) return fail("Enter your email and password.", 400);

  // slows down password guessing, per connection and per account
  if (limited(`login:${clientIp(req)}`, 15, 10 * MINUTE) || limited(`login-acct:${email}`, 8, 15 * MINUTE)) {
    return fail("Too many sign-in attempts. Wait a few minutes, then try again.", 429);
  }

  try {
    const a = await findAccount("email", email);
    if (!a) return fail("No account found with this email address.", 401);
    if (!a.password_hash) return fail("This account signs in with Google. Use Continue with Google.", 401);
    if (!(await checkPassword(password, a.password_hash))) return fail("Incorrect password. Try again.", 401);
    return signedIn(a);
  } catch (e) {
    if (e instanceof NotConfigured) return fail("Accounts are not set up yet. Please contact GhanaPrep support.", 500);
    console.error("login failed:", (e as any)?.message);
    return fail("Could not sign you in. Try again.", 500);
  }
}
