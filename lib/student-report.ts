// Individual student results and attendance-style weekly activity, for the headmaster dashboard.
// Built only from data the app already stores (demo/local mode, localStorage):
//  - practice: the student's stats, including `days` (questions answered per day; recorded from
//    the day this was added, so older weeks only show work with its own date)
//  - assignments: submissions and the marks the teacher gave
//  - teacher quizzes: results with the date they were taken
import { listAssignments, listSubmissions, statusFor, type Status } from "@/lib/assignments";
import type { Classroom, Member } from "@/lib/classrooms";

const DAY = 86400000;
const read = (k: string, d: any) => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch { return d; } };
const digits = (p: string) => String(p || "").replace(/\D/g, "");

/** Local calendar day as "YYYY-MM-DD". */
export const dayKey = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
/** Monday 00:00 (local) of the week containing t. */
export function weekStart(t: number) { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); }
/** The 7 days of a week, Monday first. Uses the calendar so clock changes cannot shift a day. */
export function weekDays(start: number) { const d0 = new Date(start); return [0, 1, 2, 3, 4, 5, 6].map((i) => new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + i).getTime()); }
export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const weekLabel = (start: number) => {
  const f = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${f(start)} – ${f(weekDays(start)[6])}`;
};

export type DayActivity = { practice: number; assignments: number; quizzes: number };
const total = (a: DayActivity | undefined) => (a ? a.practice + a.assignments + a.quizzes : 0);
export const isActive = (a: DayActivity | undefined) => total(a) > 0;

function accountFor(phone: string) {
  return (Object.values(read("gp_local_accs", {})) as any[]).find((a) => digits(a.phone) === digits(phone)) || null;
}

/** Everything a student did, grouped by calendar day. */
export function activityByDay(phone: string): Record<string, DayActivity> {
  const out: Record<string, DayActivity> = {};
  const add = (key: string, k: keyof DayActivity, n = 1) => { const d = (out[key] = out[key] || { practice: 0, assignments: 0, quizzes: 0 }); d[k] += n; };
  const st = accountFor(phone)?.stats || {};
  for (const [key, n] of Object.entries(st.days || {})) if (Number(n) > 0) add(key, "practice", Number(n));
  // students who have not practised since daily records began: only their last practice day is known
  if (!st.days) {
    const last = typeof st.lastActiveAt === "number" ? st.lastActiveAt : st.lastDay ? Date.parse(st.lastDay) : NaN;
    if (!isNaN(last)) add(dayKey(last), "practice", Math.max(1, st.doneToday || 1));
  }

  const subs = read("gp_submissions_v1", {});
  for (const byPhone of Object.values(subs) as any[]) {
    const s = byPhone?.[digits(phone)];
    if (s?.submittedAt) add(dayKey(s.submittedAt), "assignments");
  }
  const results = read("gp_quiz_results_v1", {});
  for (const list of Object.values(results) as any[]) for (const r of list || []) {
    if (digits(r.studentPhone) === digits(phone) && r.submittedAt) add(dayKey(r.submittedAt), "quizzes");
  }
  return out;
}

/* ---------- class register (one week, every student) ---------- */
export type RegisterRow = { phone: string; name: string; days: (DayActivity | undefined)[]; activeDays: number };
export function weeklyRegister(members: Member[], start: number): RegisterRow[] {
  const days = weekDays(start).map(dayKey);
  return members.map((m) => {
    const act = activityByDay(m.phone);
    const row = days.map((k) => act[k]);
    return { phone: m.phone, name: m.name, days: row, activeDays: row.filter(isActive).length };
  });
}

/* ---------- one student's report ---------- */
export type AssignmentResult = { title: string; dueAt: number; totalMarks: number; status: Status; marks: number | null; pct: number | null; late: boolean; feedback: string };
export type QuizResult = { title: string; subject: string; pct: number; correct: number; total: number; at: number };
export type StudentReport = {
  name: string; phone: string;
  practice: { done: number; average: number | null; objDone: number; objAverage: number | null; theoryDone: number; theoryAverage: number | null; streak: number; lastActive: number | null; weak: { topic: string; misses: number }[] };
  assignments: AssignmentResult[];
  quizzes: QuizResult[];
  weeks: { start: number; days: (DayActivity | undefined)[]; activeDays: number }[]; // last 4 weeks, newest first
};

const avg = (score: number, n: number) => (n > 0 ? Math.round((score / n) * 10) / 10 : null);

export function studentReport(member: Member, room: Classroom, now = Date.now(), weeksBack = 4): StudentReport {
  const st = accountFor(member.phone)?.stats || {};
  const assignments: AssignmentResult[] = listAssignments(room.id).map((a) => {
    const s = listSubmissions(a.id).find((x) => digits(x.phone) === digits(member.phone)) || null;
    const marks = s?.marks ?? null;
    return { title: a.title, dueAt: a.dueAt, totalMarks: a.totalMarks, status: statusFor(a, s, now), marks,
      pct: marks !== null && a.totalMarks ? Math.round((marks / a.totalMarks) * 100) : null, late: !!s?.late, feedback: s?.feedback || "" };
  }).sort((a, b) => b.dueAt - a.dueAt);

  const quizzes = read("gp_quizzes_v1", {}), results = read("gp_quiz_results_v1", {});
  const quizList: QuizResult[] = [];
  for (const [code, list] of Object.entries(results) as [string, any[]][]) for (const r of list || []) {
    if (digits(r.studentPhone) !== digits(member.phone)) continue;
    quizList.push({ title: quizzes[code]?.title || "Quiz " + code, subject: quizzes[code]?.subject || "", pct: Math.round(Number(r.pct) || 0), correct: r.correct || 0, total: r.total || 0, at: r.submittedAt || 0 });
  }
  quizList.sort((a, b) => b.at - a.at);

  const act = activityByDay(member.phone);
  const thisWeek = weekStart(now);
  const weeks = Array.from({ length: weeksBack }, (_, i) => {
    const start = weekStart(thisWeek - i * 7 * DAY + DAY); // step back one week at a time
    const days = weekDays(start).map((t) => (t > now ? undefined : act[dayKey(t)]));
    return { start, days, activeDays: days.filter(isActive).length };
  });

  return {
    name: member.name, phone: member.phone,
    practice: {
      done: st.done || 0, average: avg(st.totalScore || 0, st.done || 0),
      objDone: st.objDone || 0, objAverage: avg(st.objScore || 0, st.objDone || 0),
      theoryDone: st.theoryDone || 0, theoryAverage: avg(st.theoryScore || 0, st.theoryDone || 0),
      streak: st.streak || 0, lastActive: member.lastActive,
      weak: Object.entries(st.weak || {}).map(([topic, misses]) => ({ topic, misses: Number(misses) || 0 })).sort((a, b) => b.misses - a.misses).slice(0, 3),
    },
    assignments, quizzes: quizList, weeks,
  };
}
