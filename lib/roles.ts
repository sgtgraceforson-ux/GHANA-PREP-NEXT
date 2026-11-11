// One sign-in for everyone: the role button on the main auth screen decides where you land.
// Passwords live in the main auth store; this file only remembers WHO is a teacher.
// Demo/local mode (localStorage). Real protection needs server-side roles (e.g. Supabase).
import { setRoleCookie } from "./teacher-auth";

const ROLES = "gp_roles_v1";            // { [phoneDigits]: "teacher" | "parent" }  (parents: see lib/parents.ts)
const TEACHERS = "gp_teachers_v1";      // { [email]: profile }   (read by getTeacher())
const TSESSION = "gp_teacher_session";  // { email }
const STUDENT_SESSION = "gp_session_v3";

export type Role = "student" | "teacher" | "parent";
export type TeacherProfile = { fullName: string; email: string; phone: string; school: string; region: string };

const read = (k: string, d: any) => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch { return d; } };
const digits = (p: string) => String(p || "").replace(/\D/g, "");

export const getRole = (phone: string): Role => { const r = read(ROLES, {})[digits(phone)]; return r === "teacher" || r === "parent" ? r : "student"; };

export function teacherProfileByPhone(phone: string): TeacherProfile | null {
  const a = Object.values(read(TEACHERS, {})).find((t: any) => t.phone === digits(phone)) as any;
  return a ? { fullName: a.fullName, email: a.email, phone: a.phone, school: a.school, region: a.region } : null;
}

// Marks the phone as a teacher, signs them in as a teacher and signs them out of the student app.
export function startTeacherSession(p: TeacherProfile) {
  const phone = digits(p.phone), email = p.email.trim().toLowerCase();
  const roles = read(ROLES, {}); roles[phone] = "teacher"; localStorage.setItem(ROLES, JSON.stringify(roles));
  const accounts = read(TEACHERS, {});
  accounts[email] = { fullName: p.fullName, email, phone, school: p.school, region: p.region, createdAt: Date.now() };
  localStorage.setItem(TEACHERS, JSON.stringify(accounts));
  localStorage.setItem(TSESSION, JSON.stringify({ email }));
  localStorage.removeItem(STUDENT_SESSION);
  setRoleCookie();
}
