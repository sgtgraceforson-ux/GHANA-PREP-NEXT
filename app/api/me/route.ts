// The signed-in person's own account (profile and practice stats).
import { readSession, clearSessionCookie } from "@/lib/server/auth";
import { NotConfigured } from "@/lib/server/db";
import { fail, findAccount, json, publicUser } from "@/lib/server/users";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const s = readSession(req);
  if (!s) return fail("Not signed in.", 401);
  try {
    const a = await findAccount("id", s.uid);
    if (!a) return json({ error: "Not signed in." }, 401, clearSessionCookie()); // account was removed
    return json({ user: publicUser(a) });
  } catch (e) {
    if (e instanceof NotConfigured) return fail("Accounts are not set up yet.", 500);
    return fail("Could not load your account. Try again.", 500);
  }
}
