"use client";
// Parent area. A parent adds each child with the private code from the child's app, then sees a
// read-only report: practice progress, assignments and marks, and an Export report as PDF button.
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Target, Flame, Clock, FileDown, UserPlus, TriangleAlert, GraduationCap } from "lucide-react";
import { getParent, logoutParent, listWards, linkWard, unlink, wardReport, type Parent, type Ward, type WardReport, type ReportAssignment } from "@/lib/parents";
import { formatDate, timeAgo } from "@/lib/classrooms";
import { ParentSkeleton } from "@/components/skeletons";

// Colours are CSS variables so the same markup prints as a light report.
const CSS = `
.gp-pr{--ink:#f0f4f8;--muted:#8899aa;--faint:#566370;--card:#161d18;--line:rgba(255,255,255,.08);--ok:#34d399;--gold:#e8c468;--bad:#f87171;--info:#7dd3fc;color:var(--ink)}
.gp-pr *,.gp-pp *{box-sizing:border-box}
.gp-pr-print{display:none}
.gp-pp input:focus{border-color:#22c55e !important}
@media print{
  html,html body:not(:has(.gp-none)){background:#fff !important;background-image:none !important}
  body *{visibility:hidden !important}
  .gp-pr,.gp-pr *{visibility:visible !important}
  .gp-pr{--ink:#111827;--muted:#4b5563;--faint:#6b7280;--card:#fff;--line:#d1d5db;--ok:#047857;--gold:#92670b;--bad:#b91c1c;--info:#075985;position:absolute;left:0;top:0;width:100%;padding:0 4mm;font-size:11pt}
  .gp-pr-print{display:block}
  .gp-pr-noprint{display:none !important}
  .gp-pr-card{break-inside:avoid}
  @page{margin:14mm}
}`;
const page = { minHeight: "100vh", background: "#0a0f0d", color: "#f0f4f8", fontFamily: "'DM Sans',sans-serif", display: "flex", justifyContent: "center", padding: "24px 18px 48px" } as const;
const card = { background: "var(--card, #161d18)", border: "1px solid var(--line, rgba(255,255,255,.08))", borderRadius: 14, padding: 16, marginBottom: 12 } as const;
const h3 = { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15 } as const;
const btn = { padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,.16)", background: "#1e271f", color: "#f0f4f8", fontWeight: 600, fontSize: 12, cursor: "pointer" } as const;
const primary = { padding: "12px 18px", border: "none", borderRadius: 10, background: "#22c55e", color: "#000", fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" } as const;
const STATUS_VAR: Record<string, string> = { Pending: "var(--gold)", Submitted: "var(--info)", Graded: "var(--ok)", Overdue: "var(--bad)" };

function Tile({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note: string }) {
  return (
    <div className="gp-pr-card" style={{ ...card, marginBottom: 0, padding: "13px 14px" }}>
      <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>{icon}{label}</p>
      <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, marginTop: 6, lineHeight: 1.1 }}>{value}</p>
      <p style={{ fontSize: 11, color: "var(--faint)", marginTop: 5, lineHeight: 1.4 }}>{note}</p>
    </div>
  );
}

function AssignmentRow({ a, first }: { a: ReportAssignment; first: boolean }) {
  return (
    <li data-ward-assignment={a.title} style={{ padding: "11px 0", borderTop: first ? "none" : "1px solid var(--line)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 600, minWidth: 0, overflowWrap: "anywhere" }}>{a.title}</span>
        <span data-status={a.status} style={{ fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 999, color: STATUS_VAR[a.status], border: "1px solid currentColor", whiteSpace: "nowrap", flexShrink: 0 }}>{a.status}</span>
      </div>
      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
        Due {formatDate(a.dueAt)} · {a.marks !== null ? <b style={{ color: "var(--ink)" }}>{a.marks} / {a.totalMarks} marks ({a.percent}%)</b> : `${a.totalMarks} marks`}
        {a.submittedAt && a.marks === null ? " · handed in, waiting to be graded" : ""}
      </p>
      {a.feedback && <p style={{ fontSize: 13, lineHeight: 1.55, marginTop: 7, paddingLeft: 10, borderLeft: "2px solid var(--line)", overflowWrap: "anywhere" }}><span style={{ color: "var(--muted)", fontSize: 11, fontWeight: 700 }}>Teacher's feedback: </span>{a.feedback}</p>}
    </li>
  );
}

function Report({ r, parent, onRemove }: { r: WardReport; parent: Parent; onRemove: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const when = new Date(r.generatedAt).toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="gp-pr" data-testid="ward-report">
      <div className="gp-pr-print" style={{ borderBottom: "2px solid var(--ink)", paddingBottom: 10, marginBottom: 14 }}>
        <p style={{ fontSize: "9pt", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)" }}>GhanaPrep · Progress report</p>
        <p style={{ fontSize: "18pt", fontWeight: 800, marginTop: 4 }}>{r.name}</p>
        <p style={{ fontSize: "10pt", color: "var(--muted)", marginTop: 3 }}>{r.school ? r.school + " · " : ""}Prepared for {parent.name} · {when}</p>
      </div>

      <div className="gp-pr-noprint" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 19, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</p>
          {r.school && <p style={{ fontSize: 12, color: "var(--muted)" }}>{r.school}</p>}
        </div>
        <button type="button" onClick={() => window.print()} style={{ ...primary, display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 14px" }}><FileDown size={15} aria-hidden /> Export report as PDF</button>
      </div>

      <p style={{ ...h3, margin: "4px 0 10px" }}>Practice progress</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <Tile icon={<BookOpen size={13} aria-hidden />} label="Questions answered" value={String(r.answered)} note={r.answered ? `${r.objectives} objective · ${r.theory} theory · ${r.answeredToday} today` : "No practice yet"} />
        <Tile icon={<Target size={13} aria-hidden />} label="Average score" value={r.average === null ? "—" : `${r.average}/10`} note={r.average === null ? "Appears after the first question" : "Across all practice questions"} />
        <Tile icon={<Flame size={13} aria-hidden />} label="Streak" value={`${r.streak} day${r.streak === 1 ? "" : "s"}`} note="Days in a row with practice" />
        <Tile icon={<Clock size={13} aria-hidden />} label="Last active" value={r.lastActive ? timeAgo(r.lastActive) : "Not yet"} note={r.lastActive ? formatDate(r.lastActive) : "Has not practised yet"} />
      </div>

      <div className="gp-pr-card" style={card}>
        <p style={{ ...h3, display: "flex", alignItems: "center", gap: 7 }}><span style={{ color: "var(--gold)", display: "inline-flex" }}><TriangleAlert size={16} aria-hidden /></span>Topics to work on</p>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>Topics where practice answers scored below 6 out of 10.</p>
        {r.weakTopics.length === 0 ? <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12, lineHeight: 1.6 }}>{r.answered ? "No weak topics so far." : "Nothing to show until there is some practice."}</p> : (
          <ol data-testid="ward-topics" style={{ listStyle: "none", margin: "10px 0 0", padding: 0 }}>
            {r.weakTopics.map((t, i) => (
              <li key={t.topic} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "9px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <span style={{ fontSize: 14, fontWeight: 600, minWidth: 0, overflowWrap: "anywhere" }}>{t.topic}</span>
                <span style={{ fontSize: 13, color: "var(--muted)", flexShrink: 0 }}>{t.misses} low score{t.misses === 1 ? "" : "s"}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <p style={{ ...h3, margin: "18px 0 4px" }}>Assignments and marks</p>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
        {r.assignmentsTotal === 0 ? "Set by teachers in the classrooms your child has joined." : `${r.assignmentsSubmitted} of ${r.assignmentsTotal} handed in · ${r.assignmentsGraded} graded${r.assignmentAverage !== null ? ` · average ${r.assignmentAverage}%` : ""}`}
      </p>
      {r.classrooms.length === 0 ? (
        <div className="gp-pr-card" style={card}><p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{r.name.split(" ")[0]} has not joined a classroom yet. Assignments and marks appear here once a teacher adds them to one.</p></div>
      ) : r.classrooms.map((c) => (
        <div key={c.id} className="gp-pr-card" style={card} data-ward-classroom={c.name}>
          <p style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 14 }}><GraduationCap size={16} color="var(--ok)" aria-hidden />{c.name}</p>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{c.subject} · {c.level} · {c.term} · Teacher: {c.teacherName}</p>
          {c.assignments.length === 0 ? <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 10 }}>No assignments in this classroom yet.</p> : (
            <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0 }}>{c.assignments.map((a, i) => <AssignmentRow key={a.id} a={a} first={i === 0} />)}</ul>
          )}
        </div>
      ))}

      <div className="gp-pr-noprint" style={{ marginTop: 18 }}>
        {confirm ? (
          <div role="alertdialog" aria-label="Confirm remove" style={{ background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.3)", borderRadius: 10, padding: "10px 12px" }}>
            <p style={{ fontSize: 13, marginBottom: 9 }}>Remove {r.name} from your list? You will need their code to add them again.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={onRemove} style={{ ...btn, background: "#f87171", borderColor: "#f87171", color: "#1a0505", fontWeight: 800 }}>Yes, remove</button>
              <button type="button" onClick={() => setConfirm(false)} style={btn}>Keep</button>
            </div>
          </div>
        ) : <button type="button" onClick={() => setConfirm(true)} style={{ ...btn, color: "#f87171", borderColor: "rgba(248,113,113,.35)" }}>Remove this child</button>}
      </div>
    </div>
  );
}

export default function ParentPage() {
  const router = useRouter();
  const [parent, setParent] = useState<Parent | null>(null);
  const [wards, setWards] = useState<Ward[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [report, setReport] = useState<WardReport | null>(null);

  useEffect(() => {
    const me = getParent();
    if (!me) { logoutParent(); router.replace("/"); return; } // not a signed-in parent
    setParent(me);
    const w = listWards(me.phone); setWards(w); setSel(w[0]?.phone || null);
    // run once when the page opens, so choosing or adding a child is never reset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { setReport(parent && sel ? wardReport(parent.phone, sel) : null); }, [parent, sel, wards]);

  if (!parent) return <ParentSkeleton />;

  function add() {
    const r = linkWard(parent!.phone, code);
    if (!r.ok) { setMsg({ ok: false, text: r.error || "Could not add." }); return; }
    setWards(listWards(parent!.phone)); setSel(r.ward!.phone); setCode(""); setAdding(false);
    setMsg({ ok: true, text: `${r.ward!.name} added. You can now see their progress.` });
  }
  function remove(phone: string) {
    unlink(parent!.phone, phone); const w = listWards(parent!.phone);
    setWards(w); setSel(w[0]?.phone || null); setMsg({ ok: true, text: "Removed from your list." });
  }
  const showForm = adding || wards.length === 0;

  return (
    <div className="gp-pp" style={page}>
      <style>{CSS}</style>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", letterSpacing: ".16em", textTransform: "uppercase" }}>Parent</p>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, margin: "4px 0" }}>Welcome, {parent.name.split(" ")[0]}</h1>
            <p style={{ fontSize: 13, color: "#8899aa" }}>{wards.length === 0 ? "Add your child to see their progress." : `Following ${wards.length} ${wards.length === 1 ? "child" : "children"}`}</p>
          </div>
          <button onClick={() => { logoutParent(); router.replace("/"); }} style={btn}>Sign out</button>
        </div>

        {wards.length > 0 && (
          <div role="tablist" aria-label="Your children" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {wards.map((w) => (
              <button key={w.phone} role="tab" aria-selected={sel === w.phone} onClick={() => { setSel(w.phone); setMsg(null); }}
                style={{ padding: "9px 14px", borderRadius: 999, cursor: "pointer", fontWeight: 700, fontSize: 13, border: `1.5px solid ${sel === w.phone ? "#22c55e" : "rgba(255,255,255,.14)"}`, background: sel === w.phone ? "rgba(34,197,94,.15)" : "transparent", color: sel === w.phone ? "#22c55e" : "#8899aa" }}>{w.name.split(" ")[0]}</button>
            ))}
            {!adding && <button onClick={() => { setAdding(true); setMsg(null); }} style={{ ...btn, display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "9px 14px" }}><UserPlus size={14} aria-hidden /> Add a child</button>}
          </div>
        )}

        {showForm && (
          <div style={{ ...card, background: "#161d18", border: "1px solid rgba(255,255,255,.08)" }}>
            <p style={h3}>Add a child</p>
            <p style={{ fontSize: 13, color: "#8899aa", lineHeight: 1.6, margin: "5px 0 12px" }}>Ask your child to open GhanaPrep, tap <b style={{ color: "#f0f4f8" }}>Parent Access</b> on their home screen, and give you the code shown there.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setMsg(null); }} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="PA-7K2P9X" maxLength={10} aria-label="Child's parent code" autoCapitalize="characters" autoComplete="off"
                style={{ flex: "1 1 170px", minWidth: 0, padding: "12px 14px", background: "#1e271f", border: "1.5px solid rgba(255,255,255,.14)", borderRadius: 12, color: "#22c55e", font: "800 18px 'Syne',sans-serif", letterSpacing: ".14em", outline: "none" }} />
              <button onClick={add} style={primary}>Add child</button>
              {adding && wards.length > 0 && <button onClick={() => { setAdding(false); setCode(""); setMsg(null); }} style={{ ...btn, padding: "12px 14px" }}>Cancel</button>}
            </div>
          </div>
        )}
        {msg && <p role={msg.ok ? "status" : "alert"} style={{ background: msg.ok ? "rgba(34,197,94,.1)" : "rgba(248,113,113,.1)", border: `1px solid ${msg.ok ? "rgba(34,197,94,.3)" : "rgba(248,113,113,.3)"}`, color: msg.ok ? "#4ade80" : "#f87171", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{msg.text}</p>}

        {report && <Report key={report.phone} r={report} parent={parent} onRemove={() => remove(report.phone)} />}
      </div>
    </div>
  );
}
