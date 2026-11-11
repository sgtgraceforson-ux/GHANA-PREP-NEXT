"use client";
import { JoinBodySkeleton } from "@/components/skeletons";
import { useEffect, useState } from "react";
import { joinClassroom, listStudentClassrooms, normalizeCode, formatCode, type Classroom } from "@/lib/classrooms";

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
.jp *{box-sizing:border-box} .jp input:focus{border-color:#22c55e !important}`;
const card = { background: "#161d18", border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: 16 } as const;

export default function JoinClassroomPage() {
  const [student, setStudent] = useState<{ name: string; phone: string } | null | undefined>(undefined);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [joined, setJoined] = useState<Classroom | null>(null);
  const [mine, setMine] = useState<Classroom[]>([]);

  useEffect(() => {
    let s = null;
    try { s = JSON.parse(localStorage.getItem("gp_session_v3") || "null"); } catch {}
    setStudent(s);
    if (s) setMine(listStudentClassrooms(s.phone));
  }, []);

  function submit() {
    if (!student) return;
    if (normalizeCode(code).length !== 6) { setJoined(null); setMsg({ ok: false, text: "Invalid code. Check with your teacher." }); return; }
    const r = joinClassroom(student, code);
    if (r.ok) { setJoined(r.classroom); setMsg(null); setCode(""); setMine(listStudentClassrooms(student.phone)); }
    else { setJoined(null); setMsg({ ok: false, text: r.error }); }
  }

  return (
    <div className="jp" style={{ minHeight: "100vh", background: "#0a0f0d", color: "#f0f4f8", fontFamily: "'DM Sans',sans-serif", display: "flex", justifyContent: "center", padding: "28px 18px 48px" }}>
      <style>{CSS}</style>
      <div style={{ width: "100%", maxWidth: 430 }}>
        <a href="/" style={{ color: "#8899aa", fontSize: 13, textDecoration: "none" }}>&lsaquo; Back</a>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, margin: "14px 0 6px" }}>Join a classroom</h1>
        <p style={{ fontSize: 13, color: "#8899aa", marginBottom: 20 }}>Enter the 6-character code from your teacher, for example GH-7K2P9X.</p>

        {student === undefined ? <JoinBodySkeleton /> : student === null ? (
          <div style={card}><p style={{ fontSize: 14, marginBottom: 10 }}>Sign in to the student app first, then come back here.</p>
            <a href="/" style={{ color: "#22c55e", fontWeight: 700 }}>Go to student sign in</a></div>
        ) : (
          <>
            <input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setMsg(null); }} onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="GH-7K2P9X" maxLength={9} aria-label="Classroom code" autoCapitalize="characters" autoComplete="off"
              style={{ width: "100%", padding: "16px 14px", background: "#1e271f", border: "1.5px solid rgba(255,255,255,.14)", borderRadius: 12, color: "#22c55e", font: "800 24px 'Syne',sans-serif", letterSpacing: ".18em", textAlign: "center", outline: "none" }} />
            {msg && <div role="alert" style={{ marginTop: 12, background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.3)", color: "#f87171", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>{msg.text}</div>}
            <button onClick={submit} style={{ width: "100%", padding: 14, marginTop: 14, border: "none", borderRadius: 999, background: "#22c55e", color: "#000", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>Join classroom</button>

            {joined && (
              <div role="status" style={{ ...card, marginTop: 16, borderColor: "rgba(34,197,94,.4)" }}>
                <p style={{ color: "#22c55e", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>You joined this classroom</p>
                <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18 }}>{joined.name}</p>
                <p style={{ fontSize: 13, color: "#8899aa" }}>{joined.subject} · {joined.level} · {joined.term}</p>
                <p style={{ fontSize: 12, color: "#8899aa", marginTop: 4 }}>Teacher: {joined.teacherName}</p>
              </div>
            )}

            <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, margin: "24px 0 10px" }}>Your classrooms ({mine.length})</p>
            {mine.length === 0 ? <p style={{ fontSize: 13, color: "#8899aa" }}>You have not joined any classroom yet.</p> :
              mine.map((c) => (
                <div key={c.id} style={{ ...card, marginBottom: 10 }}>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</p>
                  <p style={{ fontSize: 12, color: "#8899aa" }}>{c.subject} · {c.level} · {c.term} · {c.teacherName}</p>
                  <a href={"/classrooms/" + c.id} style={{ display: "inline-block", marginTop: 8, color: "#22c55e", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Assignments &rsaquo;</a>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
