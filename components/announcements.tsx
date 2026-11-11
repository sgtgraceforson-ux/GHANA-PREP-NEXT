"use client";
// Student side of announcements:
//  - <AnnouncementBell>  bell with an unread count for the home screen, a pop-up when a new one
//                        arrives while the app is open, and a sheet listing every announcement.
//  - <ClassAnnouncements> the list shown inside one classroom's page.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, Paperclip, Pin, X } from "lucide-react";
import { listForStudent, markRead, subscribe, formatDateTime, type StudentAnnouncement } from "@/lib/announcements";

function Item({ a, showClass }: { a: StudentAnnouncement; showClass: boolean }) {
  return (
    <li data-announcement={a.title} style={{ listStyle: "none", background: "#161d18", border: `1px solid ${a.pinned ? "rgba(232,196,104,.45)" : "rgba(255,255,255,.08)"}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
        {a.unread && <span style={{ fontSize: 10, fontWeight: 800, color: "#04130d", background: "#34d399", borderRadius: 999, padding: "2px 8px" }}>NEW</span>}
        {a.pinned && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 800, color: "#e8c468", letterSpacing: ".06em" }}><Pin size={11} aria-hidden /> PINNED</span>}
        {showClass && <span style={{ fontSize: 11, color: "#8899aa", fontWeight: 600 }}>{a.classroomName}</span>}
      </div>
      <p style={{ fontWeight: 700, fontSize: 15, color: "#f0f4f8", overflowWrap: "anywhere" }}>{a.title}</p>
      <p style={{ fontSize: 12, color: "#8899aa", marginTop: 2 }}>
        {a.teacherName} · <time dateTime={new Date(a.createdAt).toISOString()}>{formatDateTime(a.createdAt)}</time>{a.editedAt ? " · Edited" : ""}
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "#dfe7e3", marginTop: 9, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{a.message}</p>
      {a.attachment && (
        <a href={a.attachment.dataUrl} download={a.attachment.name} style={{ display: "inline-flex", alignItems: "center", gap: 6, maxWidth: "100%", marginTop: 9, fontSize: 13, color: "#22c55e", fontWeight: 600, textDecoration: "none" }}>
          <Paperclip size={14} aria-hidden /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.attachment.name}</span>
        </a>
      )}
    </li>
  );
}

/** Live list of a student's announcements; refreshes itself when a teacher posts, edits, pins or deletes. */
function useAnnouncements(phone: string | undefined, classroomId?: string) {
  const [list, setList] = useState<StudentAnnouncement[]>([]);
  useEffect(() => {
    if (!phone) { setList([]); return; }
    const load = () => setList(listForStudent(phone, classroomId));
    load(); return subscribe(load);
  }, [phone, classroomId]);
  return list;
}

export function AnnouncementBell({ phone }: { phone?: string }) {
  const list = useAnnouncements(phone);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<StudentAnnouncement | null>(null);
  const [shown, setShown] = useState<StudentAnnouncement[]>([]); // what the open sheet displays, with its NEW tags frozen
  const known = useRef<Set<string> | null>(null); // ids already seen by this screen, so only fresh ones pop up
  const unread = list.filter((a) => a.unread);

  useEffect(() => {
    const ids = new Set(list.map((a) => a.id));
    if (known.current) {
      const fresh = list.find((a) => a.unread && !known.current!.has(a.id));
      if (fresh && !open) setToast(fresh);
    }
    known.current = ids;
    if (open) setShown((prev) => list.map((a) => ({ ...a, unread: prev.find((p) => p.id === a.id)?.unread ?? a.unread })));
  }, [list, open]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function openSheet() {
    setShown(list); setToast(null); setOpen(true);
    if (phone) markRead(phone, unread.map((a) => a.id)); // opening the bell marks them as read
  }

  return (
    <>
      <button onClick={openSheet} aria-label={unread.length ? `Announcements, ${unread.length} unread` : "Announcements"} title="Announcements"
        style={{ position: "relative", width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5d1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
        <Bell size={17} aria-hidden />
        {unread.length > 0 && (
          <span data-testid="bell-count" aria-hidden style={{ position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999, background: "#f87171", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #07100c" }}>{unread.length > 9 ? "9+" : unread.length}</span>
        )}
      </button>

      {/* The pop-up and the sheet are drawn on <body>, so an animated parent cannot trap or misplace them. */}
      {toast && createPortal(
        <div role="status" data-testid="an-toast" style={{ position: "fixed", bottom: "calc(18px + env(safe-area-inset-bottom, 0px))", left: "50%", transform: "translateX(-50%)", zIndex: 900, width: "calc(100% - 28px)", maxWidth: 400 }}>
          <button onClick={openSheet} style={{ width: "100%", display: "flex", alignItems: "flex-start", gap: 11, textAlign: "left", background: "#12241c", border: "1px solid rgba(52,211,153,.5)", borderRadius: 14, padding: "12px 14px", color: "#f0f4f8", cursor: "pointer", boxShadow: "0 14px 34px -10px rgba(0,0,0,.8)" }}>
            <Bell size={17} color="#34d399" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6ee7b7" }}>New announcement · {toast.classroomName}</span>
              <span style={{ display: "block", fontSize: 14, fontWeight: 700, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{toast.title}</span>
            </span>
          </button>
        </div>, document.body
      )}

      {open && createPortal(
        <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div role="dialog" aria-modal="true" aria-label="Announcements" style={{ width: "100%", maxWidth: 430, maxHeight: "88vh", display: "flex", flexDirection: "column", background: "#0d1512", border: "1px solid rgba(52,211,153,.25)", borderBottom: "none", borderRadius: "24px 24px 0 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 12px", flexShrink: 0 }}>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 19, fontWeight: 800, color: "#f0f4f8", display: "flex", alignItems: "center", gap: 8 }}><Bell size={18} color="#34d399" aria-hidden /> Announcements</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" style={{ width: 34, height: 34, borderRadius: 999, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", color: "#cbd5d1", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={17} aria-hidden /></button>
            </div>
            <div style={{ overflowY: "auto", padding: "0 16px 30px" }}>
              {shown.length === 0
                ? <p style={{ fontSize: 13, color: "#8899aa", textAlign: "center", padding: "34px 10px", lineHeight: 1.6 }}>No announcements yet. When a teacher posts to a classroom you have joined, it appears here.</p>
                : <ul style={{ margin: 0, padding: 0 }}>{shown.map((a) => <Item key={a.id} a={a} showClass />)}</ul>}
            </div>
          </div>
        </div>, document.body
      )}
    </>
  );
}

export function ClassAnnouncements({ phone, classroomId }: { phone: string; classroomId: string }) {
  const list = useAnnouncements(phone, classroomId);
  const [fresh, setFresh] = useState<Set<string>>(new Set()); // keeps the NEW tag visible for this visit
  useEffect(() => {
    const ids = list.filter((a) => a.unread).map((a) => a.id);
    if (!ids.length) return;
    setFresh((s) => new Set([...Array.from(s), ...ids])); markRead(phone, ids);
  }, [list, phone]);
  if (list.length === 0) return null;
  return (
    <section aria-label="Announcements" style={{ marginBottom: 18 }}>
      <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, marginBottom: 10 }}>Announcements ({list.length})</p>
      <ul style={{ margin: 0, padding: 0 }}>{list.map((a) => <Item key={a.id} a={{ ...a, unread: fresh.has(a.id) }} showClass={false} />)}</ul>
    </section>
  );
}
