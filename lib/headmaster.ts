// Headmaster session and the school overview shown on the headmaster dashboard.
// The code is checked on the server (/api/headmaster/login), which then sets a signed cookie for
// that school. The overview is built from the school's data in the database (synced copy, see
// lib/sync.ts): every teacher who chose the school, from any phone.
import { listMembers, type Classroom } from "@/lib/classrooms";
import { clearSynced } from "@/lib/sync";

const HSESSION = "gp_headmaster_session"; // { schoolId, schoolName, region, town, name }
const HEADS = "gp_headmasters_v1";        // { [schoolId]: { name } } remembers the headmaster's name on this device
const COOKIE = "gp_role";                 // read by middleware.ts
const OTHER_SESSIONS = ["gp_session_v3", "gp_teacher_session", "gp_parent_session"];

export type HeadSchool = { id: string; name: string; region: string; town: string };
export type HeadSession = { schoolId: string; schoolName: string; region: string; town: string; name: string };

const read = (k: string, d: any) => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch { return d; } };
const write = (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const digits = (p: string) => String(p || "").replace(/\D/g, "");

/** Asks the server whether the code is right. With a name it also signs the headmaster in. */
export async function checkHeadCode(code: string, name?: string): Promise<{ ok: boolean; school?: HeadSchool; error?: string }> {
  try {
    const r = await fetch("/api/headmaster/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, name }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.school) return { ok: false, error: d.error || "Sign-in failed. Try again." };
    return { ok: true, school: d.school };
  } catch {
    return { ok: false, error: "Network error. Check your connection and try again." };
  }
}

export const savedHeadName = (schoolId: string): string => read(HEADS, {})[schoolId]?.name || "";

/** Signs in on the server (signed cookie) and remembers the session details on this device. */
export async function startHeadSession(code: string, school: HeadSchool, name: string): Promise<{ ok: boolean; error?: string }> {
  const r = await checkHeadCode(code, name.trim());
  if (!r.ok) return { ok: false, error: r.error };
  const heads = read(HEADS, {}); heads[school.id] = { name: name.trim() }; write(HEADS, heads);
  write(HSESSION, { schoolId: school.id, schoolName: school.name, region: school.region, town: school.town, name: name.trim() });
  OTHER_SESSIONS.forEach((k) => { try { localStorage.removeItem(k); } catch {} });
  try { document.cookie = `${COOKIE}=headmaster; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`; } catch {}
  return { ok: true };
}

export function getHeadSession(): HeadSession | null {
  const s = read(HSESSION, null);
  return s && s.schoolId ? s : null;
}

export function logoutHead() {
  try { localStorage.removeItem(HSESSION); } catch {}
  clearSynced();
  try { fetch("/api/headmaster/logout", { method: "POST" }).catch(() => {}); } catch {}
  try { document.cookie = `${COOKIE}=; path=/; max-age=0; SameSite=Lax`; } catch {}
}

/* ---------- overview ---------- */
const WEEK = 7 * 24 * 3600 * 1000;

export type RoomSummary = Classroom & { students: number; activeWeek: number; members: ReturnType<typeof listMembers> };
export type TeacherSummary = { name: string; email: string; phone: string; rooms: RoomSummary[]; quizzes: number; submissions: number; average: number | null };
export type SchoolOverview = { teachers: TeacherSummary[]; totals: { teachers: number; classrooms: number; students: number; activeWeek: number; quizzes: number } };

export function schoolOverview(schoolId: string, now = Date.now()): SchoolOverview {
  const profiles = (Object.values(read("gp_teachers_v1", {})) as any[]).filter((t) => t.schoolId === schoolId);
  const emails = new Set(profiles.map((t) => String(t.email).toLowerCase()));
  const rooms = (Object.values(read("gp_classrooms_v1", {})) as Classroom[])
    .filter((c: any) => c.schoolId === schoolId || emails.has(String(c.teacherEmail).toLowerCase()));
  const quizzes = Object.values(read("gp_quizzes_v1", {})) as any[];
  const results = read("gp_quiz_results_v1", {});

  const students = new Set<string>(), activeStudents = new Set<string>();
  const summarise = (c: Classroom): RoomSummary => {
    const members = listMembers(c.id);
    let activeWeek = 0;
    for (const m of members) {
      students.add(digits(m.phone));
      if (m.lastActive && now - m.lastActive < WEEK) { activeWeek++; activeStudents.add(digits(m.phone)); }
    }
    return { ...c, students: members.length, activeWeek, members };
  };

  // teachers who chose this school, plus anyone whose classroom is tagged with it
  const byEmail = new Map<string, any>();
  profiles.forEach((p) => byEmail.set(String(p.email).toLowerCase(), p));
  rooms.forEach((c) => { const e = String(c.teacherEmail).toLowerCase(); if (!byEmail.has(e)) byEmail.set(e, { fullName: c.teacherName, email: e, phone: "" }); });

  let quizCount = 0;
  const teachers: TeacherSummary[] = [...byEmail.values()].map((p) => {
    const mine = rooms.filter((c) => String(c.teacherEmail).toLowerCase() === String(p.email).toLowerCase())
      .sort((a, b) => b.createdAt - a.createdAt).map(summarise);
    const qs = p.phone ? quizzes.filter((q) => digits(q.teacherPhone) === digits(p.phone)) : [];
    quizCount += qs.length;
    const pcts = qs.flatMap((q) => (results[q.code] || []).map((r: any) => Number(r.pct))).filter((n: number) => Number.isFinite(n));
    return {
      name: p.fullName || "Teacher", email: p.email, phone: p.phone || "", rooms: mine, quizzes: qs.length,
      submissions: pcts.length, average: pcts.length ? Math.round(pcts.reduce((a: number, b: number) => a + b, 0) / pcts.length) : null,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  return { teachers, totals: { teachers: teachers.length, classrooms: rooms.length, students: students.size, activeWeek: activeStudents.size, quizzes: quizCount } };
}
