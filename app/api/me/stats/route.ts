// Records one answered practice question for the signed-in student.
// Note: the score still comes from the app (objective answers are checked and theory is marked
// in the browser), so a determined student could send made-up scores.
import { sameOrigin, tooLarge, limited, MINUTE } from "@/lib/api-guard";
import { readSession } from "@/lib/server/auth";
import { db, NotConfigured } from "@/lib/server/db";
import { applyAnswer, fail, findAccount, json } from "@/lib/server/users";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Forbidden origin.", 403);
  if (tooLarge(req, 2_000)) return fail("Request too large.", 413);
  const s = readSession(req);
  if (!s) return fail("Not signed in.", 401);
  if (limited(`stats:${s.uid}`, 60, MINUTE)) return fail("Too many answers too quickly.", 429);

  let b: any;
  try { b = await req.json(); } catch { return fail("Invalid request.", 400); }
  const score = Number(b?.score);
  const mode = b?.mode === "theory" ? "theory" : "objectives";
  const topic = String(b?.topic ?? "").slice(0, 80);
  if (!Number.isFinite(score) || score < 0 || score > 10) return fail("Invalid score.", 400);

  try {
    const a = await findAccount("id", s.uid);
    if (!a) return fail("Not signed in.", 401);
    const stats = applyAnswer(a.stats, Math.round(score * 10) / 10, topic, mode);
    const { error } = await db().from("gp_accounts").update({ stats }).eq("id", a.id);
    if (error) throw error;
    return json({ stats });
  } catch (e) {
    if (e instanceof NotConfigured) return fail("Accounts are not set up yet.", 500);
    console.error("stats update failed:", (e as any)?.message);
    return fail("Could not save your progress. Try again.", 500);
  }
}
