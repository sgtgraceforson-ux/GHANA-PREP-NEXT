"use client";
// Keeps this device's copy of the shared data (classrooms, assignments, announcements, quizzes,
// parent links) in step with the GhanaPrep database.
//
// The server sends a snapshot of ONLY what the signed-in person may see, in the same shape as the
// app's device stores, so screens keep reading it synchronously. Changes go to the server first
// (act); the server checks permission, saves, and sends back a fresh snapshot.
import { useEffect, useState } from "react";

export const SYNCED_KEYS = [
  "gp_local_accs", "gp_teachers_v1", "gp_classrooms_v1", "gp_classroom_members_v1", "gp_assignments_v1", "gp_submissions_v1",
  "gp_announcements_v1", "gp_announcement_reads_v1", "gp_quizzes_v1", "gp_quiz_results_v1", "gp_challenge_joined_v1",
  "gp_parent_codes_v1", "gp_parent_links_v1", "gp_parents_v1",
];
const EVT = "gp-synced";
let version = 0;

export function applySnapshot(s: Record<string, any> | undefined) {
  if (!s) return;
  for (const k of SYNCED_KEYS) {
    if (!(k in s)) continue;
    try { localStorage.setItem(k, JSON.stringify(s[k])); } catch {}
  }
  version++;
  try { window.dispatchEvent(new Event(EVT)); } catch {}
}

/** Removes every synced copy, e.g. on sign-out on a shared computer. */
export function clearSynced() {
  for (const k of SYNCED_KEYS) { try { localStorage.removeItem(k); } catch {} }
  version++;
}

let inflight: Promise<boolean> | null = null;
/** Downloads the latest snapshot. Resolves false when signed out or offline. */
export function syncData(): Promise<boolean> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const r = await fetch("/api/data", { cache: "no-store" });
      if (!r.ok) return false;
      const d = await r.json();
      applySnapshot(d.snapshot);
      return true;
    } catch { return false; } finally { setTimeout(() => { inflight = null; }, 0); }
  })();
  return inflight;
}

export type ActResult<T = any> = { ok: boolean; error?: string; result?: T };
/** Sends one change to the server. On success the device copy is refreshed. */
export async function act<T = any>(action: string, payload: Record<string, any> = {}): Promise<ActResult<T>> {
  try {
    const r = await fetch("/api/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...payload }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.ok) return { ok: false, error: d.error || (r.status === 401 ? "Your session has ended. Sign in again." : "Something went wrong. Try again.") };
    applySnapshot(d.snapshot);
    return { ok: true, result: d.result };
  } catch {
    return { ok: false, error: "Network error. Check your connection and try again." };
  }
}

/** Calls fn after every refresh of the device copy. */
export function onSynced(fn: () => void) {
  window.addEventListener(EVT, fn);
  return () => window.removeEventListener(EVT, fn);
}

/**
 * Downloads the snapshot when the screen opens, then every `everyMs` and whenever the app comes
 * back into view. `ready` turns true after the first download (or failure); `v` changes after each
 * refresh, so screens can re-read their data.
 */
export function useSyncedData(everyMs = 30000) {
  const [ready, setReady] = useState(false);
  const [v, setV] = useState(version);
  useEffect(() => {
    let alive = true;
    syncData().finally(() => { if (alive) { setReady(true); setV(version); } });
    const off = onSynced(() => alive && setV(version));
    const t = window.setInterval(() => { if (document.visibilityState === "visible") syncData(); }, everyMs);
    const onShow = () => { if (document.visibilityState === "visible") syncData(); };
    document.addEventListener("visibilitychange", onShow);
    return () => { alive = false; off(); window.clearInterval(t); document.removeEventListener("visibilitychange", onShow); };
  }, [everyMs]);
  return { ready, v };
}
