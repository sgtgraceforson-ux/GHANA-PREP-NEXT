"use client";
import { useEffect, useRef, useState } from "react";
import { ListOrdered, RefreshCw } from "lucide-react";
import { rich } from "@/components/tutor-chat";

// Detailed, step-by-step AI explanation of a built-in practice question.
// Shown after the student has answered. The parent should render it with key={q.id}
// so it resets when the question changes.
type Props = {
  q: any;                 // question from the built-in bank
  exam?: string;          // "BECE" | "WASSCE"
  subject?: string;
  chosen?: string;        // objectives: the option letter the student picked
  studentAnswer?: string; // theory: what the student wrote
  accent?: string;
};

// Objective explanations are saved on the device, so opening one again costs no AI call.
const cacheKey = (q: any, chosen?: string) => `gp_explain_v1_${q.id}_${chosen || "-"}`;

export function StepExplanation({ q, exam, subject, chosen, studentAnswer, accent = "#16a34a" }: Props) {
  const cacheable = !studentAnswer && !!q?.id; // written answers get a personal explanation each time
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (cacheable) { try { setText(localStorage.getItem(cacheKey(q, chosen)) || ""); } catch {} }
    return () => abortRef.current?.abort();
  }, []);

  async function load() {
    if (busy) return;
    setBusy(true); setError(""); setText("");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let out = "";
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          mode: "explain",
          context: {
            exam, subject, topic: q.topic, question: q.question, options: q.options, correct: q.correct,
            solution: [q.answer, q.solution || q.explanation].filter(Boolean).join(". "),
            chosen, studentAnswer,
          },
        }),
      });
      if (!res.ok || !res.body) {
        let message = "";
        try { message = (await res.json())?.error || ""; } catch {}
        throw new Error(message || "The explanation could not be loaded. Try again.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        out += decoder.decode(value, { stream: true });
        setText(out);
      }
      if (!out.trim()) throw new Error("The explanation came back empty. Try again.");
      if (cacheable) { try { localStorage.setItem(cacheKey(q, chosen), out); } catch {} }
    } catch (e: any) {
      if (!ctrl.signal.aborted) {
        setText(""); // never leave half an explanation on screen
        setError(e?.message && !/fetch|network|load failed/i.test(e.message) ? e.message : "Could not load the explanation. Check your connection and try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  const label = { fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em" };

  if (!text && !busy) {
    return (
      <div style={{ marginTop: 12 }}>
        <button type="button" onClick={load}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 14px", borderRadius: 12, background: "var(--surface3)", border: `1.5px solid ${accent}`, color: accent, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
          <ListOrdered size={17} aria-hidden="true" />
          {error ? "Try again" : "Explain step by step"}
        </button>
        {error && <p role="alert" style={{ fontSize: 12, color: "var(--danger)", marginTop: 8 }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 14 }} aria-live="polite" aria-busy={busy}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <p style={label}>Step-by-step explanation</p>
        {!busy && (
          <button type="button" onClick={load} title="Write the explanation again" aria-label="Write the explanation again"
            style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", padding: 4, color: "var(--muted)", fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>
            <RefreshCw size={13} aria-hidden="true" /> Redo
          </button>
        )}
      </div>
      <div style={{ background: "var(--surface3)", border: "1px solid var(--border2)", borderRadius: 10, padding: "12px 14px", fontSize: 14, lineHeight: 1.75, color: "var(--text)", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
        {text ? rich(text) : "Writing your explanation…"}
      </div>
      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>Written by AI. If a step looks wrong, ask the tutor or check with your teacher.</p>
    </div>
  );
}
