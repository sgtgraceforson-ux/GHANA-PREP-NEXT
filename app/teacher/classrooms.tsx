"use client";
import { useEffect, useState } from "react";
import { SUBJECTS, LEVELS, TERMS, createClassroom, listTeacherClassrooms, regenerateCode, formatCode, type Classroom } from "@/lib/classrooms";
import type { Teacher } from "@/lib/teacher-auth";

const card = { background: "#161d18", border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: 16 } as const;
const lbl = { display: "block", fontSize: 11, fontWeight: 700, color: "#8899aa", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 } as const;
const inp = { width: "100%", padding: "12px 14px", background: "#1e271f", border: "1.5px solid rgba(255,255,255,.12)", borderRadius: 12, color: "#f0f4f8", font: "500 14px 'DM Sans',sans-serif", outline: "none" } as const;
const small = { padding: "7px 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,.16)", background: "#1e271f", color: "#f0f4f8", fontWeight: 600, fontSize: 12, cursor: "pointer", textDecoration: "none", display: "inline-block" } as const;

const waLink = (r: Classroom) =>
  "https://wa.me/?text=" + encodeURIComponent(`Join my GhanaPrep classroom "${r.name}" (${r.subject}, ${r.level}, ${r.term}). Open the student app, tap Join Classroom and enter the code ${formatCode(r.code)}. ${typeof window !== "undefined" ? window.location.origin : ""}`);

async function copyText(t: string) {
  try { await navigator.clipboard.writeText(t); }
  catch { const a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select(); document.execCommand("copy"); a.remove(); }
}

export function ClassroomsPanel({ teacher }: { teacher: Teacher }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", subject: "", level: "", term: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<Classroom | null>(null);
  const [copied, setCopied] = useState("");
  const refresh = () => setRooms(listTeacherClassrooms(teacher.email));
  useEffect(() => { refresh(); }, [teacher.email]);

  const up = (k: string) => (e: any) => { setF({ ...f, [k]: e.target.value }); setErr({ ...err, [k]: "" }); };
  const close = () => { setOpen(false); setCreated(null); setF({ name: "", subject: "", level: "", term: "" }); setErr({}); };
  function submit() {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 3) e.name = 'Enter a classroom name, e.g. "Form 3 Science A"';
    if (!f.subject) e.subject = "Choose one subject";
    if (!f.level) e.level = "Choose a class / level";
    if (!f.term) e.term = "Choose the school term";
    setErr(e); if (Object.keys(e).length) return;
    setCreated(createClassroom(teacher, f)); refresh();
  }
  async function copy(r: Classroom) { await copyText(formatCode(r.code)); setCopied(r.id); setTimeout(() => setCopied(""), 1800); }
  function regen(r: Classroom) {
    if (!window.confirm("Generate a new code? The old code will stop working.")) return;
    regenerateCode(r.id, teacher.email); refresh();
  }
  const err_ = (k: string) => err[k] && <p style={{ color: "#f87171", fontSize: 12, marginTop: 5 }}>{err[k]}</p>;

  return (
    <div style={{ ...card, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15 }}>Your classrooms</p>
        <button onClick={() => setOpen(true)} style={{ padding: "9px 14px", border: "none", borderRadius: 10, background: "#22c55e", color: "#000", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Create Classroom</button>
      </div>
      {rooms.length === 0 ? <p style={{ fontSize: 13, color: "#8899aa", lineHeight: 1.6 }}>No classrooms yet. Create one and share its code so students can join.</p> :
        rooms.map((r) => (
          <div key={r.id} style={{ padding: "12px 0", borderTop: "1px solid rgba(255,255,255,.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div><a href={"/teacher/classroom/" + r.id} style={{ fontWeight: 600, fontSize: 14, color: "#f0f4f8", textDecoration: "none", display: "block" }}>{r.name}</a><p style={{ fontSize: 12, color: "#8899aa" }}>{r.subject} · {r.level} · {r.term} · {r.count} student{r.count === 1 ? "" : "s"}</p></div>
              <span data-testid="code" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, letterSpacing: ".1em", color: "#22c55e", whiteSpace: "nowrap" }}>{formatCode(r.code)}</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <a href={"/teacher/classroom/" + r.id} style={{ ...small, background: "#22c55e", color: "#000", border: "none", fontWeight: 800 }}>Open</a>
              <button onClick={() => copy(r)} style={small}>{copied === r.id ? "Copied" : "Copy code"}</button>
              <a href={waLink(r)} target="_blank" rel="noopener noreferrer" style={small}>Share on WhatsApp</a>
              <button onClick={() => regen(r)} style={small}>Regenerate</button>
            </div>
          </div>
        ))}

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div role="dialog" aria-label="Create classroom" style={{ ...card, width: "100%", maxWidth: 440, maxHeight: "92vh", overflowY: "auto", background: "#0f1410" }}>
            {created ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Classroom created</p>
                <p style={{ fontSize: 13, color: "#8899aa", marginBottom: 14 }}>{created.name} · {created.subject} · {created.level} · {created.term}</p>
                <p style={{ fontSize: 11, color: "#8899aa", textTransform: "uppercase", letterSpacing: ".07em" }}>Join code</p>
                <p data-testid="new-code" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 34, letterSpacing: ".14em", color: "#22c55e", margin: "6px 0 16px" }}>{formatCode(created.code)}</p>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 14 }}>
                  <button onClick={() => copy(created)} style={small}>{copied === created.id ? "Copied" : "Copy code"}</button>
                  <a href={waLink(created)} target="_blank" rel="noopener noreferrer" style={small}>Share on WhatsApp</a>
                </div>
                <button onClick={close} style={{ width: "100%", padding: 12, border: "none", borderRadius: 999, background: "#22c55e", color: "#000", fontWeight: 800, cursor: "pointer" }}>Done</button>
              </div>
            ) : (
              <>
                <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 14 }}>Create classroom</p>
                <div style={{ marginBottom: 12 }}><label style={lbl}>Classroom name</label><input style={inp} value={f.name} onChange={up("name")} placeholder="Form 3 Science A" />{err_("name")}</div>
                <div style={{ marginBottom: 12 }}><label style={lbl}>Subject (pick one)</label>
                  <select style={inp} value={f.subject} onChange={up("subject")} aria-label="Subject"><option value="">Select a subject</option>{SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}</select>{err_("subject")}</div>
                <div style={{ marginBottom: 12 }}><label style={lbl}>Class / level</label>
                  <select style={inp} value={f.level} onChange={up("level")} aria-label="Class level"><option value="">Select class</option>{LEVELS.map((g) => <optgroup key={g.group} label={g.group}>{g.items.map((i) => <option key={i} value={i}>{i}</option>)}</optgroup>)}</select>{err_("level")}</div>
                <div style={{ marginBottom: 16 }}><label style={lbl}>School term</label>
                  <select style={inp} value={f.term} onChange={up("term")} aria-label="School term"><option value="">Select term</option>{TERMS.map((t) => <option key={t} value={t}>{t}</option>)}</select>{err_("term")}</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={close} style={{ ...small, flex: 1, padding: 12 }}>Cancel</button>
                  <button onClick={submit} style={{ flex: 2, padding: 12, border: "none", borderRadius: 999, background: "#22c55e", color: "#000", fontWeight: 800, cursor: "pointer" }}>Create classroom</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
