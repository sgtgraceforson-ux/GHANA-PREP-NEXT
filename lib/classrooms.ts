// Classrooms + join codes, stored in the GhanaPrep database. Changes go through the server
// (act), which checks the teacher owns the classroom; reads come from this device's synced copy
// of the data the signed-in person may see (see lib/sync.ts).
import { act, type ActResult } from "@/lib/sync";
export const SUBJECTS = [
  "Maths", "English", "Science", "Social Studies", "RME", "ICT", "French", "Twi", "Ga", "Ewe",
  "Physics", "Chemistry", "Biology", "Economics", "Geography", "Business",
  "Elective Maths", "Government", "Literature", "Accounting", "Agricultural Science",
];
export const LEVELS = [
  { group: "BECE (JHS)", items: ["JHS 1", "JHS 2", "JHS 3"] },
  { group: "WASSCE (SHS)", items: ["SHS 1", "SHS 2", "SHS 3"] },
];
export const TERMS = ["Term 1", "Term 2", "Term 3"];

const CLS = "gp_classrooms_v1";          // { [id]: Classroom }
const MEM = "gp_classroom_members_v1";   // { [classroomId]: [{ phone, name, joinedAt }] }

export type Classroom = { id: string; schoolId?: string; teacherEmail: string; teacherName: string; name: string; subject: string; level: string; term: string; code: string; createdAt: number };
export type Student = { phone: string; name: string };

const read = (k: string, d: any) => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch { return d; } };

export const formatCode = (c: string) => "GH-" + c;
// accepts "7k2p9x", "GH-7K2P9X", "gh7k2p9x"
export function normalizeCode(raw: string) {
  let c = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (c.length === 8 && c.startsWith("GH")) c = c.slice(2);
  return c;
}

export async function createClassroom(_t: { email: string; fullName: string; schoolId?: string }, d: { name: string; subject: string; level: string; term: string }): Promise<ActResult<Classroom>> {
  return act<Classroom>("classroom.create", d);
}

export function memberCount(id: string) { return (read(MEM, {})[id] || []).length; }

export function listTeacherClassrooms(email: string) {
  return (Object.values(read(CLS, {})) as Classroom[])
    .filter((c) => c.teacherEmail === email.toLowerCase())
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((c) => ({ ...c, count: memberCount(c.id) }));
}

export async function regenerateCode(id: string, _teacherEmail?: string): Promise<ActResult<Classroom>> {
  return act<Classroom>("classroom.regenerate", { id }); // the old code stops working
}

export function findByCode(raw: string): Classroom | null {
  const c = normalizeCode(raw);
  if (c.length !== 6) return null;
  return (Object.values(read(CLS, {})) as Classroom[]).find((r) => r.code === c) || null;
}

export async function joinClassroom(_s: Student, raw: string): Promise<{ ok: boolean; error?: string; classroom?: Classroom }> {
  const r = await act<Classroom>("classroom.join", { code: raw });
  return r.ok ? { ok: true, classroom: r.result } : { ok: false, error: r.error };
}

export function listStudentClassrooms(phone: string): Classroom[] {
  const mem = read(MEM, {}); const all = read(CLS, {});
  return Object.keys(mem).filter((id) => all[id] && mem[id].some((m: any) => m.phone === phone)).map((id) => all[id] as Classroom);
}

// ---------- classroom page helpers ----------
export type Member = { phone: string; name: string; joinedAt: number; lastActive: number | null };
const digitsOnly = (p: string) => String(p || "").replace(/\D/g, "");

export function getClassroom(id: string): Classroom | null { return read(CLS, {})[id] || null; }

// Students who joined with the code. "Last active" comes from the student's practice stats
// (exact time when available, otherwise the day of their last practice, otherwise null).
export function listMembers(id: string): Member[] {
  const members = read(MEM, {})[id] || [];
  const accounts = Object.values(read("gp_local_accs", {})) as any[];
  return members.map((m: any) => {
    const st = accounts.find((a) => digitsOnly(a.phone) === digitsOnly(m.phone))?.stats || {};
    let last: number | null = typeof st.lastActiveAt === "number" ? st.lastActiveAt : null;
    if (last === null && st.lastDay) { const t = Date.parse(st.lastDay); if (!isNaN(t)) last = t; }
    return { phone: m.phone, name: m.name, joinedAt: m.joinedAt, lastActive: last };
  }).sort((a: Member, b: Member) => a.name.localeCompare(b.name));
}

export const formatDate = (ts: number) => new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
export function timeAgo(ts: number, now = Date.now()) {
  const m = Math.floor((now - ts) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const day = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const diff = Math.round((day(now) - day(ts)) / 86400000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return formatDate(ts);
}
