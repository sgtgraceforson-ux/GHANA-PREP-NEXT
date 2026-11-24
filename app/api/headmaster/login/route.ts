// Headmaster sign-in: checks a school's headmaster code on the server.
// POST { code }        -> { school } when the code is right
// POST { code, name }  -> the same, and signs the headmaster in (signed cookie for that school)
// The codes are worked out here from HEADMASTER_CODE_SECRET and never leave the server.
import SCHOOLS from "@/lib/schools.json";
import { buildHeadCodes, normalizeHeadCode } from "@/lib/headmaster-codes.mjs";
import { sameOrigin, clientIp, tooLarge, limited, MINUTE, HOUR } from "@/lib/api-guard";
import { signToken, clearSessionCookie } from "@/lib/server/auth";
import { HEAD_COOKIE } from "@/lib/server/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const fail = (error: string, status: number) => Response.json({ error }, { status });

let cache: { secret: string; byCode: Map<string, any> } | null = null;
function codes(secret: string) {
  if (!cache || cache.secret !== secret) cache = { secret, byCode: buildHeadCodes(SCHOOLS, secret).byCode };
  return cache.byCode;
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Forbidden origin.", 403);
  if (tooLarge(req, 2_000)) return fail("Request too large.", 413);

  const secret = process.env.HEADMASTER_CODE_SECRET;
  if (!secret) return fail("Headmaster sign-in is not set up yet. Please contact GhanaPrep support.", 500);

  // A code is only 4 digits per school, so guessing must be slow.
  const ip = clientIp(req);
  if (limited(`head:${ip}`, 12, 15 * MINUTE) || limited(`head-day:${ip}`, 40, 24 * HOUR)) {
    return fail("Too many tries. Wait a while, then try again, or contact GhanaPrep support.", 429);
  }
  if (limited("head:all", 300, HOUR)) return fail("Sign-in is busy right now. Try again in a little while.", 429);

  let body: any;
  try { body = await req.json(); } catch { return fail("Invalid request.", 400); }
  const code = normalizeHeadCode(body?.code);
  const nameOf = String(body?.name ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (!code) return fail("Enter your code in the form ABC-1234.", 400);

  const school = codes(secret).get(code);
  if (!school) return fail("That code is not correct. Check it and try again.", 401);
  const out = JSON.stringify({ school: { id: school.id, name: school.name, region: school.region, town: school.town } });
  const name = nameOf;
  if (!name) return new Response(out, { headers: { "Content-Type": "application/json" } });
  const DAYS = 30, secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const token = signToken("head", { schoolId: school.id, name, exp: Date.now() + DAYS * 86400000 });
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append("Set-Cookie", `${HEAD_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DAYS * 86400}${secure}`);
  headers.append("Set-Cookie", clearSessionCookie()); // a headmaster session replaces any student/teacher one
  return new Response(out, { headers });
}
