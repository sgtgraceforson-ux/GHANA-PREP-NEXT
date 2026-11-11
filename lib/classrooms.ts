// Classrooms + join codes. Demo/local mode (localStorage): codes only work on the same device
// until this is moved to a shared database (e.g. Supabase) with a UNIQUE constraint on `code`.
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
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 chars, no 0/O/1/I

export type Classroom = { id: string; teacherEmail: string; teacherName: string; name: string; subject: string; level: string; term: string; code: string; createdAt: number };
export type Student = { phone: string; name: string };

const read = (k: string, d: any) => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch { return d; } };
const write = (k: string, v: any) => localStorage.setItem(k, JSON.stringify(v));

export const formatCode = (c: string) => "GH-" + c;
// accepts "7k2p9x", "GH-7K2P9X", "gh7k2p9x"
export function normalizeCode(raw: string) {
  let c = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (c.length === 8 && c.startsWith("GH")) c = c.slice(2);
  return c;
}

function uniqueCode(taken: Set<string>) {
  for (let i = 0; i < 1000; i++) {
    const code = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => ALPHA[b % ALPHA.length]).join("");
    if (!taken.has(code)) return code; // must be unique across ALL classrooms
  }
  throw new Error("Could not generate a unique code. Try again.");
}
const takenCodes = (all: Record<string, Classroom>) => new Set(Object.values(all).map((c) => c.code));

export function createClassroom(t: { email: string; fullName: string }, d: { name: string; subject: string; level: string; term: string }): Classroom {
  const all = read(CLS, {});
  const id = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, "0")).join("");
  const room: Classroom = { id, teacherEmail: t.email.toLowerCase(), teacherName: t.fullName, name: d.name.trim(), subject: d.subject, level: d.level, term: d.term, code: uniqueCode(takenCodes(all)), createdAt: Date.now() };
  all[id] = room; write(CLS, all);
  return room;
}

export function memberCount(id: string) { return (read(MEM, {})[id] || []).length; }

export function listTeacherClassrooms(email: string) {
  return (Object.values(read(CLS, {})) as Classroom[])
    .filter((c) => c.teacherEmail === email.toLowerCase())
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((c) => ({ ...c, count: memberCount(c.id) }));
}

export function regenerateCode(id: string, teacherEmail: string) {
  const all = read(CLS, {});
  const room = all[id];
  if (!room || room.teacherEmail !== teacherEmail.toLowerCase()) return null;
  room.code = uniqueCode(takenCodes(all)); // the old code stops working
  write(CLS, all);
  return room as Classroom;
}

export function findByCode(raw: string): Classroom | null {
  const c = normalizeCode(raw);
  if (c.length !== 6) return null;
  return (Object.values(read(CLS, {})) as Classroom[]).find((r) => r.code === c) || null;
}

export function joinClassroom(s: Student, raw: string): { ok: boolean; error?: string; classroom?: Classroom } {
  const room = findByCode(raw);
  if (!room) return { ok: false, error: "Invalid code. Check with your teacher." };
  const mem = read(MEM, {});
  const list = mem[room.id] || [];
  if (list.some((m: any) => m.phone === s.phone)) return { ok: false, error: "You're already in this classroom." };
  mem[room.id] = [...list, { phone: s.phone, name: s.name, joinedAt: Date.now() }];
  write(MEM, mem);
  return { ok: true, classroom: room };
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
