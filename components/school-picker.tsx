"use client";
import { useEffect, useId, useState } from "react";
import { loadSchools, searchSchools, type School } from "@/lib/schools";

// Searchable list of government SHS. Choosing a school is required for teachers: it is what
// links their classrooms to their headmaster's dashboard.
export function SchoolPicker({ value, onChange, error, onMissing, label = "Your school" }: {
  value: School | null;
  onChange: (s: School | null) => void;
  error?: string;
  onMissing?: () => void; // "My school is not listed"
  label?: string;
}) {
  const id = useId();
  const [all, setAll] = useState<School[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  useEffect(() => { loadSchools().then(setAll).catch(() => setAll([])); }, []);

  const results = searchSchools(all, q);
  const pick = (s: School) => { onChange(s); setQ(""); setOpen(false); };
  const border = error ? "var(--danger, #f87171)" : "rgba(255,255,255,0.14)";
  const lbl = { display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted2, #8899aa)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 } as const;

  return (
    <div style={{ marginBottom: 14, position: "relative" }}>
      <label htmlFor={id} style={lbl}>{label}</label>
      {value ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 12, background: "rgba(52,211,153,0.08)", border: "1.5px solid rgba(52,211,153,0.4)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text, #f0f4f8)" }}>{value.name}</p>
            <p style={{ fontSize: 12, color: "var(--muted2, #8899aa)", marginTop: 2 }}>{[value.town, value.region].filter(Boolean).join(" · ")}</p>
          </div>
          <button type="button" onClick={() => onChange(null)} style={{ background: "none", border: "none", color: "#34d399", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Change</button>
        </div>
      ) : (
        <>
          <input id={id} type="search" value={q} autoComplete="off" placeholder="Type your school's name or town"
            role="combobox" aria-expanded={open && results.length > 0} aria-controls={id + "-list"}
            onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              else if (e.key === "Enter" && results[active]) { e.preventDefault(); pick(results[active]); }
            }}
            style={{ width: "100%", padding: "13px 14px", background: "rgba(30,39,31,0.9)", border: `1.5px solid ${border}`, borderRadius: 12, color: "var(--text, #f0f4f8)", fontSize: 16, fontFamily: "inherit", outline: "none" }} />
          {open && q.trim() && (
            <div id={id + "-list"} role="listbox" style={{ position: "absolute", left: 0, right: 0, top: "100%", zIndex: 50, marginTop: 4, maxHeight: 300, overflowY: "auto", borderRadius: 12, background: "#141c17", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
              {results.map((s, i) => (
                <button key={s.id} type="button" role="option" aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", border: "none", borderBottom: "1px solid rgba(255,255,255,0.06)", background: i === active ? "rgba(52,211,153,0.12)" : "transparent", color: "var(--text, #f0f4f8)", cursor: "pointer", fontFamily: "inherit" }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>{s.name}</span>
                  <span style={{ display: "block", fontSize: 12, color: "var(--muted2, #8899aa)", marginTop: 2 }}>{[s.town, s.region].filter(Boolean).join(" · ")}</span>
                </button>
              ))}
              {results.length === 0 && <p style={{ padding: "12px 14px", fontSize: 13, color: "var(--muted2, #8899aa)" }}>{all.length ? "No school found with that name." : "Loading schools…"}</p>}
              {onMissing && (
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onMissing}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 14px", border: "none", background: "transparent", color: "#34d399", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  My school is not listed
                </button>
              )}
            </div>
          )}
        </>
      )}
      {error && <p style={{ fontSize: 11, color: "var(--danger, #f87171)", marginTop: 5 }}>{error}</p>}
    </div>
  );
}
