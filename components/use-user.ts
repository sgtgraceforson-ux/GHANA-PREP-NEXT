"use client";
import { useEffect, useState } from "react";

const read = (k: string, d: any) => {
  try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch { return d; }
};

// Reads the same localStorage data the practice app writes (demo/local mode).
export function useGhanaUser() {
  const [s, setS] = useState<any>({ ready: false, stats: { done: 0, doneToday: 0, totalScore: 0, streak: 0, weak: {} }, rows: [] });
  useEffect(() => {
    const session = read("gp_session_v3", null);
    const accs = read("gp_local_accs", {});
    const me = session ? accs[session.phone] : null;
    const st = me?.stats || {};
    const stats = {
      done: st.done || 0,
      doneToday: st.lastDay === new Date().toDateString() ? st.doneToday || 0 : 0,
      totalScore: st.totalScore || 0,
      streak: st.streak || 0,
      weak: st.weak || {},
    };
    const rows = Object.values(accs)
      .filter((a: any) => (a.stats?.done || 0) > 0)
      .map((a: any) => ({ name: a.name, school: a.school || "", done: a.stats.done, points: Math.round(a.stats.totalScore || 0), me: a.phone === session?.phone }))
      .sort((a: any, b: any) => b.points - a.points);
    setS({ ready: true, session, name: me?.name || session?.name || "", school: me?.school || "", phone: session?.phone || "", stats, rows, last: read("gp_last_practice", null) });
  }, []);
  return s;
}
