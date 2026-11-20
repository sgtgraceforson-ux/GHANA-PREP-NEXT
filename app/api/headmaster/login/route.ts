// Headmaster sign-in: checks a school's headmaster code on the server.
// POST { code } -> { school } when the code is right.
// The codes are worked out here from HEADMASTER_CODE_SECRET and never leave the server.
import SCHOOLS from "@/lib/schools.json";
import { buildHeadCodes, normalizeHeadCode } from "@/lib/headmaster-codes.mjs";
import { sameOrigin, clientIp, tooLarge, limited, MINUTE, HOUR } from "@/lib/api-guard";

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
  if (limited(`head:${ip}`, 8, 15 * MINUTE) || limited(`head-day:${ip}`, 30, 24 * HOUR)) {
    return fail("Too many tries. Wait a while, then try again, or contact GhanaPrep support.", 429);
  }
  if (limited("head:all", 300, HOUR)) return fail("Sign-in is busy right now. Try again in a little while.", 429);

  let body: any;
  try { body = await req.json(); } catch { return fail("Invalid request.", 400); }
  const code = normalizeHeadCode(body?.code);
  if (!code) return fail("Enter your code in the form ABC-1234.", 400);

  const school = codes(secret).get(code);
  if (!school) return fail("That code is not correct. Check it and try again.", 401);
  return Response.json({ school: { id: school.id, name: school.name, region: school.region, town: school.town } });
}
