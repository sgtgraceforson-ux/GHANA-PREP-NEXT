// Shared protection for the API routes (server-side only).
//
// What this does: blocks other websites and simple scripts from using the routes, caps request
// size, and limits how often one visitor (and everyone together) can call them.
// What it cannot do: tell who the caller is. There are no server-side accounts yet, and a
// determined attacker can fake request headers. The limits are also kept in this server
// instance's memory, so on serverless hosting each instance counts separately. For a hard
// guarantee, move the counters to a shared store (for example Upstash Redis or Vercel KV).

/** True only for requests sent by this site's own pages. */
export function sameOrigin(req: Request) {
  const host = req.headers.get("host");
  const origin = req.headers.get("origin");
  // Browsers always send Origin on a POST. A request without one is a script, not our app.
  if (!host || !origin) return false;
  // Sent by modern browsers and cannot be set by page scripts.
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  try { return new URL(origin).host === host; } catch { return false; }
}

/** Best available client address. On Vercel these headers are set by the platform, not the caller. */
export function clientIp(req: Request) {
  return (
    req.headers.get("x-real-ip") ||
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "unknown"
  );
}

/** Rejects bodies larger than `maxBytes` (as declared by the client) before they are read. */
export function tooLarge(req: Request, maxBytes: number) {
  const len = Number(req.headers.get("content-length"));
  return Number.isFinite(len) && len > maxBytes;
}

const hits = new Map<string, number[]>();

/**
 * Sliding-window limiter. Returns true when `key` has already been used `max` times in the
 * last `windowMs`; otherwise records this use and returns false.
 */
export function limited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= max) { hits.set(key, recent); return true; }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10000) {
    for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > 24 * 3600_000) hits.delete(k);
  }
  return false;
}

export const MINUTE = 60_000;
export const HOUR = 3600_000;
export const DAY = 24 * HOUR;
