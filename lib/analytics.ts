// Classroom impact / analytics. Pure calculations over data the app already has:
// classroom members, assignments, submissions and the marks a teacher has given.
// Nothing here is estimated: when there is not enough data a value is null and the screen says so.
import { listMembers, type Classroom, type Member } from "@/lib/classrooms";
import { listAssignments, listSubmissions, type Assignment, type Submission } from "@/lib/assignments";

const DAY = 86400000, WEEK = 7 * DAY;
export const PASS_MARK = 50; // below this average a student is listed under "need help"
const digits = (p: string) => String(p || "").replace(/\D/g, "");
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round = (x: number | null) => (x === null ? null : Math.round(x));

export type AssignmentAverage = { id: string; title: string; average: number | null; graded: number; submitted: number; students: number };
export type StudentAverage = { phone: string; name: string; average: number; graded: number };
export type WeakTopic = { topic: string; failed: number; wrong: number; answers: number };
export type WeekPoint = { label: string; from: number; to: number; average: number | null; graded: number };
export type Analytics = {
  students: number; assignments: number; gradedTotal: number;
  classAverage: number | null;
  perAssignment: AssignmentAverage[];        // oldest first
  top: StudentAverage[]; needHelp: StudentAverage[]; ranked: number; // ranked = students with at least one graded assignment
  activeThisWeek: { count: number; pct: number | null };
  completion: { submitted: number; expected: number; pct: number | null };
  weakTopics: WeakTopic[]; topicAnswers: number;
  weeks: WeekPoint[];                        // last 4 weeks, oldest first
  generatedAt: number;
};

const pct = (s: Submission, a: Assignment) => (s.marks === null || !a.totalMarks ? null : (s.marks / a.totalMarks) * 100);
const dayLabel = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** Works on plain data so it can be tested without a browser. */
export function computeAnalytics(members: Member[], assignments: Assignment[], subsByAssignment: Record<string, Submission[]>, now = Date.now()): Analytics {
  const inClass = new Set(members.map((m) => digits(m.phone)));
  const ordered = [...assignments].sort((a, b) => a.createdAt - b.createdAt);
  // only count work from students who are in the classroom now
  const subs = (a: Assignment) => (subsByAssignment[a.id] || []).filter((s) => inClass.has(digits(s.phone)));

  const perAssignment: AssignmentAverage[] = ordered.map((a) => {
    const list = subs(a); const scores = list.map((s) => pct(s, a)).filter((x): x is number => x !== null);
    return { id: a.id, title: a.title, average: round(mean(scores)), graded: scores.length, submitted: list.length, students: members.length };
  });

  // every graded piece of work: who, score, when it was handed in
  const graded = ordered.flatMap((a) => subs(a).map((s) => ({ phone: digits(s.phone), score: pct(s, a), at: s.submittedAt })))
    .filter((g): g is { phone: string; score: number; at: number } => g.score !== null);

  const students: StudentAverage[] = members.map((m) => {
    const mine = graded.filter((g) => g.phone === digits(m.phone)).map((g) => g.score);
    return mine.length ? { phone: m.phone, name: m.name, average: Math.round(mean(mine)!), graded: mine.length } : null;
  }).filter((x): x is StudentAverage => x !== null).sort((a, b) => b.average - a.average || a.name.localeCompare(b.name));
  const needHelp = students.filter((s) => s.average < PASS_MARK).sort((a, b) => a.average - b.average || a.name.localeCompare(b.name)).slice(0, 5);
  const helpSet = new Set(needHelp.map((s) => s.phone));
  const top = students.filter((s) => !helpSet.has(s.phone)).slice(0, 5); // nobody appears in both lists

  // engagement
  const weekAgo = now - WEEK;
  const submittedRecently = new Set(ordered.flatMap((a) => subs(a).filter((s) => s.submittedAt >= weekAgo).map((s) => digits(s.phone))));
  const active = members.filter((m) => (m.lastActive !== null && m.lastActive >= weekAgo) || submittedRecently.has(digits(m.phone))).length;
  const submitted = ordered.reduce((n, a) => n + subs(a).length, 0);
  const expected = members.length * ordered.length;

  // weak topics: built-in objective questions attached to assignments, marked against the answer key
  const topics: Record<string, { wrong: number; answers: number }> = {};
  ordered.forEach((a) => a.questions.filter((q) => q.kind === "mcq" && q.correct).forEach((q) => subs(a).forEach((s) => {
    const t = (topics[q.topic] = topics[q.topic] || { wrong: 0, answers: 0 });
    t.answers++; if (s.answers?.[q.key] !== q.correct) t.wrong++; // a blank answer on handed-in work counts as wrong
  })));
  const weakTopics = Object.entries(topics).map(([topic, t]) => ({ topic, wrong: t.wrong, answers: t.answers, failed: Math.round((t.wrong / t.answers) * 100) }))
    .filter((t) => t.wrong > 0).sort((a, b) => b.failed - a.failed || b.answers - a.answers || a.topic.localeCompare(b.topic)).slice(0, 3);

  // class average for each of the last 4 weeks (by the date the work was handed in)
  const weeks: WeekPoint[] = [3, 2, 1, 0].map((back) => {
    const to = now - back * WEEK, from = to - WEEK;
    const scores = graded.filter((g) => g.at > from && g.at <= to).map((g) => g.score);
    return { label: `${dayLabel(from + DAY)} to ${dayLabel(to)}`, from, to, average: round(mean(scores)), graded: scores.length };
  });

  return {
    students: members.length, assignments: ordered.length, gradedTotal: graded.length,
    classAverage: round(mean(graded.map((g) => g.score))),
    perAssignment, top, needHelp, ranked: students.length,
    activeThisWeek: { count: active, pct: members.length ? Math.round((active / members.length) * 100) : null },
    completion: { submitted, expected, pct: expected ? Math.round((submitted / expected) * 100) : null },
    weakTopics, topicAnswers: Object.values(topics).reduce((n, t) => n + t.answers, 0),
    weeks, generatedAt: now,
  };
}

export function classroomAnalytics(room: Classroom, now = Date.now()): Analytics {
  const assignments = listAssignments(room.id);
  const subs: Record<string, Submission[]> = {};
  assignments.forEach((a) => { subs[a.id] = listSubmissions(a.id); });
  return computeAnalytics(listMembers(room.id), assignments, subs, now);
}
