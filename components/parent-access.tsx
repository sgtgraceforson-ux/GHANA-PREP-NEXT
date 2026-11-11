"use client";
// Student side of the parent feature: a "Parent Access" row for the home screen that opens a sheet
// with the student's private parent code, a WhatsApp share link, and the parents already linked.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, ChevronRight, X, Copy, Check, MessageCircle, RefreshCw } from "lucide-react";
import { getParentCode, newParentCode, formatParentCode, parentsOf, unlink, type LinkedParent } from "@/lib/parents";
import { formatDate } from "@/lib/classrooms";

const btn = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.04)", color: "#f0f4f8", fontWeight: 700, fontSize: 13, cursor: "pointer", textDecoration: "none" } as const;

export function ParentAccessRow({ phone }: { phone?: string }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [parents, setParents] = useState<LinkedParent[]>([]);
  const [copied, setCopied] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = () => { if (phone) { setCode(getParentCode(phone)); setParents(parentsOf(phone)); } };
  useEffect(() => { if (open) load(); }, [open, phone]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  if (!phone) return null;

  const shown = formatParentCode(code);
  const wa = "https://wa.me/?text=" + encodeURIComponent(`Follow my progress on GhanaPrep. Open the app, choose "I'm a Parent", create an account, then tap Add a child and enter my code ${shown}`);
  const copy = () => { navigator.clipboard?.writeText(shown).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <>
      {/* same look as the other rows in the home screen's "With your class" list */}
      <button onClick={() => setOpen(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "13px 15px", background: "transparent", border: "none", borderTop: "1px solid rgba(255,255,255,0.07)", cursor: "pointer", textAlign: "left", color: "inherit" }}>
        <span style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#6ee7b7", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.22)" }}><ShieldCheck size={19} aria-hidden /></span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#ffffff" }}>Parent Access</span>
          <span style={{ display: "block", fontSize: 12, color: "var(--muted, #8899aa)", marginTop: 2 }}>Let a parent follow your progress with a private code</span>
        </span>
        <span style={{ color: "rgba(255,255,255,0.3)", display: "inline-flex" }}><ChevronRight size={18} aria-hidden /></span>
      </button>

      {open && createPortal(
        <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: "'Plus Jakarta Sans','DM Sans',system-ui,sans-serif" }}>
          <div role="dialog" aria-modal="true" aria-label="Parent Access" style={{ width: "100%", maxWidth: 430, maxHeight: "90vh", overflowY: "auto", background: "#0d1512", border: "1px solid rgba(52,211,153,.25)", borderBottom: "none", borderRadius: "24px 24px 0 0", padding: "18px 20px 30px", color: "#f0f4f8", boxSizing: "border-box" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <h2 style={{ fontFamily: "'Sora','Syne',sans-serif", fontSize: 19, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, margin: 0 }}><ShieldCheck size={19} color="#34d399" aria-hidden /> Parent Access</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" style={{ width: 34, height: 34, borderRadius: 999, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", color: "#cbd5d1", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={17} aria-hidden /></button>
            </div>
            <p style={{ fontSize: 13, color: "#8899aa", lineHeight: 1.6, margin: "0 0 14px" }}>Give this code to your parent or guardian. They will be able to see your practice progress, assignments and marks. They cannot change anything.</p>

            <button onClick={copy} aria-label={`Your parent code is ${shown}. Tap to copy.`} style={{ width: "100%", textAlign: "center", background: "linear-gradient(145deg,rgba(16,82,58,.6),rgba(9,34,26,.9))", border: "1.5px solid rgba(52,211,153,.5)", borderRadius: 18, padding: "20px 12px 14px", cursor: "pointer", color: "#f0f4f8" }}>
              <span data-testid="parent-code" style={{ display: "block", fontFamily: "'Sora','Syne',sans-serif", fontSize: 30, fontWeight: 800, letterSpacing: ".16em", color: "#6ee7b7" }}>{shown}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: copied ? "#34d399" : "#8899aa", marginTop: 8 }}>{copied ? <><Check size={13} aria-hidden /> Copied</> : <><Copy size={13} aria-hidden /> Tap to copy</>}</span>
            </button>

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <a href={wa} target="_blank" rel="noopener noreferrer" style={{ ...btn, flex: 1, background: "linear-gradient(135deg,#34d399,#10b981)", border: "none", color: "#04130d", fontWeight: 800 }}><MessageCircle size={15} aria-hidden /> Share on WhatsApp</a>
              <button onClick={() => setConfirmNew(true)} style={btn}><RefreshCw size={14} aria-hidden /> New code</button>
            </div>
            {confirmNew && (
              <div role="alertdialog" aria-label="Confirm new code" style={{ marginTop: 10, background: "rgba(232,196,104,.08)", border: "1px solid rgba(232,196,104,.3)", borderRadius: 12, padding: "11px 13px" }}>
                <p style={{ fontSize: 13, lineHeight: 1.55, margin: "0 0 9px" }}>Make a new code? The old one stops working. Parents already linked stay linked.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setCode(newParentCode(phone)); setConfirmNew(false); }} style={{ ...btn, padding: "8px 13px", background: "#e8c468", border: "none", color: "#1a1303", fontWeight: 800 }}>Yes, new code</button>
                  <button onClick={() => setConfirmNew(false)} style={{ ...btn, padding: "8px 13px" }}>Cancel</button>
                </div>
              </div>
            )}

            <p style={{ fontFamily: "'Sora','Syne',sans-serif", fontWeight: 800, fontSize: 15, margin: "22px 0 8px" }}>Who can see your progress ({parents.length})</p>
            {parents.length === 0 ? <p style={{ fontSize: 13, color: "#8899aa", lineHeight: 1.6, margin: 0 }}>Nobody yet. Only someone you give the code to can follow you.</p> : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {parents.map((p) => (
                  <li key={p.phone} data-linked-parent={p.name} style={{ background: "#161d18", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: "11px 13px", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                        <span style={{ display: "block", fontSize: 12, color: "#8899aa" }}>Linked {formatDate(p.linkedAt)}</span>
                      </span>
                      {removing === p.phone ? (
                        <span style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button onClick={() => { unlink(p.phone, phone); setRemoving(null); load(); }} style={{ ...btn, padding: "7px 11px", background: "#f87171", border: "none", color: "#1a0505", fontWeight: 800 }}>Remove</button>
                          <button onClick={() => setRemoving(null)} style={{ ...btn, padding: "7px 11px" }}>Keep</button>
                        </span>
                      ) : <button onClick={() => setRemoving(p.phone)} aria-label={`Remove ${p.name}`} style={{ ...btn, padding: "7px 11px", color: "#f87171", borderColor: "rgba(248,113,113,.35)", flexShrink: 0 }}>Remove access</button>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>, document.body
      )}
    </>
  );
}
