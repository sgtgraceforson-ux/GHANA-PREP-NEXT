// GET  /api/data            -> the signed-in person's snapshot (only what they may see)
// POST /api/data {action,..} -> one checked change, then the fresh snapshot
import { sameOrigin, tooLarge, limited, MINUTE } from "@/lib/api-guard";
import { NotConfigured } from "@/lib/server/db";
import { ACTIONS, ActionError, snapshot, viewerFrom } from "@/lib/server/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const who = (v: any) => (v.kind === "head" ? "head:" + v.schoolId : v.acc.id);

function failure(e: unknown) {
  if (e instanceof ActionError) return json({ ok: false, error: e.message }, e.status);
  if (e instanceof NotConfigured) return json({ ok: false, error: "The database is not set up yet." }, 500);
  console.error("data route failed:", (e as any)?.message || e);
  return json({ ok: false, error: "Something went wrong. Try again." }, 500);
}

export async function GET(req: Request) {
  try {
    const v = await viewerFrom(req);
    if (!v) return json({ ok: false, error: "Not signed in." }, 401);
    if (limited(`data-get:${who(v)}`, 90, MINUTE)) return json({ ok: false, error: "Too many requests." }, 429);
    return json({ ok: true, snapshot: await snapshot(v) });
  } catch (e) { return failure(e); }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ ok: false, error: "Forbidden origin." }, 403);
  if (tooLarge(req, 3_500_000)) return json({ ok: false, error: "That is too large to upload." }, 413);
  try {
    const v = await viewerFrom(req);
    if (!v) return json({ ok: false, error: "Not signed in." }, 401);
    if (limited(`data-post:${who(v)}`, 60, MINUTE)) return json({ ok: false, error: "Too many changes too quickly. Wait a moment." }, 429);
    let b: any;
    try { b = await req.json(); } catch { return json({ ok: false, error: "Invalid request." }, 400); }
    const fn = ACTIONS[String(b?.action)];
    if (!fn) return json({ ok: false, error: "Unknown action." }, 400);
    const result = await fn(v, b);
    return json({ ok: true, result, snapshot: await snapshot(v) });
  } catch (e) { return failure(e); }
}
