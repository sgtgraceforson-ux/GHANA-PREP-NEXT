// Accounts on the server: what the browser may see, and how practice stats are updated.
import { db } from "@/lib/server/db";
import { sessionCookie } from "@/lib/server/auth";

export type AccountRow = {
  id: string; email: string; phone: string; name: string; role: "student" | "teacher" | "parent";
  password_hash: string | null; google: boolean; school: string; school_id: string | null; region: string;
  avatar_color: string; stats: any; created_at: string; last_login_at: string | null;
};

/** The parts of an account the signed-in person's own browser receives (never the password hash). */
export function publicUser(a: AccountRow) {
  return {
    name: a.name, phone: a.phone, email: a.email, role: a.role, school: a.school, schoolId: a.school_id || "",
    region: a.region, avatar_color: a.avatar_color, stats: a.stats || {}, joined_at: Date.parse(a.created_at) || null, google: a.google,
  };
}

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const cleanEmail = (v: unknown) => String(v ?? "").trim().toLowerCase();
/** Ghana numbers: "024 123 4567", "+233 24 123 4567" -> "0241234567"; null if not 10 digits. */
export function cleanPhone(v: unknown) {
  let d = String(v ?? "").replace(/\D/g, "");
  if (d.startsWith("233") && d.length === 12) d = "0" + d.slice(3);
  return /^0\d{9}$/.test(d) ? d : null;
}
export const json = (body: unknown, status = 200, cookie?: string | string[]) => {
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const c of ([] as string[]).concat(cookie || [])) headers.append("Set-Cookie", c);
  return new Response(JSON.stringify(body), { status, headers });
};
export const fail = (error: string, status: number) => json({ error }, status);

export async function findAccount(by: "id" | "email" | "phone", value: string): Promise<AccountRow | null> {
  const { data, error } = await db().from("gp_accounts").select("*").eq(by, value).maybeSingle();
  if (error) throw error;
  return (data as AccountRow) || null;
}

/** Signs the person in: records the time and returns the response with the session cookie. */
export async function signedIn(a: AccountRow, status = 200) {
  await db().from("gp_accounts").update({ last_login_at: new Date().toISOString() }).eq("id", a.id);
  // signing in as a person also ends any headmaster session on this browser
  const endHead = `gp_head=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
  return json({ user: publicUser(a) }, status, [sessionCookie(a.id, a.role), endHead]);
}

/* ---------- practice stats (same rules the app used on the device) ---------- */
export const emptyStats = () => ({ done: 0, totalScore: 0, weak: {}, objDone: 0, theoryDone: 0, objScore: 0, theoryScore: 0, doneToday: 0, lastDay: "", streak: 0, weekScore: 0, weekDay: "", days: {} });

// Ghana uses GMT all year, so the server's UTC calendar day is the student's day.
const legacyDay = (t: number) => { const d = new Date(t); return `${d.toUTCString().slice(0, 3)} ${d.toUTCString().slice(8, 11)} ${String(d.getUTCDate()).padStart(2, "0")} ${d.getUTCFullYear()}`; }; // "Fri Nov 20 2026", like Date.toDateString()
const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10);

export function applyAnswer(stats: any, score: number, topic: string, mode: "objectives" | "theory", now = Date.now()) {
  const s = { ...emptyStats(), ...(stats || {}) };
  s.weak = { ...(s.weak || {}) }; s.days = { ...(s.days || {}) };
  const today = legacyDay(now), yesterday = legacyDay(now - 86400000);
  const week = `W${Math.floor(now / (7 * 24 * 3600 * 1000))}`;
  if (s.lastDay !== today) { s.streak = s.lastDay === yesterday ? (s.streak || 0) + 1 : 1; s.doneToday = 0; s.lastDay = today; }
  if (s.weekDay !== week) { s.weekScore = 0; s.weekDay = week; }
  s.done += 1; s.totalScore += score; s.weekScore += score; s.doneToday += 1;
  const k = dayKey(now); s.days[k] = (s.days[k] || 0) + 1;
  const keys = Object.keys(s.days).sort(); while (keys.length > 120) delete s.days[keys.shift()!];
  s.lastActiveAt = now;
  if (mode === "objectives") { s.objDone += 1; s.objScore += score; } else { s.theoryDone += 1; s.theoryScore += score; }
  if (score < 6 && topic) s.weak[topic] = (s.weak[topic] || 0) + 1;
  return s;
}
