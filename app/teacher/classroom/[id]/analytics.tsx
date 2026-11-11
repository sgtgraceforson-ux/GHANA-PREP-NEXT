"use client";
// TAB 4: Impact / Analytics. Every figure comes from lib/analytics.ts (real classroom data only).
// "Export report as PDF" opens the device's print screen with a clean, light report page;
// the teacher chooses "Save as PDF" there. No PDF library is needed.
import { useEffect, useState, type ReactNode } from "react";
import { FileDown, TrendingUp, Users, ClipboardCheck, TriangleAlert, Trophy, LifeBuoy } from "lucide-react";
import type { Classroom } from "@/lib/classrooms";
import { formatCode } from "@/lib/classrooms";
import { classroomAnalytics, PASS_MARK, type Analytics, type StudentAverage, type WeekPoint } from "@/lib/analytics";

// Colours are CSS variables so the same markup prints as a light report.
const CSS = `
.gp-an{--ink:#f0f4f8;--muted:#8899aa;--faint:#566370;--card:#161d18;--line:rgba(255,255,255,.08);--track:rgba(255,255,255,.07);--bar:#34d399;--gold:#e8c468;--bad:#f87171;--surface:#0a0f0d;color:var(--ink)}
.gp-an *{box-sizing:border-box}
.gp-an-print{display:none}
.gp-an-row:hover .gp-an-fill,.gp-an-row:focus-visible .gp-an-fill{filter:brightness(1.18)}
.gp-an-row:focus-visible,.gp-an-pt:focus-visible{outline:2px solid var(--bar);outline-offset:3px;border-radius:6px}
.gp-an-pt{cursor:pointer}
@media print{
  html,html body:not(:has(.gp-none)){background:#fff !important;background-image:none !important}
  body *{visibility:hidden !important}
  .gp-an,.gp-an *{visibility:visible !important}
  .gp-an{--ink:#111827;--muted:#4b5563;--faint:#6b7280;--card:#fff;--line:#d1d5db;--track:#e5e7eb;--bar:#059669;--gold:#92670b;--bad:#b91c1c;--surface:#fff;position:absolute;left:0;top:0;width:100%;padding:0 4mm;font-size:11pt}
  .gp-an-print{display:block}
  .gp-an-noprint{display:none !important}
  .gp-an-card{break-inside:avoid;box-shadow:none !important}
  @page{margin:14mm}
}`;

const card = { background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: 16, marginBottom: 12 } as const;
const h3 = { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: "var(--ink)" } as const;
const sub = { fontSize: 12, color: "var(--muted)", marginTop: 3, lineHeight: 1.5 } as const;
const empty = { fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginTop: 12 } as const;
const pc = (n: number | null) => (n === null ? "—" : n + "%");

function Tile({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note: string }) {
  return (
    <div className="gp-an-card" style={{ ...card, marginBottom: 0, padding: "13px 14px" }}>
      <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>{icon}{label}</p>
      <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, marginTop: 6, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11, color: "var(--faint)", marginTop: 6, lineHeight: 1.4 }}>{note}</p>
    </div>
  );
}

/* Average score per assignment: horizontal bars, so long titles stay readable on a phone. */
function AssignmentBars({ a }: { a: Analytics }) {
  const rows = a.perAssignment.slice(-8); // the 8 most recent
  return (
    <div className="gp-an-card" style={card}>
      <p style={h3}>Average score per assignment</p>
      <p style={sub}>Graded work only, as a percentage of each assignment's total marks.{a.perAssignment.length > 8 ? ` Showing the latest 8 of ${a.perAssignment.length}.` : ""}</p>
      {rows.length === 0 ? <p style={empty}>No assignments yet. Create one in the Assignments tab.</p> : (
        <ul data-testid="an-bars" style={{ listStyle: "none", margin: "14px 0 0", padding: 0 }}>
          {rows.map((r) => (
            <li key={r.id} className="gp-an-row" tabIndex={0} data-assignment-bar={r.title} title={r.average === null ? `${r.title}: nothing graded yet (${r.submitted} submitted)` : `${r.title}: ${r.average}% average from ${r.graded} graded, ${r.submitted} of ${r.students} submitted`} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                <span style={{ fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{r.average === null ? <span style={{ color: "var(--faint)", fontWeight: 600 }}>Not graded</span> : r.average + "%"}</span>
              </div>
              <div style={{ height: 10, borderRadius: 4, background: "var(--track)", overflow: "hidden" }}>
                {r.average !== null && <div className="gp-an-fill" style={{ width: `${Math.max(r.average, 1.5)}%`, height: "100%", background: "var(--bar)", borderRadius: "0 4px 4px 0", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as any} />}
              </div>
              <p style={{ fontSize: 11, color: "var(--faint)", marginTop: 4 }}>{r.graded} graded · {r.submitted} of {r.students} submitted</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StudentList({ title, icon, tone, list, emptyText }: { title: string; icon: ReactNode; tone: string; list: StudentAverage[]; emptyText: string }) {
  return (
    <div className="gp-an-card" style={{ ...card, marginBottom: 0 }}>
      <p style={{ ...h3, display: "flex", alignItems: "center", gap: 7 }}><span style={{ color: tone, display: "inline-flex" }}>{icon}</span>{title}</p>
      {list.length === 0 ? <p style={empty}>{emptyText}</p> : (
        <ol style={{ listStyle: "none", margin: "10px 0 0", padding: 0 }}>
          {list.map((s, i) => (
            <li key={s.phone} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
              <span style={{ width: 18, fontSize: 12, fontWeight: 700, color: "var(--faint)" }}>{i + 1}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                <span style={{ display: "block", fontSize: 11, color: "var(--faint)" }}>{s.graded} graded</span>
              </span>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15 }}>{s.average}%</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* Class average over the last 4 weeks. One series, so no legend: the title names it. */
function ProgressLine({ weeks }: { weeks: WeekPoint[] }) {
  const [sel, setSel] = useState<number | null>(null);
  const W = 360, H = 220, L = 38, R = 14, T = 26, B = 34; // sized so labels stay readable on a phone
  const x = (i: number) => L + (i * (W - L - R)) / (weeks.length - 1);
  const y = (v: number) => T + ((100 - v) * (H - T - B)) / 100;
  const pts = weeks.map((w, i) => (w.average === null ? null : { i, x: x(i), y: y(w.average), v: w.average }));
  // join only neighbouring weeks that both have data, so a week with no graded work shows as a gap
  const segs: string[] = []; let cur: string[] = [];
  pts.forEach((p) => { if (p) cur.push(`${p.x},${p.y}`); else { if (cur.length > 1) segs.push(cur.join(" ")); cur = []; } });
  if (cur.length > 1) segs.push(cur.join(" "));
  const any = pts.some(Boolean);
  const shown = sel !== null ? weeks[sel] : null;
  const short = (w: WeekPoint) => new Date(w.to).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return (
    <div className="gp-an-card" style={card}>
      <p style={h3}>Progress over time</p>
      <p style={sub}>Class average for work handed in during each of the last 4 weeks.</p>
      {!any ? <p style={empty}>No graded work in the last 4 weeks yet. Grade a submission and it will appear here.</p> : (<>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={"Class average by week: " + weeks.map((w) => `${w.label}, ${w.average === null ? "no graded work" : w.average + " percent"}`).join("; ")} style={{ width: "100%", maxWidth: 560, height: "auto", display: "block", marginTop: 12 }} data-testid="an-line">
          {[0, 50, 100].map((g) => (
            <g key={g}>
              <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke="var(--line)" strokeWidth={1} strokeDasharray={g === 0 ? undefined : "3 4"} />
              <text x={L - 8} y={y(g) + 4} textAnchor="end" fontSize={11} fill="var(--faint)">{g}%</text>
            </g>
          ))}
          {weeks.map((w, i) => <text key={i} x={x(i)} y={H - 10} textAnchor={i === 0 ? "start" : i === weeks.length - 1 ? "end" : "middle"} fontSize={11} fill="var(--muted)">{i === weeks.length - 1 ? "This week" : "to " + short(w)}</text>)}
          {segs.map((s, i) => <polyline key={i} points={s} fill="none" stroke="var(--bar)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />)}
          {pts.map((p) => p && (
            <g key={p.i} className="gp-an-pt" tabIndex={0} role="button" aria-label={`${weeks[p.i].label}: ${p.v} percent from ${weeks[p.i].graded} graded`}
              onMouseEnter={() => setSel(p.i)} onMouseLeave={() => setSel(null)} onFocus={() => setSel(p.i)} onBlur={() => setSel(null)} onClick={() => setSel(p.i)}>
              <circle cx={p.x} cy={p.y} r={16} fill="transparent" />
              <circle cx={p.x} cy={p.y} r={sel === p.i ? 6.5 : 5} fill="var(--bar)" stroke="var(--card)" strokeWidth={2} />
              <text x={p.x} y={p.y - 12} textAnchor={p.i === 0 ? "start" : p.i === weeks.length - 1 ? "end" : "middle"} fontSize={12} fontWeight={700} fill="var(--ink)">{p.v}%</text>
            </g>
          ))}
        </svg>
        <p className="gp-an-noprint" aria-live="polite" style={{ fontSize: 12, color: "var(--muted)", minHeight: 18, marginTop: 4 }}>
          {shown ? `${shown.label}: ${shown.average === null ? "no graded work" : shown.average + "% from " + shown.graded + " graded"}` : "Tap a point for the details."}
        </p>
        {/* the same numbers as a table, for print and screen readers */}
        <table className="gp-an-print" style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt", marginTop: 8 }}>
          <thead><tr>{["Week", "Class average", "Graded work"].map((hd) => <th key={hd} style={{ textAlign: "left", borderBottom: "1px solid var(--line)", padding: "4px 0" }}>{hd}</th>)}</tr></thead>
          <tbody>{weeks.map((w) => <tr key={w.from}><td style={{ padding: "3px 0" }}>{w.label}</td><td>{w.average === null ? "No graded work" : w.average + "%"}</td><td>{w.graded}</td></tr>)}</tbody>
        </table>
      </>)}
    </div>
  );
}

export function AnalyticsTab({ room }: { room: Classroom }) {
  const [a, setA] = useState<Analytics | null>(null);
  useEffect(() => { setA(classroomAnalytics(room)); }, [room.id]);
  if (!a) return null;
  const when = new Date(a.generatedAt).toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="gp-an" data-testid="analytics">
      <style>{CSS}</style>

      {/* heading that only appears on the exported report */}
      <div className="gp-an-print" style={{ borderBottom: "2px solid var(--ink)", paddingBottom: 10, marginBottom: 14 }}>
        <p style={{ fontSize: "9pt", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)" }}>GhanaPrep · Class impact report</p>
        <p style={{ fontSize: "18pt", fontWeight: 800, marginTop: 4 }}>{room.name}</p>
        <p style={{ fontSize: "10pt", color: "var(--muted)", marginTop: 3 }}>{room.subject} · {room.level} · {room.term} · Code {formatCode(room.code)} · Teacher: {room.teacherName}</p>
        <p style={{ fontSize: "10pt", color: "var(--muted)", marginTop: 2 }}>Generated {when}</p>
      </div>

      <div className="gp-an-noprint" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>{a.students} student{a.students === 1 ? "" : "s"} · {a.assignments} assignment{a.assignments === 1 ? "" : "s"} · {a.gradedTotal} graded</p>
        <button type="button" onClick={() => window.print()} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 14px", border: "none", borderRadius: 10, background: "#22c55e", color: "#000", fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}><FileDown size={15} aria-hidden /> Export report as PDF</button>
      </div>

      {a.students === 0 && (
        <div className="gp-an-card" style={card}><p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>No students have joined this classroom yet. Share the code <b style={{ color: "var(--bar)" }}>{formatCode(room.code)}</b>; the numbers below fill in as students join, submit and get graded.</p></div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 }}>
        <Tile icon={<TrendingUp size={13} aria-hidden />} label="Class average" value={pc(a.classAverage)} note={a.gradedTotal ? `${a.gradedTotal} graded` : "Nothing graded yet"} />
        <Tile icon={<Users size={13} aria-hidden />} label="Active this week" value={pc(a.activeThisWeek.pct)} note={a.students ? `${a.activeThisWeek.count} of ${a.students} students` : "No students yet"} />
        <Tile icon={<ClipboardCheck size={13} aria-hidden />} label="Assignments done" value={pc(a.completion.pct)} note={a.completion.expected ? `${a.completion.submitted} of ${a.completion.expected} handed in` : "No assignments yet"} />
      </div>

      <AssignmentBars a={a} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginBottom: 12 }}>
        <StudentList title="Top 5 students" icon={<Trophy size={16} aria-hidden />} tone="var(--gold)" list={a.top}
          emptyText={a.ranked === 0 ? "Appears once you have graded at least one submission." : `No student is averaging ${PASS_MARK}% or more yet.`} />
        <StudentList title="Need help" icon={<LifeBuoy size={16} aria-hidden />} tone="var(--bad)" list={a.needHelp}
          emptyText={a.ranked === 0 ? "Appears once you have graded at least one submission." : `Nobody is averaging below ${PASS_MARK}%.`} />
      </div>
      <p style={{ fontSize: 11, color: "var(--faint)", margin: "-4px 2px 12px", lineHeight: 1.5 }}>By average score across graded assignments. "Need help" lists up to 5 students averaging below {PASS_MARK}%, lowest first.</p>

      <div className="gp-an-card" style={card}>
        <p style={{ ...h3, display: "flex", alignItems: "center", gap: 7 }}><span style={{ color: "var(--gold)", display: "inline-flex" }}><TriangleAlert size={16} aria-hidden /></span>Weak topics</p>
        <p style={sub}>From the built-in objective questions in your assignments, marked against the answer key.</p>
        {a.weakTopics.length === 0 ? (
          <p style={empty}>{a.topicAnswers === 0 ? "Nothing to show yet. Add built-in objective questions to an assignment; once students hand it in, the topics they get wrong appear here." : "No topic has wrong answers so far."}</p>
        ) : (
          <ol data-testid="an-topics" style={{ listStyle: "none", margin: "10px 0 0", padding: 0 }}>
            {a.weakTopics.map((t, i) => (
              <li key={t.topic} style={{ padding: "10px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, minWidth: 0, overflowWrap: "anywhere" }}>{i + 1}. {t.topic}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, flexShrink: 0 }}>{t.failed}% failed</span>
                </div>
                <p style={{ fontSize: 11, color: "var(--faint)", marginTop: 2 }}>{t.wrong} of {t.answers} answers wrong</p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <ProgressLine weeks={a.weeks} />
    </div>
  );
}
