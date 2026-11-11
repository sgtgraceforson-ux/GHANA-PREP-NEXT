"use client";
// TAB 3: Announcements. Post (title, message, optional attachment), history with date and time,
// pin, edit and delete.
import { useEffect, useState } from "react";
import { Paperclip, Pin, PinOff, Pencil, Trash2, Megaphone } from "lucide-react";
import type { Classroom } from "@/lib/classrooms";
import type { Attachment } from "@/lib/assignments";
import {
  createAnnouncement, updateAnnouncement, deleteAnnouncement, togglePin, listAnnouncements, formatDateTime,
  MAX_ATTACHMENT, MAX_TITLE, MAX_MESSAGE, type Announcement,
} from "@/lib/announcements";

const card = { background: "#161d18", border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: 16 } as const;
const lbl = { display: "block", fontSize: 11, fontWeight: 700, color: "#8899aa", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 } as const;
const inp = { width: "100%", padding: "12px 14px", background: "#1e271f", border: "1.5px solid rgba(255,255,255,.12)", borderRadius: 12, color: "#f0f4f8", font: "500 14px 'DM Sans',sans-serif", outline: "none" } as const;
const btn = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,.16)", background: "#1e271f", color: "#f0f4f8", fontWeight: 600, fontSize: 12, cursor: "pointer" } as const;
const primary = { padding: "11px 18px", border: "none", borderRadius: 10, background: "#22c55e", color: "#000", fontWeight: 800, fontSize: 13, cursor: "pointer" } as const;

const readFile = (f: File) => new Promise<Attachment>((res, rej) => {
  const r = new FileReader();
  r.onload = () => res({ name: f.name, type: f.type, size: f.size, dataUrl: String(r.result) });
  r.onerror = () => rej(r.error); r.readAsDataURL(f);
});
const kb = (n: number) => (n < 1024 * 1024 ? Math.max(1, Math.round(n / 1024)) + " KB" : (n / 1024 / 1024).toFixed(1) + " MB");

/* The same form posts a new announcement and edits an existing one. */
function Composer({ room, editing, onDone, onCancel }: { room: Classroom; editing: Announcement | null; onDone: (msg: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(editing?.title || "");
  const [message, setMessage] = useState(editing?.message || "");
  const [file, setFile] = useState<Attachment | null>(editing?.attachment || null);
  const [err, setErr] = useState("");

  async function pick(list: FileList | null) {
    const f = list && list[0]; if (!f) return;
    if (f.size > MAX_ATTACHMENT) { setErr(`${f.name} is larger than 700 KB. Choose a smaller file.`); return; }
    try { setFile(await readFile(f)); setErr(""); } catch { setErr("That file could not be read. Try another one."); }
  }
  function save() {
    const input = { title, message, attachment: file };
    const r = editing ? updateAnnouncement(editing.id, input) : createAnnouncement(room, input);
    if (!r.ok) { setErr(r.error || "Could not save."); return; }
    onDone(editing ? "Announcement updated." : "Announcement posted. Students in this classroom can see it now.");
  }

  return (
    <div style={{ ...card, marginBottom: 14, borderColor: editing ? "rgba(232,196,104,.4)" : "rgba(255,255,255,.08)" }}>
      <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, marginBottom: 12 }}>{editing ? "Edit announcement" : "New announcement"}</p>
      <label style={lbl} htmlFor="an-title">Title</label>
      <input id="an-title" style={inp} value={title} maxLength={MAX_TITLE} onChange={(e) => { setTitle(e.target.value); setErr(""); }} placeholder="e.g. Mock exam on Friday" />
      <label style={{ ...lbl, marginTop: 12 }} htmlFor="an-message">Message</label>
      <textarea id="an-message" style={{ ...inp, minHeight: 96, resize: "vertical", lineHeight: 1.5 }} value={message} maxLength={MAX_MESSAGE} onChange={(e) => { setMessage(e.target.value); setErr(""); }} placeholder="What should your students know?" />
      <p style={{ fontSize: 11, color: "#566370", textAlign: "right", marginTop: 3 }}>{message.length} / {MAX_MESSAGE}</p>

      <span style={lbl}>Attachment (optional)</span>
      {file ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#1e271f", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: "9px 12px" }}>
          <Paperclip size={15} color="#8899aa" aria-hidden />
          <span style={{ flex: 1, minWidth: 0, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name} <span style={{ color: "#8899aa" }}>· {kb(file.size)}</span></span>
          <button type="button" onClick={() => setFile(null)} style={{ ...btn, padding: "5px 10px" }}>Remove</button>
        </div>
      ) : (
        <input type="file" aria-label="Attach a file" onChange={(e) => { pick(e.target.files); e.target.value = ""; }} style={{ fontSize: 12, color: "#8899aa", maxWidth: "100%" }} />
      )}
      <p style={{ fontSize: 11, color: "#566370", marginTop: 5 }}>One file, up to 700 KB.</p>

      {err && <p role="alert" style={{ color: "#f87171", fontSize: 13, fontWeight: 600, marginTop: 10 }}>{err}</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button type="button" onClick={save} style={primary}>{editing ? "Save changes" : "Post announcement"}</button>
        {editing && <button type="button" onClick={onCancel} style={{ ...btn, padding: "11px 16px" }}>Cancel</button>}
      </div>
    </div>
  );
}

export function AnnouncementsTab({ room }: { room: Classroom }) {
  const [list, setList] = useState<Announcement[]>([]);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [formKey, setFormKey] = useState(0); // remounts the form so it clears after posting
  const load = () => setList(listAnnouncements(room.id));
  useEffect(load, [room.id]);

  const done = (msg: string) => { setEditing(null); setFormKey((k) => k + 1); setNote(msg); load(); };

  return (
    <div>
      <Composer key={(editing?.id || "new") + formKey} room={room} editing={editing} onDone={done} onCancel={() => setEditing(null)} />
      {note && <p role="status" style={{ background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", color: "#4ade80", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{note}</p>}

      <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, marginBottom: 10 }}>History <span data-testid="an-count" style={{ color: "#8899aa", fontWeight: 600 }}>({list.length})</span></p>
      {list.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: "26px 16px" }}>
          <Megaphone size={26} color="#566370" aria-hidden />
          <p style={{ fontSize: 13, color: "#8899aa", marginTop: 8, lineHeight: 1.6 }}>No announcements yet. Post one above and your students will see it in their app.</p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {list.map((a) => (
            <li key={a.id} data-announcement={a.title} style={{ ...card, marginBottom: 10, borderColor: a.pinned ? "rgba(232,196,104,.45)" : "rgba(255,255,255,.08)" }}>
              {a.pinned && <p style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 800, color: "#e8c468", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}><Pin size={12} aria-hidden /> Pinned</p>}
              <p style={{ fontWeight: 700, fontSize: 15, overflowWrap: "anywhere" }}>{a.title}</p>
              <p style={{ fontSize: 12, color: "#8899aa", marginTop: 3 }}>
                <time dateTime={new Date(a.createdAt).toISOString()}>{formatDateTime(a.createdAt)}</time>
                {a.editedAt ? <> · Edited {formatDateTime(a.editedAt)}</> : null}
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 10, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{a.message}</p>
              {a.attachment && (
                <a href={a.attachment.dataUrl} download={a.attachment.name} style={{ display: "inline-flex", alignItems: "center", gap: 6, maxWidth: "100%", marginTop: 10, fontSize: 13, color: "#22c55e", fontWeight: 600, textDecoration: "none" }}>
                  <Paperclip size={14} aria-hidden /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.attachment.name}</span>
                </a>
              )}

              {confirmId === a.id ? (
                <div role="alertdialog" aria-label="Confirm delete" style={{ marginTop: 14, background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.3)", borderRadius: 10, padding: "10px 12px" }}>
                  <p style={{ fontSize: 13, marginBottom: 9 }}>Delete this announcement? Students will no longer see it.</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => { deleteAnnouncement(a.id); setConfirmId(null); if (editing?.id === a.id) setEditing(null); setNote("Announcement deleted."); load(); }} style={{ ...btn, background: "#f87171", borderColor: "#f87171", color: "#1a0505", fontWeight: 800 }}>Yes, delete</button>
                    <button type="button" onClick={() => setConfirmId(null)} style={btn}>Keep it</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                  <button type="button" onClick={() => { togglePin(a.id); setNote(""); load(); }} aria-pressed={a.pinned} style={btn}>{a.pinned ? <><PinOff size={14} aria-hidden /> Unpin</> : <><Pin size={14} aria-hidden /> Pin</>}</button>
                  <button type="button" onClick={() => { setEditing(a); setNote(""); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={btn}><Pencil size={14} aria-hidden /> Edit</button>
                  <button type="button" onClick={() => setConfirmId(a.id)} style={{ ...btn, color: "#f87171", borderColor: "rgba(248,113,113,.35)" }}><Trash2 size={14} aria-hidden /> Delete</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
