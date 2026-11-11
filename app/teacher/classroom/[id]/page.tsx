"use client";
import { ClassroomSkeleton } from "@/components/skeletons";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AssignmentsTab } from "./assignments";
import { AnnouncementsTab } from "./announcements";
import { AnalyticsTab } from "./analytics";
import { getTeacher } from "@/lib/teacher-auth";
import { getClassroom, listMembers, formatCode, formatDate, timeAgo, type Classroom, type Member } from "@/lib/classrooms";

const TABS = ["Students", "Assignments", "Announcements", "Impact"];
const card = { background: "#161d18", border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: 16 } as const;
const page = { minHeight: "100vh", background: "#0a0f0d", color: "#f0f4f8", fontFamily: "'DM Sans',sans-serif", display: "flex", justifyContent: "center", padding: "24px 18px 48px" } as const;

function StudentsTab({ room }: { room: Classroom }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => { setMembers(listMembers(room.id)); }, [room.id]);
  const shown = members.filter((m) => m.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div>
      <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: "#8899aa" }}>Total students</p>
        <p data-testid="total" style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: "#22c55e" }}>{members.length}</p>
      </div>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student by name" aria-label="Search student by name"
        style={{ width: "100%", padding: "12px 14px", background: "#1e271f", border: "1.5px solid rgba(255,255,255,.12)", borderRadius: 12, color: "#f0f4f8", font: "500 14px 'DM Sans',sans-serif", outline: "none", marginBottom: 10 }} />
      {q.trim() && members.length > 0 && <p style={{ fontSize: 12, color: "#8899aa", marginBottom: 8 }}>Showing {shown.length} of {members.length}</p>}

      {members.length === 0 ? (
        <div style={card}><p style={{ fontSize: 13, color: "#8899aa", lineHeight: 1.6 }}>No students have joined yet. Share the code <b style={{ color: "#22c55e" }}>{formatCode(room.code)}</b> so they can join.</p></div>
      ) : shown.length === 0 ? (
        <div style={card}><p style={{ fontSize: 13, color: "#8899aa" }}>No student matches &ldquo;{q.trim()}&rdquo;.</p></div>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {shown.map((m) => (
            <li key={m.phone} style={{ ...card, marginBottom: 8, display: "flex", gap: 12, alignItems: "center" }}>
              <div aria-hidden style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(34,197,94,.15)", border: "1.5px solid #22c55e", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 800, flexShrink: 0 }}>{m.name.charAt(0).toUpperCase()}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</p>
                <p style={{ fontSize: 12, color: "#8899aa", marginTop: 2 }}>Joined {formatDate(m.joinedAt)}</p>
                <p style={{ fontSize: 12, color: m.lastActive ? "#8899aa" : "#566370", marginTop: 1 }}>Last active: {m.lastActive ? timeAgo(m.lastActive) : "No activity yet"}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ClassroomPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "missing" | "ready">("loading");
  const [room, setRoom] = useState<Classroom | null>(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    const me = getTeacher();
    if (!me) { router.replace("/"); return; }
    const r = getClassroom(params.id);
    if (!r || r.teacherEmail !== me.email.toLowerCase()) { setState("missing"); return; } // only the owner can open it
    setRoom(r); setState("ready");
  }, [params.id, router]);

  if (state === "loading") return <ClassroomSkeleton />;
  if (state === "missing" || !room) return (
    <div style={page}><div style={{ width: "100%", maxWidth: 560 }}>
      <a href="/teacher/dashboard" style={{ color: "#8899aa", fontSize: 13, textDecoration: "none" }}>&lsaquo; Dashboard</a>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, marginTop: 14 }}>Classroom not found</h1>
      <p style={{ fontSize: 13, color: "#8899aa", marginTop: 6 }}>This classroom does not exist or belongs to another teacher.</p>
    </div></div>
  );

  return (
    <div style={page}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <a href="/teacher/dashboard" style={{ color: "#8899aa", fontSize: 13, textDecoration: "none" }}>&lsaquo; Dashboard</a>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, margin: "12px 0 4px" }}>{room.name}</h1>
        <p style={{ fontSize: 13, color: "#8899aa" }}>{room.subject} · {room.level} · {room.term} · Code <b style={{ color: "#22c55e", letterSpacing: ".08em" }}>{formatCode(room.code)}</b></p>

        <div role="tablist" aria-label="Classroom sections" style={{ display: "flex", gap: 4, background: "#1e271f", borderRadius: 12, padding: 4, margin: "18px 0 16px" }}>
          {TABS.map((t, i) => (
            <button key={t} role="tab" aria-selected={tab === i} onClick={() => setTab(i)}
              style={{ flex: 1, padding: "10px 4px", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 12, background: tab === i ? "#22c55e" : "transparent", color: tab === i ? "#000" : "#8899aa" }}>{t}</button>
          ))}
        </div>

        {tab === 0 ? <StudentsTab room={room} /> : tab === 1 ? <AssignmentsTab room={room} /> : tab === 2 ? <AnnouncementsTab room={room} /> : tab === 3 ? <AnalyticsTab room={room} /> : (
          <div style={card}><p style={{ fontSize: 13, color: "#8899aa" }}>{TABS[tab]} is not set up yet.</p></div>
        )}
      </div>
    </div>
  );
}
