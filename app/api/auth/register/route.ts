// Creates an account. The email must be proven first, either with the 6-digit code that was
// emailed (proof.kind = "email") or by Google (proof.kind = "google", the token /api/auth/google gave).
import SCHOOLS from "@/lib/schools.json";
import { sameOrigin, clientIp, tooLarge, limited, HOUR } from "@/lib/api-guard";
import { hashPassword, readToken } from "@/lib/server/auth";
import { emailCodeValid } from "@/lib/server/email-code";
import { db, NotConfigured } from "@/lib/server/db";
import { EMAIL_RE, cleanEmail, cleanPhone, emptyStats, fail, signedIn, type AccountRow } from "@/lib/server/users";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COLORS = ["#22c55e", "#38bdf8", "#f59e0b", "#f87171", "#a78bfa", "#fb923c", "#34d399", "#e879f9"];

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Forbidden origin.", 403);
  if (tooLarge(req, 10_000)) return fail("Request too large.", 413);
  if (limited(`register:${clientIp(req)}`, 10, HOUR)) return fail("Too many sign-ups from this connection. Try again later.", 429);

  let b: any;
  try { b = await req.json(); } catch { return fail("Invalid request.", 400); }

  const name = String(b?.name ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  const email = cleanEmail(b?.email);
  const phone = cleanPhone(b?.phone);
  const role = ["student", "teacher", "parent"].includes(b?.role) ? b.role : "student";
  const avatar = COLORS.includes(b?.avatarColor) ? b.avatarColor : "#22c55e";
  if (name.length < 2) return fail("Enter your full name.", 400);
  if (!phone) return fail("Enter a valid 10-digit phone number.", 400);
  if (!EMAIL_RE.test(email) || email.length > 254) return fail("Enter a valid email address.", 400);

  // the email must be proven
  const proof = b?.proof || {};
  let google = false;
  if (proof.kind === "google") {
    const g = readToken<{ email: string; exp: number }>("google", proof.token);
    if (!g || g.email !== email) return fail("Your Google sign-in has expired. Tap Continue with Google again.", 401);
    google = true;
  } else if (!emailCodeValid(email, proof.code, proof.token, proof.expires)) {
    return fail("That verification code is wrong or has expired. Request a new one.", 401);
  }

  const password = String(b?.password ?? "");
  if (!google && (password.length < 6 || password.length > 200)) return fail("Use a password of at least 6 characters.", 400);

  let school = "", schoolId: string | null = null, region = "";
  if (role === "teacher") {
    const s = (SCHOOLS as any[]).find((x) => x.id === b?.schoolId);
    if (!s) return fail("Choose your school from the list.", 400);
    school = s.name; schoolId = s.id; region = s.region;
  } else if (role === "student") {
    school = String(b?.school ?? "").replace(/\s+/g, " ").trim().slice(0, 100);
  }

  try {
    const { data, error } = await db().from("gp_accounts").insert({
      email, phone, name, role, google, school, school_id: schoolId, region, avatar_color: avatar,
      password_hash: google ? null : await hashPassword(password), stats: emptyStats(),
    }).select("*").single();
    if (error) {
      if (error.code === "23505") return fail(/phone/.test(error.message + error.details) ? "This phone number is already registered." : "This email address is already registered. Sign in instead.", 409);
      throw error;
    }
    return signedIn(data as AccountRow, 201);
  } catch (e) {
    if (e instanceof NotConfigured) return fail("Accounts are not set up yet. Please contact GhanaPrep support.", 500);
    console.error("register failed:", (e as any)?.message);
    return fail("Could not create your account. Try again.", 500);
  }
}
