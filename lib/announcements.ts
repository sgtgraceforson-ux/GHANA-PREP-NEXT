// Classroom announcements. Demo/local mode: stored in this browser's localStorage,
// so they reach students on the same device only. Swap these functions for Supabase
// queries (plus a realtime subscription in subscribe()) to reach every phone.
import { listStudentClassrooms, type Classroom } from "@/lib/classrooms";
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
function write(k: string, v: any): boolean {
  try { localStorage.setItem(k, JSON.stringify(v)); ping(); return true; } catch { return false; } // false = storage full
}
const all = (): Announcement[] => read(KEY, []);
// pinned first, then newest first
const order = (a: Announcement, b: Announcement) => Number(b.pinned) - Number(a.pinned) || b.createdAt - a.createdAt;

export type SaveResult = { ok: boolean; error?: string; announcement?: Announcement };
const FULL = "This device's storage is full. Remove the attachment or delete old announcements.";

function check(title: string, message: string): string | null {
  if (!title.trim()) return "Add a title.";
  if (title.trim().length > MAX_TITLE) return `Keep the title under ${MAX_TITLE} characters.`;
  if (!message.trim()) return "Write a message.";
  if (message.trim().length > MAX_MESSAGE) return `Keep the message under ${MAX_MESSAGE} characters.`;
  return null;
}

export function createAnnouncement(room: Classroom, input: { title: string; message: string; attachment: Attachment | null }): SaveResult {
  const error = check(input.title, input.message); if (error) return { ok: false, error };
  const a: Announcement = {
    id: "an_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    classroomId: room.id, teacherName: room.teacherName,
    title: input.title.trim(), message: input.message.trim(), attachment: input.attachment,
    pinned: false, createdAt: Date.now(), editedAt: null,
  };
  return write(KEY, [...all(), a]) ? { ok: true, announcement: a } : { ok: false, error: FULL };
}

export function updateAnnouncement(id: string, input: { title: string; message: string; attachment: Attachment | null }): SaveResult {
  const error = check(input.title, input.message); if (error) return { ok: false, error };
  const list = all(); const a = list.find((x) => x.id === id);
  if (!a) return { ok: false, error: "This announcement no longer exists." };
  a.title = input.title.trim(); a.message = input.message.trim(); a.attachment = input.attachment; a.editedAt = Date.now();
  return write(KEY, list) ? { ok: true, announcement: a } : { ok: false, error: FULL };
}

export function togglePin(id: string): void {
  const list = all(); const a = list.find((x) => x.id === id);
  if (a) { a.pinned = !a.pinned; write(KEY, list); }
}

export function deleteAnnouncement(id: string): void {
  write(KEY, all().filter((x) => x.id !== id));
}

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

export function markRead(phone: string, ids: string[]): void {
  if (!phone || !ids.length) return;
  const store = read(READ_KEY, {}); const mine = store[phone] || {}; let changed = false;
  ids.forEach((id) => { if (!mine[id]) { mine[id] = Date.now(); changed = true; } });
  if (changed) { store[phone] = mine; write(READ_KEY, store); }
}

/* ---------- live updates ----------
   Calls fn whenever announcements may have changed: straight away in this tab,
   through the browser's storage event in other tabs, and on a short timer as a fallback. */
const EVT = "gp-announcements";
function ping() { try { window.dispatchEvent(new Event(EVT)); } catch {} }
export function subscribe(fn: () => void, everyMs = 4000): () => void {
  const onStorage = (e: StorageEvent) => { if (!e.key || e.key === KEY || e.key === READ_KEY) fn(); };
  window.addEventListener(EVT, fn); window.addEventListener("storage", onStorage);
  const t = window.setInterval(fn, everyMs);
  return () => { window.removeEventListener(EVT, fn); window.removeEventListener("storage", onStorage); window.clearInterval(t); };
}

export const formatDateTime = (ms: number): string =>
  new Date(ms).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
