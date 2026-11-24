// Leaderboard of students who have practised: all time, this week or today.
// Signed-in users only. Returns names, schools and scores, never contact details.
import { readSession } from "@/lib/server/auth";
import { db, NotConfigured } from "@/lib/server/db";
import { fail, json } from "@/lib/server/users";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const legacyDay = (t: number) => { const d = new Date(t); return `${d.toUTCString().slice(0, 3)} ${d.toUTCString().slice(8, 11)} ${String(d.getUTCDate()).padStart(2, "0")} ${d.getUTCFullYear()}`; };

export async function GET(req: Request) {
  if (!readSession(req)) return fail("Not signed in.", 401);
  const period = new URL(req.url).searchParams.get("period") || "alltime";
  try {
    const { data, error } = await db().from("gp_accounts").select("id, name, school, avatar_color, stats")
      .eq("role", "student").gt("stats->done", 0).limit(2000);
    if (error) throw error;
    const now = Date.now(), today = legacyDay(now), week = `W${Math.floor(now / (7 * 24 * 3600 * 1000))}`;
    const me = readSession(req)!.uid;
    const rows = (data || []).map((a: any) => {
      const s = a.stats || {};
      const doneToday = s.lastDay === today ? s.doneToday || 0 : 0;
      const weekScore = s.weekDay === week ? s.weekScore || 0 : 0;
      const score = period === "today" ? doneToday * 10 : period === "week" ? weekScore : s.totalScore || 0;
      return {
        name: a.name, school: a.school || "", avatarColor: a.avatar_color || "#22c55e",
        done: s.done || 0, totalScore: s.totalScore || 0, avgScore: s.done > 0 ? s.totalScore / s.done : 0,
        doneToday, weekScore, streak: s.streak || 0, score: Math.round(score * 10) / 10, me: a.id === me,
      };
    }).filter((r) => r.score > 0 || period === "alltime")
      .sort((x, y) => y.score - x.score || y.done - x.done)
      .slice(0, 50).map((r, i) => ({ ...r, rank: i + 1 }));
    return json({ rows });
  } catch (e) {
    if (e instanceof NotConfigured) return fail("Accounts are not set up yet.", 500);
    console.error("leaderboard failed:", (e as any)?.message);
    return fail("Could not load the leaderboard.", 500);
  }
}
