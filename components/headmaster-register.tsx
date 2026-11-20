"use client";
// Headmaster dashboard: attendance-style weekly register for a classroom, and one student's report.
import { useEffect, useState } from "react";
import { timeAgo, formatDate, type Classroom, type Member } from "@/lib/classrooms";
import { weeklyRegister, studentReport, weekStart, weekDays, weekLabel, DAY_LABELS, isActive, type DayActivity, type StudentReport } from "@/lib/student-report";

const font = "'DM Sans',system-ui,sans-serif", display = "'Syne','DM Sans',sans-serif";
const muted = "#8899aa";
const DAY = 86400000, WEEK = 7 * DAY;
const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;

function describe(a: DayActivity | undefined) {
  if (!isActive(a)) return "No activity";
  return [a!.practice && plural(a!.practice, "practice question"), a!.assignments && plural(a!.assignments, "assignment") + " handed in", a!.quizzes && plural(a!.quizzes, "quiz", "quizzes")].filter(Boolean).join(", ");
}

function ActivityCell({ a, future }: { a: DayActivity | undefined; future?: boolean }) {
  const on = isActive(a);
  return (
    <span title={future ? "" : describe(a)} aria-label={future ? "Not yet" : on ? "Active: " + describe(a) : "Not active"}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 7, fontSize: 13, fontWeight: 800,
        background: future ? "transparent" : on ? "rgba(34,197,94,.22)" : "rgba(255,255,255,.05)", color: on ? "#4ade80" : "#4b5a55",
        border: future ? "1px dashed rgba(255,255,255,.08)" : on ? "1px solid rgba(34,197,94,.5)" : "1px solid rgba(255,255,255,.06)" }}>
      {future ? "" : on ? "✓" : "–"}
    </span>
  );
}

const th = { fontWeight: 600, color: muted, fontSize: 11, padding: "2px 2px 8px" } as const;

/* ---------- weekly register for one classroom ---------- */
export function ClassRegister({ members, onStudent }: { members: Member[]; onStudent: (m: Member) => void }) {
  const now = Date.now(), thisWeek = weekStart(now);
  const [start, setStart] = useState(thisWeek);
  const rows = weeklyRegister(members, start);
  const days = weekDays(start);
  const navBtn = { width: 34, height: 34, borderRadius: 8, border: "1px solid rgba(255,255,255,.14)", background: "#1e271f", color: "#f0f4f8", cursor: "pointer", fontSize: 17 } as const;
  const active = rows.filter((r) => r.activeDays > 0).length;
  const title = start === thisWeek ? "This week" : start === weekStart(thisWeek - WEEK + DAY) ? "Last week" : "Week of";

  return (
    <div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: "#111814" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <button type="button" aria-label="Previous week" onClick={() => setStart(weekStart(start - WEEK + DAY))} style={navBtn}>‹</button>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 13, fontWeight: 700 }}>{title}</p>
          <p style={{ fontSize: 12, color: muted }}>{weekLabel(start)}</p>
        </div>
        <button type="button" aria-label="Next week" disabled={start >= thisWeek} onClick={() => setStart(weekStart(start + WEEK + DAY))} style={{ ...navBtn, opacity: start >= thisWeek ? 0.3 : 1 }}>›</button>
      </div>

      {members.length === 0 ? <p style={{ fontSize: 13, color: muted, padding: "6px 0" }}>No students have joined yet.</p> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>
              <th style={{ ...th, textAlign: "left", paddingLeft: 0 }}>Student</th>
              {DAY_LABELS.map((d) => <th key={d} style={{ ...th, width: 30 }}>{d.slice(0, 2)}</th>)}
              <th style={{ ...th, textAlign: "right", paddingRight: 0 }}>Days</th>
            </tr></thead>
            <tbody>{rows.map((r) => {
              const m = members.find((x) => x.phone === r.phone)!;
              return (
                <tr key={r.phone} style={{ borderTop: "1px solid rgba(255,255,255,.05)" }}>
                  <td style={{ padding: "6px 6px 6px 0", maxWidth: 140 }}>
                    <button type="button" onClick={() => onStudent(m)} style={{ background: "none", border: "none", padding: 0, color: "#34d399", fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: font, textDecoration: "underline", textUnderlineOffset: 2 }}>{r.name}</button>
                  </td>
                  {r.days.map((a, i) => <td key={i} style={{ textAlign: "center", padding: "6px 2px" }}><ActivityCell a={a} future={days[i] > now} /></td>)}
                  <td style={{ textAlign: "right", padding: "6px 0 6px 6px", fontWeight: 800 }}>{r.activeDays}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
      <p style={{ fontSize: 11.5, color: muted, marginTop: 10, lineHeight: 1.5 }}>
        {members.length ? `${active} of ${plural(members.length, "student")} active that week. ` : ""}✓ means the student practised, handed in an assignment or took a quiz that day. Tap a name for their full report.
      </p>
    </div>
  );
}

/* ---------- one student's report ---------- */
export function ReportSheet({ member, room, onClose }: { member: Member; room: Classroom; onClose: () => void }) {
  const [rep, setRep] = useState<StudentReport | null>(null);
  useEffect(() => {
    setRep(studentReport(member, room));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [member.phone, room.id]);
  if (!rep) return null;

  const p = rep.practice, now = Date.now();
  const sec = { fontFamily: display, fontWeight: 800, fontSize: 14, margin: "20px 0 8px" } as const;
  const tile = { background: "#111814", border: "1px solid rgba(255,255,255,.06)", borderRadius: 10, padding: "10px 12px" } as const;
  const statusColor: Record<string, string> = { Graded: "#4ade80", Submitted: "#38bdf8", Pending: "#e8c468", Overdue: "#f87171" };

  return (
    <div role="dialog" aria-modal="true" aria-label={`Report for ${rep.name}`} onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto", background: "#0f1512", border: "1px solid rgba(255,255,255,.1)", borderRadius: "18px 18px 0 0", padding: "18px 18px 32px", fontFamily: font, color: "#f0f4f8" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", letterSpacing: ".14em", textTransform: "uppercase" }}>Student report</p>
            <h2 style={{ fontFamily: display, fontSize: 21, fontWeight: 800, marginTop: 4 }}>{rep.name}</h2>
            <p style={{ fontSize: 12.5, color: muted, marginTop: 2 }}>{room.name} · {room.subject} · {room.level} · {room.teacherName}</p>
            <p style={{ fontSize: 12.5, color: muted, marginTop: 2 }}>{p.lastActive ? "Last active " + timeAgo(p.lastActive).toLowerCase() : "Not active yet"}{p.streak ? ` · ${p.streak}-day streak` : ""}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close report" style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,.14)", background: "#1e271f", color: "#f0f4f8", fontSize: 18, cursor: "pointer" }}>×</button>
        </div>

        <p style={sec}>Weekly activity</p>
        <div style={{ ...tile, overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
            <thead><tr>
              <th style={{ ...th, textAlign: "left", paddingLeft: 0 }}>Week</th>
              {DAY_LABELS.map((d) => <th key={d} style={th}>{d.slice(0, 2)}</th>)}
              <th style={{ ...th, textAlign: "right", paddingRight: 0 }}>Days</th>
            </tr></thead>
            <tbody>{rep.weeks.map((w) => {
              const ds = weekDays(w.start);
              return (
                <tr key={w.start}>
                  <td style={{ padding: "4px 8px 4px 0", whiteSpace: "nowrap", color: muted }}>{weekLabel(w.start)}</td>
                  {w.days.map((a, i) => <td key={i} style={{ textAlign: "center", padding: "4px 2px" }}><ActivityCell a={a} future={ds[i] > now} /></td>)}
                  <td style={{ textAlign: "right", padding: "4px 0 4px 6px", fontWeight: 800 }}>{w.activeDays}/7</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>

        <p style={sec}>Practice results</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8 }}>
          {([["Questions answered", String(p.done)], ["Average score", p.average === null ? "-" : p.average + "/10"],
             ["Objectives", p.objDone ? `${p.objAverage}/10` : "-", p.objDone ? plural(p.objDone, "question") : ""],
             ["Theory", p.theoryDone ? `${p.theoryAverage}/10` : "-", p.theoryDone ? plural(p.theoryDone, "question") : ""]] as [string, string, string?][]).map(([l, v, sub]) => (
            <div key={l} style={tile}>
              <p style={{ fontSize: 11, color: muted }}>{l}</p>
              <p style={{ fontFamily: display, fontWeight: 800, fontSize: 18, marginTop: 3 }}>{v}</p>
              {sub ? <p style={{ fontSize: 11, color: muted }}>{sub}</p> : null}
            </div>
          ))}
        </div>
        {p.weak.length > 0 && <p style={{ fontSize: 12.5, color: muted, marginTop: 8 }}>Needs help with: <b style={{ color: "#e8c468" }}>{p.weak.map((w) => w.topic).join(", ")}</b></p>}

        <p style={sec}>Assignments in this class</p>
        {rep.assignments.length === 0 ? <p style={{ fontSize: 13, color: muted }}>The teacher has not set any assignments yet.</p> : rep.assignments.map((a, i) => (
          <div key={i} style={{ ...tile, marginBottom: 6, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13.5, fontWeight: 600 }}>{a.title}</p>
              <p style={{ fontSize: 11.5, color: muted }}>Due {formatDate(a.dueAt)}{a.late ? " · handed in late" : ""}</p>
              {a.feedback ? <p style={{ fontSize: 11.5, color: muted, fontStyle: "italic" }}>Teacher: “{a.feedback}”</p> : null}
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {a.marks !== null ? <p style={{ fontFamily: display, fontWeight: 800, fontSize: 15 }}>{a.marks}/{a.totalMarks}</p> : null}
              <p style={{ fontSize: 11.5, fontWeight: 700, color: statusColor[a.status] || muted }}>{a.status}{a.pct !== null ? ` · ${a.pct}%` : ""}</p>
            </div>
          </div>
        ))}

        <p style={sec}>Teacher quizzes</p>
        {rep.quizzes.length === 0 ? <p style={{ fontSize: 13, color: muted }}>No quiz results yet.</p> : rep.quizzes.map((q, i) => (
          <div key={i} style={{ ...tile, marginBottom: 6, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13.5, fontWeight: 600 }}>{q.title}</p>
              <p style={{ fontSize: 11.5, color: muted }}>{[q.subject, q.at ? formatDate(q.at) : ""].filter(Boolean).join(" · ")}</p>
            </div>
            <p style={{ fontFamily: display, fontWeight: 800, fontSize: 15, color: q.pct >= 50 ? "#4ade80" : "#f87171", flexShrink: 0 }}>
              {q.pct}%{q.total ? <span style={{ fontSize: 11.5, color: muted, fontWeight: 600 }}> ({q.correct}/{q.total})</span> : null}
            </p>
          </div>
        ))}

        <p style={{ fontSize: 11, color: muted, marginTop: 18, lineHeight: 1.5 }}>Practice days are recorded from the day this report was added. Earlier weeks only show assignments and quizzes, which carry their own dates.</p>
      </div>
    </div>
  );
}
