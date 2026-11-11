"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { GraduationCap, RotateCcw, Send, Square, X } from "lucide-react";
import "./tutor-chat.css";

// What the app knows about the student right now. Pages call setTutorContext() to
// keep it current; passing null hides the tutor (signed out, during a teacher quiz...).
export type TutorContext = {
  userKey?: string;   // keeps each student's chat separate on a shared device
  name?: string;
  exam?: string;      // "BECE" | "WASSCE"
  subject?: string;
  topic?: string;
  question?: string;  // practice question on screen, if any
  options?: string[];
  answered?: boolean; // false = the tutor gives hints only, not the answer
  solution?: string;  // only sent once the student has answered
  layout?: "column" | "page";
};

let current: TutorContext | null = null;
const listeners = new Set<() => void>();
export function setTutorContext(next: TutorContext | null) {
  current = next;
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

type Msg = { role: "user" | "assistant"; content: string };
const HISTORY_SENT = 12;
const HISTORY_KEPT = 40;
const storeKey = (k?: string) => `gp_tutor_chat_${k || "guest"}`;

// Minimal formatting: **bold** and `code`. Everything else is shown as plain text.
export function rich(text: string) {
  return text.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`)/g).map((part, i) => {
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) return <code key={i}>{part.slice(1, -1)}</code>;
    return part;
  });
}

export function TutorChat() {
  const ctx = useSyncExternalStore(subscribe, () => current, () => null);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const loadedKey = useRef<string | null>(null);

  const userKey = ctx?.userKey;
  const enabled = !!ctx;

  // Load this student's chat (kept for the browser tab session only).
  useEffect(() => {
    if (!enabled) return;
    abortRef.current?.abort();
    let saved: Msg[] = [];
    try { saved = JSON.parse(sessionStorage.getItem(storeKey(userKey)) || "[]") || []; } catch {}
    setMsgs(Array.isArray(saved) ? saved : []);
    setError("");
    loadedKey.current = storeKey(userKey);
  }, [enabled, userKey]);

  useEffect(() => {
    if (busy || loadedKey.current !== storeKey(userKey)) return;
    try { sessionStorage.setItem(loadedKey.current, JSON.stringify(msgs.slice(-HISTORY_KEPT))); } catch {}
  }, [msgs, busy, userKey]);

  // Close when the tutor is switched off (sign out, quiz started), and stop any answer in flight.
  useEffect(() => { if (!enabled) { abortRef.current?.abort(); setOpen(false); } }, [enabled]);
  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, open, error]);

  if (!ctx) return null;

  async function send(text: string, history: Msg[] = msgs) {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...history, { role: "user", content: q }];
    setMsgs([...next, { role: "assistant", content: "" }]);
    setInput("");
    setError("");
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let answer = "";
    const show = () => setMsgs([...next, { role: "assistant", content: answer }]);
    try {
      const { userKey: _k, layout: _l, ...context } = ctx!;
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-HISTORY_SENT), context }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        let message = "The tutor could not answer. Try again.";
        try { message = (await res.json())?.error || message; } catch {}
        throw new Error(message);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        show();
      }
      if (!answer.trim()) throw new Error("The tutor did not send an answer. Try asking again.");
    } catch (e: any) {
      const stopped = ctrl.signal.aborted;
      if (!stopped) setError(e?.message && !/fetch|network|load failed/i.test(e.message) ? e.message : "Could not reach the tutor. Check your connection and try again.");
      // keep whatever was written so far; drop the empty bubble otherwise
      setMsgs(answer.trim() ? [...next, { role: "assistant", content: answer }] : next);
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null;
      setBusy(false);
    }
  }

  // After an error the last message is the unanswered question: send it again.
  function retry() {
    const last = msgs[msgs.length - 1];
    if (last?.role === "user") send(last.content, msgs.slice(0, -1));
  }

  function clearChat() {
    abortRef.current?.abort();
    setMsgs([]);
    setError("");
    try { sessionStorage.removeItem(storeKey(userKey)); } catch {}
    inputRef.current?.focus();
  }

  const exam = ctx.exam || "BECE and WASSCE";
  const chips = ctx.question
    ? [
        ctx.answered ? "Explain the solution to this question step by step" : "Give me a hint for this question",
        ctx.topic ? `Explain ${ctx.topic} in a simple way` : "Explain this topic in a simple way",
        "Give me a similar question to practise",
      ]
    : [
        ctx.subject ? `What are the most important topics in ${ctx.subject}?` : `Help me make a revision plan for ${exam}`,
        ctx.subject ? `Quiz me on ${ctx.subject}` : "Quiz me on a topic I choose",
        "Explain something I did not understand in class",
      ];
  const subtitle = [ctx.exam, ctx.subject].filter(Boolean).join(" · ") || "Ask anything about your schoolwork";
  const canRetry = !!error && !busy && msgs[msgs.length - 1]?.role === "user";

  return (
    <div className="gpt" data-layout={ctx.layout || "page"}>
      {!open && (
        <button type="button" className="gpt-fab" onClick={() => setOpen(true)} aria-label="Open the AI study tutor">
          <GraduationCap aria-hidden="true" />
          Ask tutor
        </button>
      )}

      {open && (
        <section className="gpt-panel" role="dialog" aria-label="AI study tutor">
          <header className="gpt-head">
            <div className="gpt-avatar" aria-hidden="true"><GraduationCap /></div>
            <div className="gpt-title">
              <strong>Study tutor</strong>
              <span>{subtitle}</span>
            </div>
            {msgs.length > 0 && (
              <button type="button" className="gpt-icon" onClick={clearChat} aria-label="Start a new chat" title="Start a new chat"><RotateCcw aria-hidden="true" /></button>
            )}
            <button type="button" className="gpt-icon" onClick={() => setOpen(false)} aria-label="Close tutor" title="Close"><X aria-hidden="true" /></button>
          </header>

          {ctx.question && (
            <div className="gpt-context" title={ctx.question}><b>On your screen:</b> {ctx.question}</div>
          )}

          <div className="gpt-list" ref={listRef} aria-live="polite">
            {msgs.length === 0 && (
              <div className="gpt-empty">
                <strong>{ctx.name ? `Hi ${ctx.name}, what are you working on?` : "What are you working on?"}</strong>
                <p>Ask a question, paste one you are stuck on, or share your working and I will check it.</p>
                <div className="gpt-chips">
                  {chips.map((c) => (
                    <button type="button" key={c} className="gpt-chip" onClick={() => send(c)}>{c}</button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className="gpt-msg" data-role={m.role}>
                {m.content ? rich(m.content) : <span className="gpt-dots" aria-label="The tutor is thinking"><i /><i /><i /></span>}
              </div>
            ))}
            {error && (
              <div className="gpt-error" role="alert">
                {error}
                {canRetry && <button type="button" onClick={retry}>Try again</button>}
              </div>
            )}
          </div>

          <form className="gpt-form" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={2000}
              placeholder="Ask your question"
              aria-label="Your question for the tutor"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(input); }
              }}
            />
            {busy ? (
              <button type="button" className="gpt-send" onClick={() => abortRef.current?.abort()} aria-label="Stop the answer" title="Stop"><Square aria-hidden="true" /></button>
            ) : (
              <button type="submit" className="gpt-send" disabled={!input.trim()} aria-label="Send" title="Send"><Send aria-hidden="true" /></button>
            )}
          </form>
          <p className="gpt-note">The tutor is an AI and can make mistakes. Check important answers with your teacher.</p>
        </section>
      )}
    </div>
  );
}
