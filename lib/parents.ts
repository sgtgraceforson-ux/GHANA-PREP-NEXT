// Parents: accounts, the private code a student shares, parent-child links, and the
// read-only report a parent sees. Demo/local mode (localStorage): the parent must use the
// same device as the child until this is moved to a server (e.g. Supabase).
import { listStudentClassrooms, type Classroom } from "@/lib/classrooms";
import { listAssignments, getSubmission, statusFor, type Status } from "@/lib/assignments";

const ROLES = "gp_roles_v1";              // { [phoneDigits]: "teacher" | "parent" }
const PARENTS = "gp_parents_v1";          // { [phoneDigits]: { name, phone, createdAt } }
const PSESSION = "gp_parent_session";     // { phone }
const CODES = "gp_parent_codes_v1";       // { [studentPhoneDigits]: code }
const LINKS = "gp_parent_links_v1";       // { [parentPhoneDigits]: [{ student, linkedAt }] }
const ACCOUNTS = "gp_local_accs";         // the main account store (students' names and practice stats)
const STUDENT_SESSION = "gp_session_v3";
const COOKIE = "gp_role";                 // read by middleware.ts

const read = (k: string, d: any) => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch { return d; } };
const write = (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
const digits = (p: string) => String(p || "").replace(/\D/g, "");

/* ---------- parent account / session ---------- */
export type Parent = { name: string; phone: string };

export function startParentSession(p: Parent) {
  const phone = digits(p.phone);
  const roles = read(ROLES, {}); roles[phone] = "parent"; write(ROLES, roles);
  const all = read(PARENTS, {}); all[phone] = { name: p.name.trim(), phone, createdAt: all[phone]?.createdAt || Date.now() }; write(PARENTS, all);
  write(PSESSION, { phone });
  localStorage.removeItem(STUDENT_SESSION);
  try { document.cookie = `${COOKIE}=parent; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`; } catch {}
}
export function getParent(): Parent | null {
  const s = read(PSESSION, null); const a = s ? read(PARENTS, {})[digits(s.phone)] : null;
  return a ? { name: a.name, phone: a.phone } : null;
}
export function logoutParent() {
  localStorage.removeItem(PSESSION);
  try { document.cookie = `${COOKIE}=; path=/; max-age=0; SameSite=Lax`; } catch {}
}

/* ---------- the code a student shares ---------- */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I, so it is easy to read out
const makeCode = (taken: string[]) => { let c = ""; do { c = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => ALPHABET[b % ALPHABET.length]).join(""); } while (taken.includes(c)); return c; };
export const formatParentCode = (c: string) => "PA-" + c;
export const normalizeParentCode = (raw: string) => String(raw || "").toUpperCase().replace(/^PA[-\s]?/, "").replace(/[^A-Z0-9]/g, "");

/** The student's current parent code (created the first time it is asked for). */
export function getParentCode(studentPhone: string): string {
  const phone = digits(studentPhone); const all = read(CODES, {});
  if (!all[phone]) { all[phone] = makeCode(Object.values(all)); write(CODES, all); }
  return all[phone];
}
/** Replaces the code. Parents already linked stay linked; the old code stops working. */
export function newParentCode(studentPhone: string): string {
  const phone = digits(studentPhone); const all = read(CODES, {});
  all[phone] = makeCode(Object.values(all)); write(CODES, all);
  return all[phone];
}

/* ---------- links ---------- */
export type Ward = { phone: string; name: string; linkedAt: number };
export type LinkedParent = { phone: string; name: string; linkedAt: number };
const account = (phone: string): any => (Object.values(read(ACCOUNTS, {})) as any[]).find((a) => digits(a.phone) === digits(phone)) || null;

export function linkWard(parentPhone: string, rawCode: string): { ok: boolean; error?: string; ward?: Ward } {
  const code = normalizeParentCode(rawCode);
  if (code.length !== 6) return { ok: false, error: "Enter the 6-character code from your child's app, for example PA-7K2P9X." };
  const entry = Object.entries(read(CODES, {})).find(([, c]) => c === code);
  const acc = entry ? account(entry[0]) : null;
  if (!entry || !acc) return { ok: false, error: "That code was not found. Ask your child to open Parent Access in their app and read it out again." };
  const parent = digits(parentPhone), student = digits(entry[0]);
  const all = read(LINKS, {}); const mine: any[] = all[parent] || [];
  if (mine.some((l) => l.student === student)) return { ok: false, error: `${acc.name} is already on your list.` };
  const link = { student, linkedAt: Date.now() };
  all[parent] = [...mine, link];
  if (!write(LINKS, all)) return { ok: false, error: "This device's storage is full." };
  return { ok: true, ward: { phone: student, name: acc.name, linkedAt: link.linkedAt } };
}
export function listWards(parentPhone: string): Ward[] {
  return ((read(LINKS, {})[digits(parentPhone)] || []) as any[])
    .map((l) => { const a = account(l.student); return a ? { phone: l.student, name: a.name, linkedAt: l.linkedAt } : null; })
    .filter((w): w is Ward => w !== null);
}
/** Used by both sides: a parent removing a child, or a student removing a parent. */
export function unlink(parentPhone: string, studentPhone: string) {
  const all = read(LINKS, {}); const p = digits(parentPhone);
  all[p] = (all[p] || []).filter((l: any) => l.student !== digits(studentPhone)); write(LINKS, all);
}
export function parentsOf(studentPhone: string): LinkedParent[] {
  const student = digits(studentPhone); const parents = read(PARENTS, {});
  return Object.entries(read(LINKS, {}) as Record<string, any[]>).flatMap(([p, list]) =>
    list.filter((l) => l.student === student).map((l) => ({ phone: p, name: parents[p]?.name || "Parent", linkedAt: l.linkedAt })));
}
const isLinked = (parentPhone: string, studentPhone: string) => ((read(LINKS, {})[digits(parentPhone)] || []) as any[]).some((l) => l.student === digits(studentPhone));

/* ---------- the report ---------- */
export type ReportAssignment = { id: string; title: string; dueAt: number; totalMarks: number; status: Status; marks: number | null; percent: number | null; feedback: string; submittedAt: number | null };
export type ReportClassroom = { id: string; name: string; subject: string; level: string; term: string; teacherName: string; assignments: ReportAssignment[] };
export type WardReport = {
  phone: string; name: string; school: string;
  answered: number; answeredToday: number; average: number | null; // average is out of 10
  objectives: number; theory: number; streak: number; lastActive: number | null;
  weakTopics: { topic: string; misses: number }[];
  classrooms: ReportClassroom[];
  assignmentsTotal: number; assignmentsSubmitted: number; assignmentsGraded: number; assignmentAverage: number | null; // percent
  generatedAt: number;
};

/** Read-only report for one child. Returns null unless this parent is linked to that child. */
export function wardReport(parentPhone: string, studentPhone: string, now = Date.now()): WardReport | null {
  if (!isLinked(parentPhone, studentPhone)) return null;
  const acc = account(studentPhone); if (!acc) return null;
  const st = acc.stats || {};
  let last: number | null = typeof st.lastActiveAt === "number" ? st.lastActiveAt : null;
  if (last === null && st.lastDay) { const t = Date.parse(st.lastDay); if (!isNaN(t)) last = t; }
  const today = new Date(now).toDateString();

  const classrooms: ReportClassroom[] = listStudentClassrooms(acc.phone).map((c: Classroom) => ({
    id: c.id, name: c.name, subject: c.subject, level: c.level, term: c.term, teacherName: c.teacherName,
    assignments: listAssignments(c.id).map((a) => {
      const s = getSubmission(a.id, acc.phone);
      const marks = s && s.gradedAt ? s.marks : null;
      return { id: a.id, title: a.title, dueAt: a.dueAt, totalMarks: a.totalMarks, status: statusFor(a, s, now), marks,
        percent: marks !== null && a.totalMarks ? Math.round((marks / a.totalMarks) * 100) : null,
        feedback: s && s.gradedAt ? s.feedback : "", submittedAt: s ? s.submittedAt : null };
    }),
  }));
  const allA = classrooms.flatMap((c) => c.assignments); const gradedPct = allA.map((a) => a.percent).filter((x): x is number => x !== null);

  return {
    phone: digits(acc.phone), name: acc.name, school: acc.school || "",
    answered: st.done || 0, answeredToday: st.lastDay === today ? st.doneToday || 0 : 0,
    average: st.done > 0 ? Math.round((st.totalScore / st.done) * 10) / 10 : null,
    objectives: st.objDone || 0, theory: st.theoryDone || 0,
    streak: st.streak || 0, lastActive: last,
    weakTopics: Object.entries(st.weak || {}).map(([topic, n]) => ({ topic, misses: Number(n) || 0 })).filter((t) => t.misses > 0).sort((a, b) => b.misses - a.misses || a.topic.localeCompare(b.topic)).slice(0, 5),
    classrooms,
    assignmentsTotal: allA.length, assignmentsSubmitted: allA.filter((a) => a.submittedAt !== null).length, assignmentsGraded: gradedPct.length,
    assignmentAverage: gradedPct.length ? Math.round(gradedPct.reduce((x, y) => x + y, 0) / gradedPct.length) : null,
    generatedAt: now,
  };
}
