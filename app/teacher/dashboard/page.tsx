"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTeacher, logoutTeacher, clearRoleCookie, type Teacher } from "@/lib/teacher-auth";
import { ClassroomsPanel } from "../classrooms";
import { TeacherDashboardSkeleton } from "@/components/skeletons";

const read = (k: string, d: any) => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch { return d; } };

export default function TeacherDashboard() {
  const router = useRouter();
  const [t, setT] = useState<Teacher | null>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);

  useEffect(() => {
    const me = getTeacher();
    if (!me) { clearRoleCookie(); router.replace("/"); return; } // not a signed-in teacher
    setT(me);
    const all = Object.values(read("gp_quizzes_v1", {})) as any[];
    const results = read("gp_quiz_results_v1", {});
    setQuizzes(all.filter((q) => q.teacherPhone === me.phone).map((q) => ({ ...q, results: results[q.code] || [] })));
  }, [router]);

  if (!t) return <TeacherDashboardSkeleton />;

  const submissions = quizzes.reduce((n, q) => n + q.results.length, 0);
  const pcts = quizzes.flatMap((q) => q.results.map((r: any) => r.pct));
  const avg = pcts.length ? Math.round(pcts.reduce((a: number, b: number) => a + b, 0) / pcts.length) : null;
  const card = { background: "#161d18", border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: 16 } as const;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f0d", color: "#f0f4f8", fontFamily: "'DM Sans',sans-serif", display: "flex", justifyContent: "center", padding: "24px 18px 48px" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", letterSpacing: ".16em", textTransform: "uppercase" }}>Teacher dashboard</p>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, margin: "4px 0" }}>Welcome, {t.fullName.split(" ")[0]}</h1>
            <p style={{ fontSize: 13, color: "#8899aa" }}>{t.school} · {t.region}</p>
          </div>
          <button onClick={() => { logoutTeacher(); router.replace("/"); }} style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,.16)", background: "#1e271f", color: "#8899aa", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Sign out</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
          {[["Quizzes", quizzes.length], ["Submissions", submissions], ["Class average", avg === null ? "-" : avg + "%"]].map(([l, v]) => (
            <div key={l as string} style={card}><p style={{ fontSize: 11, color: "#8899aa" }}>{l}</p><p style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, marginTop: 4 }}>{v}</p></div>
          ))}
        </div>

        <ClassroomsPanel teacher={t} />

        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15 }}>Your quizzes</p>
            <button onClick={() => { window.location.href = "/?quizhub=1"; }} style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: "#22c55e", color: "#000", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Create Quiz</button>
          </div>
          {quizzes.length === 0 ? (
            <p style={{ fontSize: 13, color: "#8899aa", lineHeight: 1.6 }}>No quizzes yet. Tap Create Quiz to set one. It will appear here with its access code and student results.</p>
          ) : quizzes.map((q) => (
            <div key={q.code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid rgba(255,255,255,.07)" }}>
              <div><p style={{ fontWeight: 600, fontSize: 14 }}>{q.title}</p><p style={{ fontSize: 12, color: "#8899aa" }}>{q.subject} · {q.results.length} submitted</p></div>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, letterSpacing: ".12em", color: "#22c55e" }}>{q.code}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
