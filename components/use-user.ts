"use client";
import { useEffect, useState } from "react";

const read = (k: string, d: any) => {
  try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch { return d; }
};

const toStats = (st: any = {}) => ({
  done: st.done || 0,
  doneToday: st.lastDay === new Date().toDateString() ? st.doneToday || 0 : 0,
  totalScore: st.totalScore || 0,
  streak: st.streak || 0,
  weak: st.weak || {},
});

// The signed-in student's account and the live leaderboard, from the GhanaPrep database.
// Shows the device's cached copy first, then the server's answer.
export function useGhanaUser() {
  const [s, setS] = useState<any>({ ready: false, stats: toStats(), rows: [] });
  useEffect(() => {
    const session = read("gp_session_v3", null);
    const cached = session ? read("gp_local_accs", {})[session.phone] : null;
    const base = { session, name: cached?.name || session?.name || "", school: cached?.school || "", phone: session?.phone || "", last: read("gp_last_practice", null) };
    setS({ ready: true, ...base, stats: toStats(cached?.stats), rows: [] });
    if (!session) return;
    let alive = true;
    (async () => {
      try {
        const [me, lb] = await Promise.all([
          fetch("/api/me", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
          fetch("/api/leaderboard?period=alltime", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        ]);
        if (!alive) return;
        const u = me?.user;
        const rows = (lb?.rows || []).map((r: any) => ({ name: r.name, school: r.school, done: r.done, points: Math.round(r.totalScore || 0), me: !!r.me }));
        setS((prev: any) => ({ ...prev, name: u?.name || prev.name, school: u?.school ?? prev.school, stats: u ? toStats(u.stats) : prev.stats, rows }));
      } catch {}
    })();
    return () => { alive = false; };
  }, []);
  return s;
}
