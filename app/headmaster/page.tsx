"use client";
import { useEffect, useState } from "react";
import { checkHeadCode, getHeadSession, logoutHead, savedHeadName, schoolOverview, startHeadSession,
  type HeadSchool, type HeadSession, type SchoolOverview } from "@/lib/headmaster";
import { formatCode, type Classroom, type Member } from "@/lib/classrooms";
import { ClassRegister, ReportSheet } from "@/components/headmaster-register";
import { useSyncedData } from "@/lib/sync";

const font = "'DM Sans',system-ui,sans-serif", display = "'Syne','DM Sans',sans-serif";
const page = { minHeight: "100vh", background: "#0a0f0d", color: "#f0f4f8", fontFamily: font, display: "flex", justifyContent: "center", padding: "24px 18px 48px" } as const;
const card = { background: "#161d18", border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: 16 } as const;
const muted = "#8899aa";
const btn = { width: "100%", padding: "14px", border: "none", borderRadius: 12, background: "linear-gradient(180deg,#4ae3a3,#17b872)", color: "#03130c", fontFamily: display, fontWeight: 800, fontSize: 15, cursor: "pointer" } as const;
const input = { width: "100%", padding: "14px", background: "#1e271f", border: "1.5px solid rgba(255,255,255,.14)", borderRadius: 12, color: "#f0f4f8", fontSize: 18, fontFamily: font, outline: "none" } as const;
const lbl = { display: "block", fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 } as const;

export default function HeadmasterPage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<HeadSession | null>(null);
  useEffect(() => { setSession(getHeadSession()); setReady(true); }, []);
  if (!ready) return <div style={page} />;
  return session
    ? <Dashboard session={session} onSignOut={() => { logoutHead(); setSession(null); }} />
    : <SignIn onDone={(s) => setSession(s)} />;
}

/* ---------------- sign in / sign up with the school's headmaster code ---------------- */
function SignIn({ onDone }: { onDone: (s: HeadSession) => void }) {
  const [code, setCode] = useState("");
  const [school, setSchool] = useState<HeadSchool | null>(null); // code accepted, first time on this device
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setErr("");
    if (!/^[A-Za-z]{3}\W?\d{4}$/.test(code.trim())) { setErr("Enter your code in the form ABC-1234."); return; }
    setBusy(true);
    const r = await checkHeadCode(code.trim());
    setBusy(false);
    if (!r.ok) { setErr(r.error); return; }
    const known = savedHeadName(r.school.id);
    if (known) {
      setBusy(true);
      const s = await startHeadSession(code.trim(), r.school, known);
      setBusy(false);
      if (!s.ok) { setErr(s.error || "Sign-in failed. Try again."); return; }
      onDone(getHeadSession()!); return;
    }
    setSchool(r.school); // first time: ask for their name
  }
  async function submitName(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (name.trim().length < 3) { setErr("Enter your full name."); return; }
    setBusy(true);
    const s = await startHeadSession(code.trim(), school!, name);
    setBusy(false);
    if (!s.ok) { setErr(s.error || "Sign-in failed. Try again."); return; }
    onDone(getHeadSession()!);
  }

  return (
    <div style={{ ...page, alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <img src="/logo.webp" alt="" width={86} height={100} style={{ height: "auto" }} />
          <p style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", letterSpacing: ".16em", textTransform: "uppercase", marginTop: 14 }}>Headmaster dashboard</p>
          <h1 style={{ fontFamily: display, fontSize: 25, fontWeight: 800, marginTop: 6 }}>{school ? "Welcome" : "Sign in with your school code"}</h1>
        </div>
        <div style={card}>
          {!school ? (
            <form onSubmit={submitCode}>
              <label htmlFor="hm-code" style={lbl}>Headmaster code</label>
              <input id="hm-code" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setErr(""); }}
                placeholder="ABC-1234" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={9}
                style={{ ...input, letterSpacing: ".18em", fontFamily: display, fontWeight: 800, textAlign: "center" }} />
              <p style={{ fontSize: 12, color: muted, lineHeight: 1.6, margin: "10px 0 16px" }}>Every government SHS has its own code: the first 3 letters of the school's name and 4 numbers. GhanaPrep gives it to the headmaster.</p>
              {err && <p role="alert" style={{ fontSize: 13, color: "#f87171", fontWeight: 600, marginBottom: 12 }}>{err}</p>}
              <button type="submit" disabled={busy} style={{ ...btn, opacity: busy ? 0.6 : 1 }}>{busy ? "Checking…" : "Continue"}</button>
            </form>
          ) : (
            <form onSubmit={submitName}>
              <p style={{ fontSize: 13, color: muted }}>Code accepted for</p>
              <p style={{ fontFamily: display, fontSize: 18, fontWeight: 800, margin: "4px 0 2px" }}>{school.name}</p>
              <p style={{ fontSize: 13, color: muted, marginBottom: 18 }}>{[school.town, school.region].filter(Boolean).join(" · ")}</p>
              <label htmlFor="hm-name" style={lbl}>Your full name</label>
              <input id="hm-name" value={name} onChange={(e) => { setName(e.target.value); setErr(""); }} placeholder="e.g. Mrs. Abena Owusu" autoComplete="name" style={{ ...input, fontSize: 16 }} />
              {err && <p role="alert" style={{ fontSize: 13, color: "#f87171", fontWeight: 600, marginTop: 10 }}>{err}</p>}
              <button type="submit" style={{ ...btn, marginTop: 16 }}>Open dashboard</button>
              <button type="button" onClick={() => { setSchool(null); setCode(""); setErr(""); }} style={{ background: "none", border: "none", color: muted, fontSize: 13, marginTop: 14, cursor: "pointer", width: "100%", fontFamily: font }}>Not your school? Use a different code</button>
            </form>
          )}
        </div>
        <p style={{ textAlign: "center", fontSize: 13, color: muted, marginTop: 18 }}>
          Not a headmaster? <a href="/" style={{ color: "#34d399", fontWeight: 700 }}>Go to the student and teacher sign-in</a>
        </p>
      </div>
    </div>
  );
}

/* ---------------- dashboard ---------------- */
function Dashboard({ session, onSignOut }: { session: HeadSession; onSignOut: () => void }) {
  const [data, setData] = useState<SchoolOverview | null>(null);
  const [openRoom, setOpenRoom] = useState("");
  const [report, setReport] = useState<{ member: Member; room: Classroom } | null>(null);
  const { ready, v } = useSyncedData(); // the whole school's data, from the database
  useEffect(() => {
    // the signed sign-in can expire: go back to the code screen if the server no longer accepts it
    fetch("/api/data", { cache: "no-store" }).then((r) => { if (r.status === 401) onSignOut(); }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (ready) setData(schoolOverview(session.schoolId)); }, [session.schoolId, ready, v]);

  if (!data) return <div style={page} />;
  const t = data.totals;

  return (
    <div style={page}>
      <div style={{ width: "100%", maxWidth: 640 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", letterSpacing: ".16em", textTransform: "uppercase" }}>Headmaster dashboard</p>
            <h1 style={{ fontFamily: display, fontSize: 23, fontWeight: 800, margin: "4px 0", lineHeight: 1.2 }}>{session.schoolName}</h1>
            <p style={{ fontSize: 13, color: muted }}>{[session.town, session.region].filter(Boolean).join(" · ")} · {session.name}</p>
          </div>
          <button onClick={onSignOut} style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,.16)", background: "#1e271f", color: muted, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: font }}>Sign out</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 16 }}>
          {([["Teachers", t.teachers], ["Classrooms", t.classrooms], ["Students", t.students], ["Active this week", t.activeWeek]] as const).map(([l, v]) => (
            <div key={l} style={card}><p style={{ fontSize: 11, color: muted }}>{l}</p><p style={{ fontFamily: display, fontSize: 26, fontWeight: 800, marginTop: 4 }}>{v}</p></div>
          ))}
        </div>

        {t.teachers === 0 ? (
          <div style={{ ...card, textAlign: "center", padding: "32px 20px" }}>
            <p style={{ fontFamily: display, fontWeight: 800, fontSize: 17 }}>No teachers yet</p>
            <p style={{ fontSize: 13, color: muted, lineHeight: 1.7, marginTop: 8 }}>When teachers sign up on GhanaPrep they choose <b style={{ color: "#f0f4f8" }}>{session.schoolName}</b> as their school. Every classroom they create then appears here automatically.</p>
          </div>
        ) : data.teachers.map((tr) => (
          <div key={tr.email} style={{ ...card, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 15 }}>{tr.name}</p>
                <p style={{ fontSize: 12, color: muted, overflowWrap: "anywhere" }}>{tr.email}</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: 12, color: muted }}>{tr.rooms.length} classroom{tr.rooms.length === 1 ? "" : "s"} · {tr.quizzes} quiz{tr.quizzes === 1 ? "" : "zes"}</p>
                <p style={{ fontSize: 12, color: muted }}>Quiz average: <b style={{ color: "#f0f4f8" }}>{tr.average === null ? "-" : tr.average + "%"}</b></p>
              </div>
            </div>
            {tr.rooms.length === 0 ? (
              <p style={{ fontSize: 13, color: muted, marginTop: 10 }}>No classrooms created yet.</p>
            ) : tr.rooms.map((r) => {
              const open = openRoom === r.id;
              return (
                <div key={r.id} style={{ borderTop: "1px solid rgba(255,255,255,.07)", marginTop: 10, paddingTop: 10 }}>
                  <button type="button" onClick={() => setOpenRoom(open ? "" : r.id)} aria-expanded={open}
                    style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", gap: 10, background: "none", border: "none", color: "inherit", textAlign: "left", cursor: "pointer", padding: 0, fontFamily: font }}>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontWeight: 600, fontSize: 14 }}>{r.name}</span>
                      <span style={{ display: "block", fontSize: 12, color: muted }}>{r.subject} · {r.level} · {r.term} · code {formatCode(r.code)}</span>
                    </span>
                    <span style={{ flexShrink: 0, fontSize: 12, color: muted, textAlign: "right" }}>
                      <b style={{ color: "#f0f4f8", fontSize: 14 }}>{r.students}</b> student{r.students === 1 ? "" : "s"}<br />
                      {r.activeWeek} active this week {open ? "▴" : "▾"}
                    </span>
                  </button>
                  {open && <ClassRegister members={r.members} onStudent={(m) => setReport({ member: m, room: r })} />}
                </div>
              );
            })}
          </div>
        ))}

        <p style={{ fontSize: 11.5, color: muted, lineHeight: 1.6, marginTop: 16 }}>
          Showing teachers and classrooms saved on this device. Once GhanaPrep's online database is connected, classrooms from every teacher's phone will appear here automatically.
        </p>
        {report && <ReportSheet member={report.member} room={report.room} onClose={() => setReport(null)} />}
      </div>
    </div>
  );
}
