"use client";
import { useEffect, useMemo, useState } from "react";
import { listMembers, formatDate, timeAgo, type Classroom, type Member } from "@/lib/classrooms";
import {
  bankFor, createAssignment, listAssignments, listSubmissions, gradeSubmission, statusFor, mcqCheck, endOfDay,
  MAX_FILE, MAX_TOTAL, STATUS_COLOR, type Assignment, type Attachment, type Submission, type Status,
} from "@/lib/assignments";

const card = { background: "#161d18", border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: 16 } as const;
const lbl = { display: "block", fontSize: 11, fontWeight: 700, color: "#8899aa", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 } as const;
const inp = { width: "100%", padding: "12px 14px", background: "#1e271f", border: "1.5px solid rgba(255,255,255,.12)", borderRadius: 12, color: "#f0f4f8", font: "500 14px 'DM Sans',sans-serif", outline: "none" } as const;
const btn = { padding: "8px 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,.16)", background: "#1e271f", color: "#f0f4f8", fontWeight: 600, fontSize: 12, cursor: "pointer" } as const;
const primary = { padding: "10px 16px", border: "none", borderRadius: 10, background: "#22c55e", color: "#000", fontWeight: 800, fontSize: 13, cursor: "pointer" } as const;
const dg = (p: string) => String(p || "").replace(/\D/g, "");
const errTxt = (m?: string) => m ? <p role="alert" style={{ color: "#f87171", fontSize: 12, marginTop: 5 }}>{m}</p> : null;

export function Chip({ status }: { status: Status }) {
  const c = STATUS_COLOR[status];
  return <span data-status={status} style={{ fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 999, color: c, border: `1px solid ${c}66`, background: `${c}1a`, whiteSpace: "nowrap" }}>{status}</span>;
}

const readFile = (f: File) => new Promise<Attachment>((res, rej) => {
  const r = new FileReader();
  r.onload = () => res({ name: f.name, type: f.type, size: f.size, dataUrl: String(r.result) });
  r.onerror = () => rej(r.error); r.readAsDataURL(f);
});

/* ---------------- create ---------------- */
function CreateModal({ room, onClose, onCreated }: { room: Classroom; onClose: () => void; onCreated: (a: Assignment) => void }) {
  const today = new Date(); const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [title, setTitle] = useState(""); const [instructions, setInstructions] = useState("");
  const [due, setDue] = useState(""); const [marks, setMarks] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [sel, setSel] = useState<string[]>([]);
  const [kind, setKind] = useState("all"); const [topic, setTopic] = useState("all");
  const [err, setErr] = useState<Record<string, string>>({});
  const bank = useMemo(() => bankFor(room.subject, room.level), [room.subject, room.level]);
  const topics = useMemo(() => Array.from(new Set(bank.map((q) => q.topic))), [bank]);
  const shown = bank.filter((q) => (kind === "all" || q.kind === kind) && (topic === "all" || q.topic === topic));
  const toggle = (k: string) => setSel(sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k]);

  async function addFiles(list: FileList | null) {
    if (!list) return; const next = [...files]; let msg = "";
    for (const f of Array.from(list)) {
      const total = next.reduce((n, x) => n + x.size, 0);
      if (f.size > MAX_FILE) { msg = `${f.name} is larger than 700 KB.`; continue; }
      if (total + f.size > MAX_TOTAL) { msg = "Attachments are limited to 1.5 MB in total."; continue; }
      next.push(await readFile(f));
    }
    setFiles(next); setErr({ ...err, files: msg });
  }
  function submit() {
    const e: Record<string, string> = {}; const m = Number(marks);
    if (title.trim().length < 3) e.title = "Enter a title";
    if (!due) e.due = "Choose a due date"; else if (endOfDay(due) < Date.now()) e.due = "The due date cannot be in the past";
    if (!marks || !Number.isFinite(m) || m <= 0 || m > 1000) e.marks = "Enter total marks between 1 and 1000";
    setErr(e); if (Object.keys(e).length) return;
    try {
      onCreated(createAssignment(room, { title, instructions, dueAt: endOfDay(due), totalMarks: m, attachments: files, questions: bank.filter((q) => sel.includes(q.key)) }));
    } catch { setErr({ files: "Could not save: browser storage is full. Remove some files and try again." }); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
      <div role="dialog" aria-label="Create assignment" style={{ ...card, width: "100%", maxWidth: 500, maxHeight: "94vh", overflowY: "auto", background: "#0f1410" }}>
        <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 14 }}>Create assignment</p>
        <div style={{ marginBottom: 12 }}><label style={lbl}>Title</label><input style={inp} value={title} onChange={(e) => { setTitle(e.target.value); setErr({ ...err, title: "" }); }} placeholder="e.g. Algebra practice 1" aria-label="Title" />{errTxt(err.title)}</div>
        <div style={{ marginBottom: 12 }}><label style={lbl}>Instructions</label><textarea style={{ ...inp, minHeight: 80, resize: "vertical" }} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="What should students do?" aria-label="Instructions" /></div>
        <div style={{ marginBottom: 12 }}><label style={lbl}>Subject (from the classroom)</label><input style={{ ...inp, opacity: 0.7 }} value={room.subject} readOnly disabled aria-label="Subject" /></div>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}><label style={lbl}>Due date</label><input type="date" min={todayStr} style={inp} value={due} onChange={(e) => { setDue(e.target.value); setErr({ ...err, due: "" }); }} aria-label="Due date" />{errTxt(err.due)}</div>
          <div style={{ flex: 1 }}><label style={lbl}>Total marks</label><input type="number" min={1} max={1000} style={inp} value={marks} onChange={(e) => { setMarks(e.target.value); setErr({ ...err, marks: "" }); }} placeholder="e.g. 20" aria-label="Total marks" />{errTxt(err.marks)}</div>
        </div>

        <p style={{ ...lbl, marginTop: 16 }}>Attachments (optional)</p>
        <div style={{ ...card, marginBottom: 12 }}>
          <label style={{ ...lbl, textTransform: "none", letterSpacing: 0, fontSize: 12 }}>Upload files (max 700 KB each)</label>
          <input type="file" multiple aria-label="Upload files" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} style={{ fontSize: 12, color: "#8899aa" }} />
          {files.map((f, i) => (
            <div key={f.name + i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 8 }}>
              <span>{f.name} <span style={{ color: "#566370" }}>({Math.max(1, Math.round(f.size / 1024))} KB)</span></span>
              <button onClick={() => setFiles(files.filter((_, j) => j !== i))} style={{ ...btn, padding: "3px 9px" }}>Remove</button>
            </div>
          ))}
          {errTxt(err.files)}
        </div>

        <div style={{ ...card, marginBottom: 16 }}>
          <label style={{ ...lbl, textTransform: "none", letterSpacing: 0, fontSize: 12 }}>Select questions from the app&apos;s built-in questions</label>
          {bank.length === 0 ? <p style={{ fontSize: 12, color: "#8899aa" }}>No built-in questions for {room.subject} yet. You can still upload files.</p> : (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <select style={{ ...inp, padding: "8px 10px", fontSize: 12 }} value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Question type"><option value="all">All types</option><option value="mcq">Objective</option><option value="theory">Theory</option></select>
                <select style={{ ...inp, padding: "8px 10px", fontSize: 12 }} value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Question topic"><option value="all">All topics</option>{topics.map((t) => <option key={t} value={t}>{t}</option>)}</select>
              </div>
              <p style={{ fontSize: 12, color: "#22c55e", fontWeight: 700, marginBottom: 6 }}><span data-testid="selected-count">{sel.length}</span> selected · {shown.length} shown {sel.length > 0 && <button onClick={() => setSel([])} style={{ ...btn, padding: "2px 8px", marginLeft: 6 }}>Clear</button>}</p>
              <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10 }}>
                {shown.map((q) => (
                  <label key={q.key} style={{ display: "flex", gap: 10, padding: "9px 10px", borderBottom: "1px solid rgba(255,255,255,.06)", cursor: "pointer", fontSize: 12 }}>
                    <input type="checkbox" checked={sel.includes(q.key)} onChange={() => toggle(q.key)} aria-label={`Select question: ${q.question.slice(0, 40)}`} style={{ width: 16, flexShrink: 0 }} />
                    <span><span style={{ display: "block" }}>{q.question.length > 110 ? q.question.slice(0, 110) + "…" : q.question}</span><span style={{ color: "#566370" }}>{q.topic} · {q.year} · {q.kind === "mcq" ? "Objective" : "Theory"}</span></span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ ...btn, flex: 1, padding: 12 }}>Cancel</button>
          <button onClick={submit} style={{ ...primary, flex: 2, borderRadius: 999 }}>Create assignment</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- detail + grading ---------------- */
function Detail({ room, a, onBack }: { room: Classroom; a: Assignment; onBack: () => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [subs, setSubs] = useState<Record<string, Submission>>({});
  const [grading, setGrading] = useState<string | null>(null);
  const [marks, setMarks] = useState(""); const [fb, setFb] = useState(""); const [gerr, setGerr] = useState("");
  const load = () => { setMembers(listMembers(room.id)); const m: Record<string, Submission> = {}; listSubmissions(a.id).forEach((s) => { m[s.phone] = s; }); setSubs(m); };
  useEffect(() => { load(); }, [a.id]);
  const done = members.filter((m) => subs[dg(m.phone)]);
  const missing = members.filter((m) => !subs[dg(m.phone)]);
  const graded = done.filter((m) => subs[dg(m.phone)].gradedAt).length;

  function open(m: Member) { const s = subs[dg(m.phone)]; setGrading(dg(m.phone)); setMarks(s.marks === null ? "" : String(s.marks)); setFb(s.feedback || ""); setGerr(""); }
  function save() {
    const r = gradeSubmission(a.id, grading!, marks === "" ? NaN : Number(marks), fb);
    if (!r.ok) { setGerr(r.error); return; }
    setGrading(null); load();
  }

  return (
    <div>
      <button onClick={onBack} style={{ ...btn, marginBottom: 12 }}>&lsaquo; All assignments</button>
      <div style={{ ...card, marginBottom: 12 }}>
        <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17 }}>{a.title}</p>
        <p style={{ fontSize: 12, color: "#8899aa", margin: "4px 0 8px" }}>{a.subject} · Due {formatDate(a.dueAt)} · {a.totalMarks} marks · {a.questions.length} built-in question{a.questions.length === 1 ? "" : "s"}</p>
        {a.instructions && <p style={{ fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{a.instructions}</p>}
        {a.attachments.map((f) => <a key={f.name} href={f.dataUrl} download={f.name} style={{ display: "block", fontSize: 12, color: "#22c55e", marginTop: 6 }}>Attachment: {f.name}</a>)}
        <p data-testid="summary" style={{ fontSize: 13, fontWeight: 700, color: "#22c55e", marginTop: 10 }}>Submitted {done.length} of {members.length} · Graded {graded}</p>
      </div>

      <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, margin: "14px 0 8px" }}>Submitted ({done.length})</p>
      {done.length === 0 && <p style={{ fontSize: 13, color: "#8899aa" }}>No submissions yet.</p>}
      {done.map((m) => {
        const s = subs[dg(m.phone)]; const chk = mcqCheck(a, s); const isOpen = grading === dg(m.phone);
        return (
          <div key={m.phone} data-student={m.name} style={{ ...card, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</p>
                <p style={{ fontSize: 12, color: "#8899aa" }}>Submitted {timeAgo(s.submittedAt)}{s.late && <b style={{ color: "#f87171" }}> · Late</b>}</p>
                <p data-testid="marks" style={{ fontSize: 12, color: s.gradedAt ? "#22c55e" : "#566370", fontWeight: 700 }}>{s.gradedAt ? `${s.marks} / ${a.totalMarks}` : "Not graded"}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                <Chip status={statusFor(a, s)} />
                <button onClick={() => (isOpen ? setGrading(null) : open(m))} style={btn}>{isOpen ? "Close" : s.gradedAt ? "Edit grade" : "Grade"}</button>
              </div>
            </div>
            {isOpen && (
              <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 12 }}>
                {s.text && <><p style={lbl}>Answer</p><p style={{ fontSize: 13, whiteSpace: "pre-wrap", marginBottom: 10 }}>{s.text}</p></>}
                {a.questions.map((q, i) => {
                  const ans = s.answers[q.key];
                  return (
                    <div key={q.key} style={{ fontSize: 12, marginBottom: 8 }}>
                      <p style={{ color: "#8899aa" }}>Q{i + 1}. {q.question}</p>
                      <p style={{ fontWeight: 600, color: q.kind === "mcq" ? (ans === q.correct ? "#22c55e" : "#f87171") : "#f0f4f8" }}>
                        {ans ? ans : "No answer"}{q.kind === "mcq" && ans && ans !== q.correct ? `  (correct: ${q.correct})` : ""}
                      </p>
                    </div>
                  );
                })}
                {chk.total > 0 && <p style={{ fontSize: 12, color: "#8899aa", marginBottom: 10 }}>Objective check: {chk.correct} of {chk.total} correct</p>}
                <label style={lbl}>Marks (out of {a.totalMarks})</label>
                <input type="number" step="0.5" min={0} max={a.totalMarks} style={{ ...inp, marginBottom: 10 }} value={marks} onChange={(e) => { setMarks(e.target.value); setGerr(""); }} aria-label="Marks" />
                <label style={lbl}>Feedback</label>
                <textarea style={{ ...inp, minHeight: 70, resize: "vertical", marginBottom: 6 }} value={fb} onChange={(e) => setFb(e.target.value)} placeholder="Write feedback for the student" aria-label="Feedback" />
                {errTxt(gerr)}
                <button onClick={save} style={{ ...primary, marginTop: 8 }}>Save grade</button>
              </div>
            )}
          </div>
        );
      })}

      <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, margin: "16px 0 8px" }}>Not submitted ({missing.length})</p>
      {missing.length === 0 && <p style={{ fontSize: 13, color: "#8899aa" }}>Everyone has submitted.</p>}
      {missing.map((m) => (
        <div key={m.phone} data-student={m.name} style={{ ...card, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</p><Chip status={statusFor(a, null)} />
        </div>
      ))}
    </div>
  );
}

/* ---------------- tab ---------------- */
export function AssignmentsTab({ room }: { room: Classroom }) {
  const [list, setList] = useState<Assignment[]>([]);
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const refresh = () => setList(listAssignments(room.id));
  useEffect(() => { refresh(); }, [room.id]);
  const open = openId ? list.find((x) => x.id === openId) : null;
  if (open) return <Detail room={room} a={open} onBack={() => { setOpenId(null); refresh(); }} />;
  const n = listMembers(room.id).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15 }}>Assignments ({list.length})</p>
        <button onClick={() => setCreating(true)} style={primary}>Create Assignment</button>
      </div>
      {list.length === 0 ? <div style={card}><p style={{ fontSize: 13, color: "#8899aa" }}>No assignments yet. Create one and your students will see it in their app.</p></div> :
        list.map((a) => {
          const subs = listSubmissions(a.id); const g = subs.filter((s) => s.gradedAt).length; const past = Date.now() > a.dueAt;
          return (
            <button key={a.id} onClick={() => setOpenId(a.id)} data-assignment={a.title} style={{ ...card, display: "block", width: "100%", textAlign: "left", marginBottom: 8, cursor: "pointer", color: "inherit" }}>
              <p style={{ fontWeight: 700, fontSize: 14 }}>{a.title}</p>
              <p style={{ fontSize: 12, color: past && subs.length < n ? "#f87171" : "#8899aa", marginTop: 3 }}>{past && subs.length < n ? "Overdue · " : ""}Due {formatDate(a.dueAt)} · {a.totalMarks} marks</p>
              <p style={{ fontSize: 12, color: "#22c55e", fontWeight: 700, marginTop: 3 }}>{subs.length}/{n} submitted · {g} graded</p>
            </button>
          );
        })}
      {creating && <CreateModal room={room} onClose={() => setCreating(false)} onCreated={(a) => { setCreating(false); refresh(); setOpenId(a.id); }} />}
    </div>
  );
}
