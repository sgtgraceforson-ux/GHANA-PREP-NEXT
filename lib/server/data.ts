// Classrooms, assignments, announcements, quizzes and parent links, stored in the database.
//
// The browser asks for a "snapshot": exactly the data the signed-in person may see, shaped like
// the app's device stores so the screens can keep reading it the same way. Every change is an
// "action" checked here first (who is asking, do they own this, are they in this class...).
import { randomBytes } from "node:crypto";
import SCHOOLS from "@/lib/schools.json";
import { db } from "@/lib/server/db";
import { readSession, readToken } from "@/lib/server/auth";
import { findAccount, type AccountRow } from "@/lib/server/users";

export class ActionError extends Error { constructor(msg: string, public status = 400) { super(msg); } }
const no = (msg: string, status = 400): never => { throw new ActionError(msg, status); };

export type Viewer = { kind: "user"; acc: AccountRow } | { kind: "head"; schoolId: string; name: string };
export const HEAD_COOKIE = "gp_head";

export async function viewerFrom(req: Request): Promise<Viewer | null> {
  const raw = req.headers.get("cookie") || "";
  const hm = raw.match(new RegExp(`(?:^|;\\s*)${HEAD_COOKIE}=([^;]+)`));
  const head = readToken<{ schoolId: string; name: string; exp: number }>("head", hm ? decodeURIComponent(hm[1]) : null);
  if (head) return { kind: "head", schoolId: head.schoolId, name: head.name };
  const s = readSession(req);
  if (!s) return null;
  const acc = await findAccount("id", s.uid);
  return acc ? { kind: "user", acc } : null;
}

/* ---------- small helpers ---------- */
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const code6 = () => Array.from(randomBytes(6), (b) => ALPHA[b % ALPHA.length]).join("");
const hexId = () => randomBytes(8).toString("hex");
const digits = (p: unknown) => String(p ?? "").replace(/\D/g, "");
const str = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const ms = (iso: string | null | undefined) => (iso ? Date.parse(iso) : 0) || 0;

async function q<T = any>(p: PromiseLike<{ data: any; error: any }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw error;
  return data as T;
}
const inList = async (table: string, col: string, vals: string[], select = "*") =>
  vals.length ? q<any[]>(db().from(table).select(select).in(col, vals)) : [];

const ACC_COLS = "id, name, phone, email, role, school, school_id, region, avatar_color, stats, created_at";
const pubAcc = (a: any, withEmail = false) => ({ name: a.name, phone: a.phone, school: a.school || "", avatar_color: a.avatar_color, stats: a.stats || {}, ...(withEmail ? { email: a.email } : {}) });
const teacherProfile = (a: any) => ({ fullName: a.name, email: a.email, phone: digits(a.phone), school: a.school, region: a.region, schoolId: a.school_id || "", createdAt: ms(a.created_at) });

/** Removes answer keys so students cannot read the answers from their copy. */
const stripAnswers = (a: any) => ({ ...a, questions: (a.questions || []).map(({ correct, solution, ...rest }: any) => rest) });

/* ---------- the snapshot ---------- */
export type Snapshot = Record<string, any>;
const emptySnapshot = (): Snapshot => ({
  gp_local_accs: {}, gp_teachers_v1: {}, gp_classrooms_v1: {}, gp_classroom_members_v1: {}, gp_assignments_v1: {}, gp_submissions_v1: {},
  gp_announcements_v1: [], gp_announcement_reads_v1: {}, gp_quizzes_v1: {}, gp_quiz_results_v1: {}, gp_challenge_joined_v1: {},
  gp_parent_codes_v1: {}, gp_parent_links_v1: {}, gp_parents_v1: {},
});

/** Adds classrooms with their members, assignments, submissions and announcements.
 *  onlyStudents: limit members and submissions to these account ids (students and parents see only their own). */
async function addRooms(S: Snapshot, rooms: any[], opts: { onlyStudents?: Set<string>; strip?: boolean }) {
  if (!rooms.length) return;
  const ids = rooms.map((r) => r.id);
  for (const r of rooms) { S.gp_classrooms_v1[r.id] = { ...r.data, id: r.id, code: r.code, schoolId: r.school_id || "", createdAt: ms(r.created_at) }; S.gp_classroom_members_v1[r.id] = []; }

  let members = await inList("gp_members", "classroom_id", ids);
  if (opts.onlyStudents) members = members.filter((m) => opts.onlyStudents!.has(m.student_id));
  const accs = await inList("gp_accounts", "id", [...new Set(members.map((m) => m.student_id))], ACC_COLS);
  const byId = new Map(accs.map((a) => [a.id, a]));
  for (const a of accs) S.gp_local_accs[a.phone] = { ...pubAcc(a), ...(S.gp_local_accs[a.phone] || {}) };
  for (const m of members) {
    const a = byId.get(m.student_id); if (!a) continue;
    S.gp_classroom_members_v1[m.classroom_id].push({ phone: a.phone, name: a.name, joinedAt: ms(m.joined_at) });
  }

  const assignments = await inList("gp_assignments", "classroom_id", ids);
  for (const a of assignments) S.gp_assignments_v1[a.id] = opts.strip ? stripAnswers(a.data) : a.data;
  let subs = await inList("gp_submissions", "assignment_id", assignments.map((a) => a.id));
  if (opts.onlyStudents) subs = subs.filter((s) => opts.onlyStudents!.has(s.student_id));
  for (const s of subs) { (S.gp_submissions_v1[s.assignment_id] = S.gp_submissions_v1[s.assignment_id] || {})[digits(s.data.phone)] = s.data; }

  const anns = await inList("gp_announcements", "classroom_id", ids);
  S.gp_announcements_v1.push(...anns.map((a) => a.data));
}

/** Quizzes and their results. `me` (a student) sees other people's results without their phone numbers. */
async function addQuizzes(S: Snapshot, quizzes: any[], me?: AccountRow) {
  for (const z of quizzes) S.gp_quizzes_v1[z.code] = z.data;
  const results = await inList("gp_quiz_results", "code", quizzes.map((z) => z.code));
  for (const r of results) {
    const mine = me && r.student_id === me.id;
    const data = !me || mine ? r.data : { ...r.data, studentPhone: "student-" + String(r.student_id).slice(0, 8) };
    (S.gp_quiz_results_v1[r.code] = S.gp_quiz_results_v1[r.code] || []).push(data);
  }
}

export async function snapshot(v: Viewer): Promise<Snapshot> {
  const S = emptySnapshot();
  if (v.kind === "head") {
    const teachers = await q<any[]>(db().from("gp_accounts").select(ACC_COLS).eq("role", "teacher").eq("school_id", v.schoolId));
    for (const t of teachers) S.gp_teachers_v1[t.email] = teacherProfile(t);
    const ids = teachers.map((t) => t.id);
    const rooms = await q<any[]>(db().from("gp_classrooms").select("*").or(`school_id.eq.${v.schoolId}${ids.length ? `,teacher_id.in.(${ids.join(",")})` : ""}`));
    await addRooms(S, rooms, {});
    await addQuizzes(S, await inList("gp_quizzes", "owner_id", ids));
    return S;
  }

  const me = v.acc;
  S.gp_local_accs[me.phone] = pubAcc(me, true);
  if (me.role === "teacher") {
    S.gp_teachers_v1[me.email] = teacherProfile(me);
    await addRooms(S, await q<any[]>(db().from("gp_classrooms").select("*").eq("teacher_id", me.id)), {});
    await addQuizzes(S, await q<any[]>(db().from("gp_quizzes").select("*").eq("owner_id", me.id)));
    return S;
  }

  if (me.role === "parent") {
    S.gp_parents_v1[digits(me.phone)] = { name: me.name, phone: digits(me.phone) };
    const links = await q<any[]>(db().from("gp_parent_links").select("*").eq("parent_id", me.id));
    const wards = await inList("gp_accounts", "id", links.map((l) => l.student_id), ACC_COLS);
    const phoneOf = new Map(wards.map((w) => [w.id, digits(w.phone)]));
    for (const w of wards) S.gp_local_accs[w.phone] = pubAcc(w);
    S.gp_parent_links_v1[digits(me.phone)] = links.filter((l) => phoneOf.has(l.student_id)).map((l) => ({ student: phoneOf.get(l.student_id), linkedAt: ms(l.linked_at) }));
    const mem = await inList("gp_members", "student_id", wards.map((w) => w.id));
    const rooms = await inList("gp_classrooms", "id", [...new Set(mem.map((m) => m.classroom_id))]);
    await addRooms(S, rooms, { onlyStudents: new Set(wards.map((w) => w.id)), strip: true });
    return S;
  }

  // student
  const mem = await q<any[]>(db().from("gp_members").select("classroom_id").eq("student_id", me.id));
  const rooms = await inList("gp_classrooms", "id", mem.map((m) => m.classroom_id));
  await addRooms(S, rooms, { onlyStudents: new Set([me.id]), strip: true });
  const reads = await q<any[]>(db().from("gp_announcement_reads").select("*").eq("student_id", me.id));
  S.gp_announcement_reads_v1[me.phone] = Object.fromEntries(reads.map((r) => [r.announcement_id, ms(r.read_at)]));

  const opened = await q<any[]>(db().from("gp_quiz_opened").select("code").eq("student_id", me.id));
  const attempted = await q<any[]>(db().from("gp_quiz_results").select("code").eq("student_id", me.id));
  const owned = await q<any[]>(db().from("gp_quizzes").select("*").eq("owner_id", me.id));
  const codes = [...new Set([...opened, ...attempted].map((x) => x.code))].filter((c) => !owned.some((o) => o.code === c));
  await addQuizzes(S, [...owned, ...(await inList("gp_quizzes", "code", codes))], me);
  S.gp_challenge_joined_v1[me.phone] = opened.map((x) => x.code);

  const pc = await q<any>(db().from("gp_parent_codes").select("code").eq("student_id", me.id).maybeSingle());
  if (pc) S.gp_parent_codes_v1[digits(me.phone)] = pc.code;
  const plinks = await q<any[]>(db().from("gp_parent_links").select("*").eq("student_id", me.id));
  const parents = await inList("gp_accounts", "id", plinks.map((l) => l.parent_id), "id, name, phone");
  for (const p of parents) {
    const l = plinks.find((x) => x.parent_id === p.id);
    S.gp_parents_v1[digits(p.phone)] = { name: p.name, phone: digits(p.phone) };
    S.gp_parent_links_v1[digits(p.phone)] = [{ student: digits(me.phone), linkedAt: ms(l.linked_at) }];
  }
  return S;
}

/* ---------- actions ---------- */
const SUBJECTS = ["Maths", "English", "Science", "Social Studies", "RME", "ICT", "French", "Twi", "Ga", "Ewe", "Physics", "Chemistry", "Biology", "Economics", "Geography", "Business", "Elective Maths", "Government", "Literature", "Accounting", "Agricultural Science"];
const LEVELS = ["JHS 1", "JHS 2", "JHS 3", "SHS 1", "SHS 2", "SHS 3"];
const TERMS = ["Term 1", "Term 2", "Term 3"];
const MAX_ATTACH_TOTAL = 1600 * 1024 * 1.4; // base64 data URLs of about 1.5 MB of files

function user(v: Viewer, role?: AccountRow["role"]): AccountRow {
  if (v.kind !== "user") no("Sign in with your account to do this.", 403);
  const acc = (v as any).acc as AccountRow;
  if (role && acc.role !== role) no(`Only ${role}s can do this.`, 403);
  return acc;
}
async function ownRoom(acc: AccountRow, id: unknown) {
  const r = await q<any>(db().from("gp_classrooms").select("*").eq("id", String(id ?? "")).maybeSingle());
  if (!r || r.teacher_id !== acc.id) no("Classroom not found.", 404);
  return r;
}
async function insertWithCode(table: string, make: (code: string) => object) {
  for (let i = 0; i < 8; i++) {
    const code = code6();
    const { data, error } = await db().from(table).insert(make(code)).select("*").single();
    if (!error) return data;
    if (error.code !== "23505") throw error; // anything but "code already used"
  }
  return no("Could not create a unique code. Try again.", 500);
}
function cleanAttachments(list: unknown) {
  const arr = Array.isArray(list) ? list.slice(0, 5) : [];
  const out = arr.map((f: any) => ({ name: str(f?.name, 120), type: str(f?.type, 80), size: Number(f?.size) || 0, dataUrl: String(f?.dataUrl ?? "") }))
    .filter((f) => f.dataUrl.startsWith("data:"));
  if (out.reduce((n, f) => n + f.dataUrl.length, 0) > MAX_ATTACH_TOTAL) no("Attachments are too large (1.5 MB in total).", 413);
  return out;
}

type Handler = (v: Viewer, b: any) => Promise<any>;
export const ACTIONS: Record<string, Handler> = {
  /* classrooms */
  async "classroom.create"(v, b) {
    const t = user(v, "teacher");
    if (!t.school_id) no("Choose your school first.", 403);
    const name = str(b.name, 80);
    if (name.length < 3) no('Enter a classroom name, e.g. "Form 3 Science A".');
    if (!SUBJECTS.includes(b.subject)) no("Choose one subject.");
    if (!LEVELS.includes(b.level)) no("Choose a class / level.");
    if (!TERMS.includes(b.term)) no("Choose the school term.");
    const id = hexId(), createdAt = Date.now();
    const row = await insertWithCode("gp_classrooms", (code) => ({ id, code, teacher_id: t.id, school_id: t.school_id,
      data: { id, code, schoolId: t.school_id, teacherEmail: t.email, teacherName: t.name, name, subject: b.subject, level: b.level, term: b.term, createdAt } }));
    return { ...row.data, code: row.code };
  },
  async "classroom.regenerate"(v, b) {
    const t = user(v, "teacher"); const r = await ownRoom(t, b.id);
    for (let i = 0; i < 8; i++) {
      const code = code6();
      const { error } = await db().from("gp_classrooms").update({ code, data: { ...r.data, code } }).eq("id", r.id);
      if (!error) return { ...r.data, code };
      if (error.code !== "23505") throw error;
    }
    return no("Could not create a new code. Try again.", 500);
  },
  async "classroom.join"(v, b) {
    const s = user(v, "student");
    let c = String(b.code ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (c.length === 8 && c.startsWith("GH")) c = c.slice(2);
    if (c.length !== 6) no("Invalid code. Check with your teacher.");
    const r = await q<any>(db().from("gp_classrooms").select("*").eq("code", c).maybeSingle());
    if (!r) no("Invalid code. Check with your teacher.");
    const { error } = await db().from("gp_members").insert({ classroom_id: r.id, student_id: s.id });
    if (error?.code === "23505") no("You're already in this classroom.");
    if (error) throw error;
    return { ...r.data, code: r.code };
  },

  /* assignments */
  async "assignment.create"(v, b) {
    const t = user(v, "teacher"); const r = await ownRoom(t, b.classroomId);
    const title = str(b.title, 120); if (title.length < 3) no("Give the assignment a title.");
    const dueAt = Number(b.dueAt); if (!Number.isFinite(dueAt)) no("Choose a due date.");
    const totalMarks = Number(b.totalMarks); if (!Number.isInteger(totalMarks) || totalMarks < 1 || totalMarks > 1000) no("Total marks must be a whole number from 1 to 1000.");
    const questions = (Array.isArray(b.questions) ? b.questions.slice(0, 60) : []).map((x: any) => ({
      key: str(x.key, 120), kind: x.kind === "theory" ? "theory" : "mcq", topic: str(x.topic, 80), year: str(x.year, 10), question: String(x.question ?? "").slice(0, 2000),
      ...(x.kind === "theory" ? { solution: String(x.solution ?? "").slice(0, 3000) } : { options: (Array.isArray(x.options) ? x.options : []).slice(0, 6).map((o: any) => String(o).slice(0, 300)), correct: str(x.correct, 2) }),
    }));
    const id = hexId();
    const data = { id, classroomId: r.id, title, instructions: String(b.instructions ?? "").trim().slice(0, 3000), subject: r.data.subject, dueAt, totalMarks, attachments: cleanAttachments(b.attachments), questions, createdAt: Date.now() };
    await q(db().from("gp_assignments").insert({ id, classroom_id: r.id, data }));
    return data;
  },
  async "assignment.submit"(v, b) {
    const s = user(v, "student");
    const a = await q<any>(db().from("gp_assignments").select("*").eq("id", String(b.assignmentId ?? "")).maybeSingle());
    if (!a) no("Assignment not found.", 404);
    const member = await q<any>(db().from("gp_members").select("student_id").eq("classroom_id", a.classroom_id).eq("student_id", s.id).maybeSingle());
    if (!member) no("Join this classroom first.", 403);
    const text = String(b.text ?? "").trim().slice(0, 10000);
    const answers: Record<string, string> = {};
    for (const [k, val] of Object.entries(b.answers || {}).slice(0, 100)) answers[String(k).slice(0, 120)] = String(val ?? "").slice(0, 3000);
    if (!text && !Object.values(answers).some((x) => x.trim())) no("Write or choose at least one answer before submitting.");
    const prev = await q<any>(db().from("gp_submissions").select("data").eq("assignment_id", a.id).eq("student_id", s.id).maybeSingle());
    if (prev?.data?.gradedAt) no("This assignment has already been graded.");
    const now = Date.now();
    const data = { phone: digits(s.phone), name: s.name, text, answers, submittedAt: now, late: now > a.data.dueAt, marks: null, feedback: "", gradedAt: null };
    await q(db().from("gp_submissions").upsert({ assignment_id: a.id, student_id: s.id, data }));
    return data;
  },
  async "assignment.grade"(v, b) {
    const t = user(v, "teacher");
    const a = await q<any>(db().from("gp_assignments").select("*").eq("id", String(b.assignmentId ?? "")).maybeSingle());
    if (!a) no("Assignment not found.", 404);
    await ownRoom(t, a.classroom_id);
    const st = await findAccount("phone", digits(b.phone));
    const sub = st && await q<any>(db().from("gp_submissions").select("*").eq("assignment_id", a.id).eq("student_id", st.id).maybeSingle());
    if (!sub) no("Submission not found.", 404);
    const marks = Number(b.marks);
    if (!Number.isFinite(marks) || marks < 0 || marks > a.data.totalMarks) no(`Marks must be between 0 and ${a.data.totalMarks}.`);
    const data = { ...sub.data, marks, feedback: String(b.feedback ?? "").trim().slice(0, 2000), gradedAt: Date.now() };
    await q(db().from("gp_submissions").update({ data }).eq("assignment_id", a.id).eq("student_id", st!.id));
    return data;
  },

  /* announcements */
  async "announcement.save"(v, b) {
    const t = user(v, "teacher");
    const title = str(b.title, 200), message = String(b.message ?? "").trim();
    if (!title) no("Add a title."); if (title.length > 80) no("Keep the title under 80 characters.");
    if (!message) no("Write a message."); if (message.length > 1000) no("Keep the message under 1000 characters.");
    const attachment = b.attachment ? cleanAttachments([b.attachment])[0] || null : null;
    if (b.id) {
      const a = await q<any>(db().from("gp_announcements").select("*").eq("id", String(b.id)).maybeSingle());
      if (!a) no("This announcement no longer exists.", 404);
      await ownRoom(t, a.classroom_id);
      const data = { ...a.data, title, message, attachment, editedAt: Date.now() };
      await q(db().from("gp_announcements").update({ data }).eq("id", a.id));
      return data;
    }
    const r = await ownRoom(t, b.classroomId);
    const id = "an_" + hexId();
    const data = { id, classroomId: r.id, teacherName: t.name, title, message, attachment, pinned: false, createdAt: Date.now(), editedAt: null };
    await q(db().from("gp_announcements").insert({ id, classroom_id: r.id, data }));
    return data;
  },
  async "announcement.pin"(v, b) {
    const t = user(v, "teacher");
    const a = await q<any>(db().from("gp_announcements").select("*").eq("id", String(b.id ?? "")).maybeSingle());
    if (!a) no("This announcement no longer exists.", 404);
    await ownRoom(t, a.classroom_id);
    await q(db().from("gp_announcements").update({ data: { ...a.data, pinned: !a.data.pinned } }).eq("id", a.id));
    return true;
  },
  async "announcement.delete"(v, b) {
    const t = user(v, "teacher");
    const a = await q<any>(db().from("gp_announcements").select("*").eq("id", String(b.id ?? "")).maybeSingle());
    if (!a) return true;
    await ownRoom(t, a.classroom_id);
    await q(db().from("gp_announcements").delete().eq("id", a.id));
    return true;
  },
  async "announcement.read"(v, b) {
    const s = user(v, "student");
    const ids = (Array.isArray(b.ids) ? b.ids : []).slice(0, 200).map(String);
    if (!ids.length) return true;
    const mem = await q<any[]>(db().from("gp_members").select("classroom_id").eq("student_id", s.id));
    const anns = await inList("gp_announcements", "id", ids, "id, classroom_id");
    const allowed = anns.filter((a) => mem.some((m) => m.classroom_id === a.classroom_id));
    if (allowed.length) await q(db().from("gp_announcement_reads").upsert(allowed.map((a) => ({ student_id: s.id, announcement_id: a.id })), { ignoreDuplicates: true }));
    return true;
  },

  /* quizzes (teacher quizzes and student challenges) */
  async "quiz.save"(v, b) {
    const me = user(v);
    const quiz = b.quiz || {};
    const size = JSON.stringify(quiz).length; if (size > 400_000) no("This quiz is too large.", 413);
    if (quiz.code) {
      const z = await q<any>(db().from("gp_quizzes").select("*").eq("code", String(quiz.code)).maybeSingle());
      if (!z || z.owner_id !== me.id) no("Quiz not found.", 404);
      const data = { ...quiz, code: z.code, teacherPhone: digits(me.phone), createdAt: z.data.createdAt };
      await q(db().from("gp_quizzes").update({ data }).eq("code", z.code));
      return data;
    }
    const row = await insertWithCode("gp_quizzes", (code) => ({ code, owner_id: me.id, data: { ...quiz, code, teacherPhone: digits(me.phone), createdAt: Date.now() } }));
    return row.data;
  },
  async "quiz.get"(v, b) {
    user(v);
    const c = String(b.code ?? "").toUpperCase().trim();
    const z = await q<any>(db().from("gp_quizzes").select("data").eq("code", c).maybeSingle());
    return z ? z.data : null;
  },
  async "quiz.open"(v, b) {
    const s = user(v);
    const c = String(b.code ?? "").toUpperCase().trim();
    const z = await q<any>(db().from("gp_quizzes").select("code").eq("code", c).maybeSingle());
    if (z) await q(db().from("gp_quiz_opened").upsert({ student_id: s.id, code: c }, { ignoreDuplicates: true }));
    return true;
  },
  async "quiz.result"(v, b) {
    const s = user(v);
    const c = String(b.code ?? "").toUpperCase().trim();
    const z = await q<any>(db().from("gp_quizzes").select("code, data").eq("code", c).maybeSingle());
    if (!z) no("Quiz not found.", 404);
    if (z.data?.status === "closed") no("This quiz has been closed by the teacher.");
    const taken = await q<any[]>(db().from("gp_quiz_results").select("code").eq("code", c).eq("student_id", s.id));
    const allowed = Math.max(1, Number(z.data?.maxAttempts) || 1);
    if (taken.length >= allowed) no(allowed === 1 ? "You have already taken this quiz." : `You've already used all ${allowed} attempts for this quiz.`);
    const r = b.result || {};
    const data = { ...r, code: c, studentPhone: s.phone, studentName: s.name, pct: Math.max(0, Math.min(100, Number(r.pct) || 0)), submittedAt: Date.now() };
    if (JSON.stringify(data).length > 200_000) no("Result too large.", 413);
    await q(db().from("gp_quiz_results").insert({ code: c, student_id: s.id, data }));
    return data;
  },

  /* parents */
  async "parent.code"(v, b) {
    const s = user(v, "student");
    const cur = await q<any>(db().from("gp_parent_codes").select("code").eq("student_id", s.id).maybeSingle());
    if (cur && !b.renew) return cur.code;
    if (cur) await q(db().from("gp_parent_codes").delete().eq("student_id", s.id));
    const row = await insertWithCode("gp_parent_codes", (code) => ({ student_id: s.id, code }));
    return row.code;
  },
  async "parent.link"(v, b) {
    const p = user(v, "parent");
    const c = String(b.code ?? "").toUpperCase().replace(/^PA[-\s]?/, "").replace(/[^A-Z0-9]/g, "");
    if (c.length !== 6) no("Enter the 6-character code from your child's app, for example PA-7K2P9X.");
    const row = await q<any>(db().from("gp_parent_codes").select("student_id").eq("code", c).maybeSingle());
    const child = row && await findAccount("id", row.student_id);
    if (!child) no("That code was not found. Ask your child to open Parent Access in their app and read it out again.");
    const { error } = await db().from("gp_parent_links").insert({ parent_id: p.id, student_id: child!.id });
    if (error?.code === "23505") no(`${child!.name} is already on your list.`);
    if (error) throw error;
    return { phone: digits(child!.phone), name: child!.name, linkedAt: Date.now() };
  },
  async "parent.unlink"(v, b) {
    const me = user(v);
    if (me.role === "parent") {
      const st = await findAccount("phone", digits(b.studentPhone));
      if (st) await q(db().from("gp_parent_links").delete().eq("parent_id", me.id).eq("student_id", st.id));
    } else {
      const par = await findAccount("phone", digits(b.parentPhone));
      if (par) await q(db().from("gp_parent_links").delete().eq("parent_id", par.id).eq("student_id", me.id));
    }
    return true;
  },

  /* teacher profile */
  async "teacher.school"(v, b) {
    const t = user(v, "teacher");
    const s = (SCHOOLS as any[]).find((x) => x.id === b.schoolId);
    if (!s) no("Choose your school from the list.");
    await q(db().from("gp_accounts").update({ school_id: s.id, school: s.name, region: s.region }).eq("id", t.id));
    await q(db().from("gp_classrooms").update({ school_id: s.id }).eq("teacher_id", t.id));
    return { id: s.id, name: s.name, region: s.region };
  },
};
