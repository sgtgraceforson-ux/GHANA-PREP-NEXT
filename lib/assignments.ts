// Assignments, submissions and grading. Demo/local mode (localStorage), same limits as classrooms.
import { DB } from "./question-bank";

const AS = "gp_assignments_v1";   // { [id]: Assignment }
const SUB = "gp_submissions_v1";  // { [assignmentId]: { [phoneDigits]: Submission } }

export type Attachment = { name: string; type: string; size: number; dataUrl: string };
export type AQuestion = { key: string; kind: "mcq" | "theory"; topic: string; year: string; question: string; options?: string[]; correct?: string; solution?: string };
export type Assignment = { id: string; classroomId: string; title: string; instructions: string; subject: string; dueAt: number; totalMarks: number; attachments: Attachment[]; questions: AQuestion[]; createdAt: number };
export type Submission = { phone: string; name: string; text: string; answers: Record<string, string>; submittedAt: number; late: boolean; marks: number | null; feedback: string; gradedAt: number | null };
export type Status = "Pending" | "Submitted" | "Graded" | "Overdue";

const read = (k: string, d: any) => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch { return d; } };
const write = (k: string, v: any) => localStorage.setItem(k, JSON.stringify(v)); // throws if storage is full
const digits = (p: string) => String(p || "").replace(/\D/g, "");

export const MAX_FILE = 700 * 1024, MAX_TOTAL = 1500 * 1024;

// "2026-11-20" -> end of that day (local time)
export function endOfDay(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

// Built-in questions for a classroom subject + level (JHS = BECE, SHS = WASSCE)
const SUBJECT_MAP: Record<string, { JHS: string; SHS: string }> = {
  "Maths": { JHS: "Mathematics", SHS: "Core Mathematics" },
  "English": { JHS: "English Language", SHS: "Core English" },
  "Science": { JHS: "Integrated Science", SHS: "Core Science" },
  "Social Studies": { JHS: "Social Studies", SHS: "Social Studies" },
};
export function bankFor(subject: string, level: string): AQuestion[] {
  const lvl = level.startsWith("JHS") ? "JHS" : "SHS";
  const name = SUBJECT_MAP[subject]?.[lvl];
  const sub = name && (DB as any)[lvl]?.subjects?.[name];
  if (!sub) return [];
  const mk = (kind: "mcq" | "theory", q: any): AQuestion => ({
    key: `${lvl}:${name}:${q.id}`, kind, topic: q.topic, year: q.year, question: q.question,
    ...(kind === "mcq" ? { options: q.options, correct: q.correct } : { solution: q.solution || q.answer }),
  });
  return [...(sub.objectives || []).map((q: any) => mk("mcq", q)), ...(sub.theory || []).map((q: any) => mk("theory", q))];
}

export function createAssignment(classroom: { id: string; subject: string }, d: { title: string; instructions: string; dueAt: number; totalMarks: number; attachments: Attachment[]; questions: AQuestion[] }): Assignment {
  const all = read(AS, {});
  const id = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, "0")).join("");
  const a: Assignment = { id, classroomId: classroom.id, title: d.title.trim(), instructions: d.instructions.trim(), subject: classroom.subject, dueAt: d.dueAt, totalMarks: d.totalMarks, attachments: d.attachments, questions: d.questions, createdAt: Date.now() };
  all[id] = a; write(AS, all);
  return a;
}
export const getAssignment = (id: string): Assignment | null => read(AS, {})[id] || null;
export const listAssignments = (classroomId: string): Assignment[] =>
  (Object.values(read(AS, {})) as Assignment[]).filter((a) => a.classroomId === classroomId).sort((a, b) => b.createdAt - a.createdAt);

export const getSubmission = (aid: string, phone: string): Submission | null => (read(SUB, {})[aid] || {})[digits(phone)] || null;
export const listSubmissions = (aid: string): Submission[] => Object.values(read(SUB, {})[aid] || {}) as Submission[];

export function submitAssignment(aid: string, student: { phone: string; name: string }, content: { text: string; answers: Record<string, string> }, now = Date.now()): { ok: boolean; error?: string; submission?: Submission } {
  const a = getAssignment(aid); if (!a) return { ok: false, error: "Assignment not found." };
  const hasAnswer = content.text.trim() || Object.values(content.answers).some((v) => String(v).trim());
  if (!hasAnswer) return { ok: false, error: "Write or choose at least one answer before submitting." };
  const all = read(SUB, {}); const mine = (all[aid] = all[aid] || {}); const prev = mine[digits(student.phone)];
  if (prev && prev.gradedAt) return { ok: false, error: "This assignment has already been graded." };
  const s: Submission = { phone: digits(student.phone), name: student.name, text: content.text.trim(), answers: content.answers, submittedAt: now, late: now > a.dueAt, marks: null, feedback: "", gradedAt: null };
  mine[s.phone] = s; write(SUB, all);
  return { ok: true, submission: s };
}

export function gradeSubmission(aid: string, phone: string, marks: number, feedback: string, now = Date.now()): { ok: boolean; error?: string } {
  const a = getAssignment(aid); const all = read(SUB, {}); const s = all[aid]?.[digits(phone)];
  if (!a || !s) return { ok: false, error: "Submission not found." };
  if (!Number.isFinite(marks) || marks < 0 || marks > a.totalMarks) return { ok: false, error: `Marks must be between 0 and ${a.totalMarks}.` };
  s.marks = marks; s.feedback = feedback.trim(); s.gradedAt = now; write(SUB, all);
  return { ok: true };
}

// Pending / Submitted / Graded / Overdue
export function statusFor(a: Assignment, s: Submission | null, now = Date.now()): Status {
  if (s && s.gradedAt) return "Graded";
  if (s) return "Submitted";
  return now > a.dueAt ? "Overdue" : "Pending";
}

// Helper for teachers: how many multiple-choice answers match the built-in answer key
export function mcqCheck(a: Assignment, s: Submission) {
  const qs = a.questions.filter((q) => q.kind === "mcq");
  return { total: qs.length, correct: qs.filter((q) => s.answers[q.key] && s.answers[q.key] === q.correct).length };
}

export const STATUS_COLOR: Record<Status, string> = { Pending: "#fbbf24", Submitted: "#38bdf8", Graded: "#22c55e", Overdue: "#f87171" };
