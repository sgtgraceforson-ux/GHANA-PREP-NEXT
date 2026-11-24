// Classroom announcements, stored in the GhanaPrep database so they reach every student's phone.
// Changes go through the server (only the classroom's teacher can post); reads use this device's
// synced copy, refreshed every few seconds while a screen is open (subscribe).
import { listStudentClassrooms, type Classroom } from "@/lib/classrooms";
import { act, syncData, onSynced } from "@/lib/sync";
import type { Attachment } from "@/lib/assignments";

export type Announcement = {
  id: string; classroomId: string; teacherName: string;
  title: string; message: string; attachment: Attachment | null;
  pinned: boolean; createdAt: number; editedAt: number | null;
};
export type StudentAnnouncement = Announcement & { classroomName: string; unread: boolean };

const KEY = "gp_announcements_v1";
const READ_KEY = "gp_announcement_reads_v1"; // { [studentPhone]: { [announcementId]: readAtMs } }
export const MAX_ATTACHMENT = 700 * 1024;
export const MAX_TITLE = 80, MAX_MESSAGE = 1000;

const read = (k: string, d: any) => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch { return d; } };
const all = (): Announcement[] => read(KEY, []);
// pinned first, then newest first
const order = (a: Announcement, b: Announcement) => Number(b.pinned) - Number(a.pinned) || b.createdAt - a.createdAt;

export type SaveResult = { ok: boolean; error?: string; announcement?: Announcement };

function check(title: string, message: string): string | null {
  if (!title.trim()) return "Add a title.";
  if (title.trim().length > MAX_TITLE) return `Keep the title under ${MAX_TITLE} characters.`;
  if (!message.trim()) return "Write a message.";
  if (message.trim().length > MAX_MESSAGE) return `Keep the message under ${MAX_MESSAGE} characters.`;
  return null;
}

export async function createAnnouncement(room: Classroom, input: { title: string; message: string; attachment: Attachment | null }): Promise<SaveResult> {
  const error = check(input.title, input.message); if (error) return { ok: false, error };
  const r = await act<Announcement>("announcement.save", { classroomId: room.id, ...input });
  return r.ok ? { ok: true, announcement: r.result } : { ok: false, error: r.error };
}

export async function updateAnnouncement(id: string, input: { title: string; message: string; attachment: Attachment | null }): Promise<SaveResult> {
  const error = check(input.title, input.message); if (error) return { ok: false, error };
  const r = await act<Announcement>("announcement.save", { id, ...input });
  return r.ok ? { ok: true, announcement: r.result } : { ok: false, error: r.error };
}

export async function togglePin(id: string): Promise<void> { await act("announcement.pin", { id }); }

export async function deleteAnnouncement(id: string): Promise<void> { await act("announcement.delete", { id }); }

export const listAnnouncements = (classroomId: string): Announcement[] => all().filter((a) => a.classroomId === classroomId).sort(order);

/* ---------- student side ---------- */
const reads = (phone: string): Record<string, number> => read(READ_KEY, {})[phone] || {};

/** Every announcement from the classrooms this student has joined. Pass classroomId to limit it to one. */
export function listForStudent(phone: string, classroomId?: string): StudentAnnouncement[] {
  const rooms = listStudentClassrooms(phone).filter((c) => !classroomId || c.id === classroomId);
  const names: Record<string, string> = {}; rooms.forEach((c) => { names[c.id] = c.name; });
  const seen = reads(phone);
  return all().filter((a) => names[a.classroomId]).sort(order)
    .map((a) => ({ ...a, classroomName: names[a.classroomId], unread: !seen[a.id] }));
}
export const unreadCount = (phone: string): number => listForStudent(phone).filter((a) => a.unread).length;

export async function markRead(phone: string, ids: string[]): Promise<void> {
  if (!phone || !ids.length) return;
  const seen = reads(phone);
  const fresh = ids.filter((id) => !seen[id]);
  if (fresh.length) await act("announcement.read", { ids: fresh });
}

/* ---------- live updates ----------
   Calls fn whenever announcements may have changed: straight away in this tab,
   through the browser's storage event in other tabs, and on a short timer as a fallback. */
export function subscribe(fn: () => void, everyMs = 8000): () => void {
  const off = onSynced(fn); // after any refresh of the synced copy
  const t = window.setInterval(() => { if (document.visibilityState === "visible") syncData(); }, everyMs);
  return () => { off(); window.clearInterval(t); };
}

export const formatDateTime = (ms: number): string =>
  new Date(ms).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
