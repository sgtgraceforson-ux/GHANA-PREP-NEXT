"use client";
import { AssignmentsBodySkeleton } from "@/components/skeletons";
import { useEffect, useState } from "react";
import { ClassAnnouncements } from "@/components/announcements";
import { getClassroom, listStudentClassrooms, formatDate, timeAgo, type Classroom } from "@/lib/classrooms";
import { listAssignments, getSubmission, submitAssignment, statusFor, STATUS_COLOR, type Assignment, type Submission, type Status } from "@/lib/assignments";

const card = { background: "#161d18", border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: 16 } as const;
const page = { minHeight: "100vh", background: "#0a0f0d", color: "#f0f4f8", fontFamily: "'DM Sans',sans-serif", display: "flex", justifyContent: "center", padding: "24px 18px 48px" } as const;
const btn = { padding: "8px 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,.16)", background: "#1e271f", color: "#f0f4f8", fontWeight: 600, fontSize: 12, cursor: "pointer" } as const;

const Chip = ({ status }: { status: Status }) => {
  const c = STATUS_COLOR[status];
  return <span data-status={status} style={{ fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 999, color: c, border: `1px solid ${c}66`, background: `${c}1a`, whiteSpace: "nowrap" }}>{status}</span>;
};

function AssignmentView({ a, student, onBack }: { a: Assignment; student: { name: string; phone: string }; onBack: () => void }) {
  const [sub, setSub] = useState<Submission | null>(null);
  const [text, setText] = useState(""); const [answers, setAnswers] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { const s = getSubmission(a.id, student.phone); setSub(s); if (s) { setText(s.text); setAnswers(s.answers); } }, [a.id, student.phone]);
  const status = statusFor(a, sub); const locked = status === "Graded";
  const overdue = !sub && Date.now() > a.dueAt;

  function submit() {
    const r = submitAssignment(a.id, student, { text, answers });
    if (!r.ok) { setMsg({ ok: false, text: r.error }); return; }
    setSub(r.submission); setMsg({ ok: true, text: r.submission.late ? "Submitted (marked late)." : "Submitted. Your teacher will grade it." });
  }

  return (
    <div>
      <button onClick={onBack} style={{ ...btn, marginBottom: 12 }}>&lsaquo; All assignments</button>
      <div style={{ ...card, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18 }}>{a.title}</p><Chip status={status} />
        </div>
        <p style={{ fontSize: 12, color: "#8899aa", margin: "4px 0 8px" }}>{a.subject} · Due {formatDate(a.dueAt)} · {a.totalMarks} marks</p>
        {a.instructions && <p style={{ fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{a.instructions}</p>}
        {a.attachments.map((f) => <a key={f.name} href={f.dataUrl} download={f.name} style={{ display: "block", fontSize: 12, color: "#22c55e", marginTop: 6 }}>Download: {f.name}</a>)}
        {overdue && <p style={{ fontSize: 12, color: "#f87171", marginTop: 8 }}>This assignment is overdue. You can still submit, but it will be marked late.</p>}
      </div>

      {locked && sub && (
        <div data-testid="result" style={{ ...card, marginBottom: 12, borderColor: "rgba(34,197,94,.4)" }}>
          <p style={{ fontSize: 12, color: "#8899aa" }}>Your mark</p>
          <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color: "#22c55e" }}>{sub.marks} / {a.totalMarks}</p>
          {sub.feedback && <><p style={{ fontSize: 12, color: "#8899aa", marginTop: 8 }}>Teacher feedback</p><p style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{sub.feedback}</p></>}
        </div>
      )}

      {a.questions.map((q, i) => (
        <div key={q.key} style={{ ...card, marginBottom: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Q{i + 1}. {q.question}</p>
          {q.kind === "mcq" ? (q.options || []).map((o) => (
            <label key={o} style={{ display: "flex", gap: 8, padding: "6px 0", fontSize: 13, cursor: locked ? "default" : "pointer" }}>
              <input type="radio" name={q.key} disabled={locked} checked={answers[q.key] === o.charAt(0)} onChange={() => setAnswers({ ...answers, [q.key]: o.charAt(0) })} aria-label={`Q${i + 1} option ${o}`} />{o}
            </label>
          )) : (
            <textarea disabled={locked} value={answers[q.key] || ""} onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })} aria-label={`Q${i + 1} answer`} placeholder="Type your answer"
              style={{ width: "100%", minHeight: 70, padding: 10, background: "#1e271f", border: "1.5px solid rgba(255,255,255,.12)", borderRadius: 10, color: "#f0f4f8", font: "500 13px 'DM Sans',sans-serif" }} />
          )}
        </div>
      ))}

      <div style={card}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#8899aa", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 }}>Your answer / working</p>
        <textarea disabled={locked} value={text} onChange={(e) => { setText(e.target.value); setMsg(null); }} aria-label="Your answer"
          placeholder="Write your answer here" style={{ width: "100%", minHeight: 110, padding: 12, background: "#1e271f", border: "1.5px solid rgba(255,255,255,.12)", borderRadius: 12, color: "#f0f4f8", font: "500 14px 'DM Sans',sans-serif" }} />
        {msg && <p role="status" style={{ fontSize: 13, fontWeight: 600, marginTop: 8, color: msg.ok ? "#22c55e" : "#f87171" }}>{msg.text}</p>}
        {sub && !locked && <p style={{ fontSize: 12, color: "#8899aa", marginTop: 8 }}>Submitted {timeAgo(sub.submittedAt)}. You can edit and resubmit until it is graded.</p>}
        {!locked && <button onClick={submit} style={{ width: "100%", padding: 13, marginTop: 12, border: "none", borderRadius: 999, background: "#22c55e", color: "#000", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>{sub ? "Resubmit" : "Submit"}</button>}
      </div>
    </div>
  );
}

export default function StudentClassroomPage({ params }: { params: { id: string } }) {
  const [student, setStudent] = useState<{ name: string; phone: string } | null | undefined>(undefined);
  const [room, setRoom] = useState<Classroom | null>(null);
  const [member, setMember] = useState(false);
  const [list, setList] = useState<Assignment[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const load = (s: { phone: string }) => setList(listAssignments(params.id).sort((x, y) => x.dueAt - y.dueAt));

  useEffect(() => {
    let s = null; try { s = JSON.parse(localStorage.getItem("gp_session_v3") || "null"); } catch {}
    setStudent(s); if (!s) return;
    setRoom(getClassroom(params.id));
    const ok = listStudentClassrooms(s.phone).some((c) => c.id === params.id); setMember(ok); if (ok) load(s);
  }, [params.id]);

  const body = student === undefined ? <AssignmentsBodySkeleton /> : student === null ? (
    <div style={card}><p style={{ fontSize: 14, marginBottom: 10 }}>Sign in to the student app first.</p><a href="/" style={{ color: "#22c55e", fontWeight: 700 }}>Go to sign in</a></div>
  ) : !room || !member ? (
    <div style={card}><p style={{ fontSize: 14, marginBottom: 10 }}>You are not in this classroom.</p><a href="/join" style={{ color: "#22c55e", fontWeight: 700 }}>Join with a code</a></div>
  ) : openId && list.find((a) => a.id === openId) ? (
    <AssignmentView a={list.find((a) => a.id === openId)!} student={student} onBack={() => { setOpenId(null); load(student); }} />
  ) : (
    <>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, margin: "12px 0 4px" }}>{room.name}</h1>
      <p style={{ fontSize: 13, color: "#8899aa", marginBottom: 16 }}>{room.subject} · {room.level} · {room.term} · {room.teacherName}</p>
      <ClassAnnouncements phone={student.phone} classroomId={room.id} />
      <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, marginBottom: 10 }}>Assignments ({list.length})</p>
      {list.length === 0 ? <div style={card}><p style={{ fontSize: 13, color: "#8899aa" }}>No assignments yet.</p></div> : list.map((a) => {
        const s = getSubmission(a.id, student.phone); const st = statusFor(a, s);
        return (
          <button key={a.id} onClick={() => setOpenId(a.id)} data-assignment={a.title} style={{ ...card, display: "block", width: "100%", textAlign: "left", marginBottom: 8, cursor: "pointer", color: "inherit" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><p style={{ fontWeight: 700, fontSize: 14 }}>{a.title}</p><Chip status={st} /></div>
            <p style={{ fontSize: 12, color: "#8899aa", marginTop: 4 }}>Due {formatDate(a.dueAt)} · {st === "Graded" && s ? `${s.marks} / ${a.totalMarks} marks` : `${a.totalMarks} marks`}</p>
          </button>
        );
      })}
    </>
  );

  return <div style={page}><div style={{ width: "100%", maxWidth: 560 }}><a href="/join" style={{ color: "#8899aa", fontSize: 13, textDecoration: "none" }}>&lsaquo; Classrooms</a>{body}</div></div>;
}
