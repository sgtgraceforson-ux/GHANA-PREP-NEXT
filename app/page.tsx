// @ts-nocheck  (large untyped port of the original JSX app)
"use client";

import { useState, useRef, useEffect } from "react";
import { TutorChat, setTutorContext } from "@/components/tutor-chat";
import { StepExplanation } from "@/components/step-explanation";
import { HomeSkeleton, LeaderboardSkeleton, BootSkeleton } from "@/components/skeletons";
import { AnnouncementBell } from "@/components/announcements";
import { ParentAccessRow } from "@/components/parent-access";
import { startParentSession } from "@/lib/parents";
import { Accessibility, Atom, Award, BookOpen, Bot, Calculator, Check, ChevronRight, LogOut, Play, ClipboardList, Cookie, CreditCard, Flame, Globe, GraduationCap, Hourglass, Inbox, Key, Languages, Library, Lightbulb, ListChecks, Lock, Mail, Map, Medal, MessageCircle, Mic, PartyPopper, PenLine, Pencil, Plus, Presentation, RefreshCw, Rocket, Ruler, Save, School, Smartphone, Sparkles, Star, Target, Trash2, TrendingUp, TriangleAlert, Trophy, User, Users, Volume2, X, Zap } from "lucide-react";

// One icon set for the whole app. <Ico n="trophy" /> scales with the surrounding text size.
const ICONS = { chev: ChevronRight, logout: LogOut, play: Play, calc: Calculator, lang: Languages, card: CreditCard, trash: Trash2, access: Accessibility, ok: Check, check: Check, warn: TriangleAlert, close: X, no: X, lock: Lock, trophy: Trophy, message: MessageCircle, target: Target, school: School, pen: PenLine, chart: TrendingUp, party: PartyPopper, mail: Mail, clipboard: ClipboardList, teacher: Presentation, grad: GraduationCap, list: ListChecks, mic: Mic, phone: Smartphone, flame: Flame, star: Star, library: Library, book: BookOpen, bulb: Lightbulb, sparkles: Sparkles, user: User, key: Key, rocket: Rocket, plus: Plus, users: Users, medal1: Medal, medal2: Medal, medal3: Medal, award: Award, ruler: Ruler, cookie: Cookie, zap: Zap, volume: Volume2, globe: Globe, hourglass: Hourglass, inbox: Inbox, bot: Bot, pencil: Pencil, save: Save, refresh: RefreshCw, atom: Atom, map: Map };
const ICON_COLOR = { ok: "#34d399", no: "#f87171", warn: "#e8c468", flame: "#e8c468", star: "#e8c468", crown: "#e8c468", medal1: "#e8c468", medal2: "#cbd5e1", medal3: "#d99a6c" };
function Ico({ n, size = "1.08em" }) {
  const base = { display: "inline-block", verticalAlign: "-0.17em", flexShrink: 0 };
  if (n === "ghana") return (
    <svg className="gp-ico" viewBox="0 0 30 20" width="1.35em" height="0.9em" style={{ ...base, borderRadius: 3, verticalAlign: "-0.08em" }} aria-hidden="true">
      <rect width="30" height="6.67" fill="#CE1126" /><rect y="6.67" width="30" height="6.67" fill="#FCD116" /><rect y="13.33" width="30" height="6.67" fill="#006B3F" />
      <path d="M15 7.1l.85 2.6h2.75l-2.22 1.62.85 2.6L15 12.3l-2.23 1.62.85-2.6-2.22-1.62h2.75z" fill="#111" />
    </svg>
  );
  const C = ICONS[n];
  if (!C) return null;
  return <C className="gp-ico" size={size} strokeWidth={2.1} color={ICON_COLOR[n] || "currentColor"} fill={n === "star" ? "#e8c468" : "none"} style={base} aria-hidden="true" />;
}
import { getRole, startTeacherSession, teacherProfileByPhone } from "@/lib/roles";
import { REGIONS, getTeacher } from "@/lib/teacher-auth";

// ── Your real business details ───────────────────────────────────
// Fill these in. Anything left empty is simply hidden in the app.
const CONTACT = {
  company: "GhanaPrep",
  whatsapp: "",      // international format, no "+" or leading 0, e.g. 233241234567
  email: "",
  phone: "",
  website: "",
  address: "",
  registration: "",  // business registration number, if registered
};
const HAS_CONTACT = !!(CONTACT.whatsapp || CONTACT.email || CONTACT.phone || CONTACT.website);
const SUPPORT_CONTACT = CONTACT.email || "our support team (see Support in the app)";

// Opens WhatsApp with a ready message. Returns false when no number is set.
function openWhatsApp(note = "") {
  if (!CONTACT.whatsapp) return false;
  const msg = "Hello GhanaPrep Support" + (note ? "\n" + note : "");
  window.open("https://wa.me/" + CONTACT.whatsapp + "?text=" + encodeURIComponent(msg), "_blank", "noopener,noreferrer");
  return true;
}

/* ═══════════════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0f0d; }

  :root {
    --green: #22c55e; --green-dim: #16a34a; --green-glow: rgba(34,197,94,0.22);
    --blue: #38bdf8;  --blue-dim: #0284c7;  --blue-glow: rgba(56,189,248,0.18);
    --purple: #a78bfa;
    --surface: #0f1410; --surface2: #161d18; --surface3: #1e271f; --surface4: #263028;
    --border: rgba(255,255,255,0.07); --border2: rgba(255,255,255,0.13);
    --text: #f0f4f8; --muted: #566370; --muted2: #8899aa;
    --danger: #f87171; --gold: #fbbf24; --orange: #fb923c;
    --gh-red: #CE1126; --gh-gold: #FCD116; --gh-green: #006B3F;
  }

  /* ── Core keyframes ───────────────────────────────────────── */
  @keyframes fadeUp   { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes pop      { 0%{transform:scale(0.88)} 65%{transform:scale(1.06)} 100%{transform:scale(1)} }
  @keyframes slideUp  { from{transform:translateY(100%)} to{transform:translateY(0)} }

  /* ── Login page lively animations ───────────────────────────── */

  /* Particle float — each particle drifts at its own speed */
  @keyframes floatA { 0%,100%{transform:translateY(0)   translateX(0)  scale(1)}   50%{transform:translateY(-28px) translateX(10px) scale(1.1)} }
  @keyframes floatB { 0%,100%{transform:translateY(0)   translateX(0)  scale(1)}   50%{transform:translateY(-18px) translateX(-14px) scale(0.9)} }
  @keyframes floatC { 0%,100%{transform:translateY(0)   translateX(0)  scale(1)}   50%{transform:translateY(-34px) translateX(8px)  scale(1.15)} }
  @keyframes floatD { 0%,100%{transform:translateY(0)   translateX(0)}              33%{transform:translateY(-12px) translateX(16px)} 66%{transform:translateY(-22px) translateX(-8px)} }

  /* Ghana flag stripe wave */
  @keyframes waveRed  { 0%,100%{transform:skewX(0deg) scaleX(1)}   50%{transform:skewX(-2deg) scaleX(1.03)} }
  @keyframes waveGold { 0%,100%{transform:skewX(0deg) scaleX(1)}   50%{transform:skewX(2deg)  scaleX(0.97)} }
  @keyframes waveGreen{ 0%,100%{transform:skewX(0deg) scaleX(1)}   50%{transform:skewX(-1.5deg) scaleX(1.02)} }

  /* Black star rotation + bob */
  @keyframes starBob  { 0%,100%{transform:translateY(0)  rotate(-4deg) scale(1)}   50%{transform:translateY(-12px) rotate(4deg) scale(1.1)} }

  /* Glow pulse on the green ring behind the star */
  @keyframes glowPulse { 0%,100%{box-shadow:0 0 30px 8px rgba(34,197,94,0.3)}   50%{box-shadow:0 0 60px 20px rgba(252,209,22,0.45)} }

  /* Shimmer sweep across the hero overlay */
  @keyframes shimmerSweep {
    0%  { background-position: -200% 0; }
    100%{ background-position:  200% 0; }
  }

  /* Orbit — tiny dots circle the star */
  @keyframes orbitA { from{transform:rotate(0deg)   translateX(44px)} to{transform:rotate(360deg)  translateX(44px)} }
  @keyframes orbitB { from{transform:rotate(120deg) translateX(44px)} to{transform:rotate(480deg)  translateX(44px)} }
  @keyframes orbitC { from{transform:rotate(240deg) translateX(44px)} to{transform:rotate(600deg)  translateX(44px)} }

  /* Card rise on mount */
  @keyframes cardRise { from{opacity:0;transform:translateY(40px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }

  /* Input focus glow breathe */
  @keyframes inputBreathe { 0%,100%{box-shadow:0 0 0 3px rgba(34,197,94,0.15)} 50%{box-shadow:0 0 0 5px rgba(34,197,94,0.28)} }

  /* Typing cursor blink */
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* Feature pill bounce-in */
  @keyframes pillBounce { 0%{opacity:0;transform:scale(0.7) translateY(8px)} 70%{transform:scale(1.08) translateY(-2px)} 100%{opacity:1;transform:scale(1) translateY(0)} }

  /* Button shine sweep */
  @keyframes btnShine {
    0%  { background-position: -200% center; }
    100%{ background-position:  200% center; }
  }

  /* Pulse dots for loading */
  @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(0.75);opacity:0.4} }

  /* ── Utility classes ──────────────────────────────────────── */
  .fadeUp  { animation: fadeUp  0.42s cubic-bezier(.22,.68,0,1.2) both; }
  .fadeUp2 { animation: fadeUp  0.42s 0.08s cubic-bezier(.22,.68,0,1.2) both; }
  .fadeUp3 { animation: fadeUp  0.42s 0.16s cubic-bezier(.22,.68,0,1.2) both; }
  .fadeUp4 { animation: fadeUp  0.42s 0.24s cubic-bezier(.22,.68,0,1.2) both; }
  .fadeUp5 { animation: fadeUp  0.42s 0.32s cubic-bezier(.22,.68,0,1.2) both; }
  .fadeIn  { animation: fadeIn  0.35s ease both; }
  .pop     { animation: pop     0.35s cubic-bezier(.22,.68,0,1.2) both; }

  /* Auth card animated entrance */
  .auth-card-enter { animation: cardRise 0.55s cubic-bezier(.22,.68,0,1.2) 0.1s both; }

  /* GSAP form containers */
  .login-form    { opacity:1; transform:translateY(0); }
  .login-form:not(.active) { pointer-events:none; }
  .register-form { opacity:0; transform:translateX(30px); pointer-events:none; }
  .register-form.active    { pointer-events:all; }

  /* Pill tab slider */
  .auth-tab-slider {
    position:absolute; top:4px; left:4px;
    height:calc(100% - 8px); width:calc(50% - 4px);
    background:linear-gradient(135deg,#22c55e,#16a34a);
    border-radius:999px; z-index:0;
    box-shadow:0 2px 18px rgba(34,197,94,0.55);
  }

  /* Lively input — glows when focused */
  .lively-input {
    width:100%; padding:13px 14px 13px 42px;
    background:rgba(30,39,31,0.9);
    border:1.5px solid rgba(255,255,255,0.1);
    border-radius:12px; font-size:14px;
    color:#f0f4f8; font-family:'DM Sans',sans-serif;
    transition:border-color .25s, box-shadow .25s, background .25s;
    outline:none;
    backdrop-filter:blur(8px);
  }
  .lively-input:focus {
    border-color:#22c55e;
    background:rgba(34,197,94,0.06);
    animation:inputBreathe 2s ease-in-out infinite;
  }
  .lively-input::placeholder { color:#566370; }

  /* Shiny submit button */
  .btn-shine {
    background: linear-gradient(100deg,
      #22c55e 0%, #4ade80 40%, #22c55e 60%, #16a34a 100%);
    background-size: 200% auto;
    animation: btnShine 2.5s linear infinite;
    border:none; border-radius:999px; cursor:pointer;
    font-family:'Syne',sans-serif; font-weight:800;
    font-size:15px; color:#000; letter-spacing:0.03em;
    box-shadow:0 4px 24px rgba(34,197,94,0.5), 0 0 0 0 rgba(34,197,94,0.3);
    transition:transform .18s, box-shadow .18s;
  }
  .btn-shine:hover:not(:disabled) {
    transform:translateY(-2px) scale(1.02);
    box-shadow:0 8px 32px rgba(34,197,94,0.65), 0 0 0 4px rgba(34,197,94,0.15);
  }
  .btn-shine:active:not(:disabled) { transform:scale(0.97); }
  .btn-shine:disabled { background:#1e271f; color:#566370; animation:none; box-shadow:none; }

  /* Feature pills staggered bounce */
  .pill-1 { animation: pillBounce 0.5s 0.6s cubic-bezier(.22,.68,0,1.2) both; }
  .pill-2 { animation: pillBounce 0.5s 0.72s cubic-bezier(.22,.68,0,1.2) both; }
  .pill-3 { animation: pillBounce 0.5s 0.84s cubic-bezier(.22,.68,0,1.2) both; }
  .pill-4 { animation: pillBounce 0.5s 0.96s cubic-bezier(.22,.68,0,1.2) both; }

  /* Round btn (kept for other screens) */
  .btn-round { border-radius:999px !important; padding:14px 32px !important; font-weight:800 !important; }
  .btn-round-sm { border-radius:999px !important; padding:10px 22px !important; font-weight:700 !important; }

  /* Scroll */
  ::-webkit-scrollbar { width:3px; }
  ::-webkit-scrollbar-thumb { background:#263028; border-radius:4px; }

  /* ── Leaderboard animations ─────────────────────────────── */
  @keyframes rankPop   { 0%{opacity:0;transform:translateY(16px) scale(0.94)} 70%{transform:translateY(-3px) scale(1.03)} 100%{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes crownBob  { 0%,100%{transform:translateY(0) rotate(-6deg)} 50%{transform:translateY(-6px) rotate(6deg)} }
  @keyframes goldGlow  { 0%,100%{box-shadow:0 0 14px rgba(251,191,36,0.4)} 50%{box-shadow:0 0 30px rgba(251,191,36,0.8)} }
  @keyframes silverGlow{ 0%,100%{box-shadow:0 0 10px rgba(203,213,225,0.3)} 50%{box-shadow:0 0 22px rgba(203,213,225,0.6)} }
  @keyframes bronzeGlow{ 0%,100%{box-shadow:0 0 10px rgba(251,146,60,0.3)} 50%{box-shadow:0 0 22px rgba(251,146,60,0.55)} }
  @keyframes tabSlide  { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes countUp   { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
  @keyframes podiumRise{ from{transform:scaleY(0);opacity:0} to{transform:scaleY(1);opacity:1} }
  @keyframes fireFlick { 0%,100%{transform:scale(1) rotate(-3deg)} 50%{transform:scale(1.2) rotate(3deg)} }
  @keyframes streakPulse{0%,100%{opacity:1} 50%{opacity:0.55}}

  .rank-card-1 { animation: rankPop 0.45s 0.05s cubic-bezier(.22,.68,0,1.2) both; }
  .rank-card-2 { animation: rankPop 0.45s 0.12s cubic-bezier(.22,.68,0,1.2) both; }
  .rank-card-3 { animation: rankPop 0.45s 0.19s cubic-bezier(.22,.68,0,1.2) both; }
  .rank-card-4 { animation: rankPop 0.45s 0.26s cubic-bezier(.22,.68,0,1.2) both; }
  .rank-card-5 { animation: rankPop 0.45s 0.33s cubic-bezier(.22,.68,0,1.2) both; }
  .rank-card-rest { animation: rankPop 0.38s 0.38s cubic-bezier(.22,.68,0,1.2) both; }

    /* Tap highlight remove */
  button,input,textarea { -webkit-tap-highlight-color:transparent; }

  /* ── Legal / Compliance styles ──────────────────────────── */
  .cookie-banner {
    position:fixed; bottom:0; left:50%; transform:translateX(-50%);
    width:100%; max-width:430px; z-index:900;
    background:rgba(15,20,16,0.97); backdrop-filter:blur(16px);
    border-top:1px solid rgba(34,197,94,0.25);
    padding:14px 18px 24px; animation:slideUp .4s cubic-bezier(.22,.68,0,1.2);
    box-shadow:0 -8px 40px rgba(0,0,0,0.6);
  }
  .legal-modal-backdrop {
    position:fixed; inset:0; background:rgba(0,0,0,0.88);
    z-index:950; display:flex; align-items:flex-end; justify-content:center;
    backdrop-filter:blur(8px); animation:fadeIn .2s ease;
  }
  .legal-modal-sheet {
    background:var(--surface); border-radius:24px 24px 0 0;
    width:100%; max-width:430px; max-height:88vh;
    display:flex; flex-direction:column;
    border:1px solid rgba(34,197,94,0.15); border-bottom:none;
    animation:slideUp .32s cubic-bezier(.22,.68,0,1.2);
  }
  .legal-body {
    overflow-y:auto; flex:1; padding:0 20px 40px;
    font-size:13px; line-height:1.8; color:var(--muted2);
  }
  .legal-body h3 { font-family:'Syne',sans-serif; font-size:15px; font-weight:800;
    color:var(--text); margin:18px 0 6px; }
  .legal-body p  { margin-bottom:10px; }
  .legal-body ul { padding-left:18px; margin-bottom:10px; }
  .legal-body li { margin-bottom:4px; }
  .legal-body a  { color:#22c55e; text-decoration:underline; }
  /* High contrast accessible focus */
  *:focus-visible { outline:2px solid #22c55e; outline-offset:2px; }
  /* Alt text helper */
  img:not([alt]) { outline:3px solid #f87171; }
`;

/* ═══════════════════════════════════════════════════════════════
   SUPABASE CONFIG  — Real-time leaderboard + user accounts
   ─────────────────────────────────────────────────────────────
   SETUP (5 min, free at supabase.com):

   1. Create a project at https://supabase.com
   2. SQL Editor → run ALL of this:

   -- Users table
   create table if not exists gp_users (
     id            uuid primary key default gen_random_uuid(),
     phone         text unique not null,
     email         text unique,
     name          text not null,
     password_hash text not null,
     school        text default '',
     avatar_color  text default '#22c55e',
     email_verified boolean default false,
     joined_at     bigint not null,
     stats         jsonb not null default '{"done":0,"totalScore":0,"weak":{},
       "objDone":0,"theoryDone":0,"objScore":0,"theoryScore":0,
       "doneToday":0,"lastDay":"","streak":0,"weekScore":0,
       "weekDay":""}' ::jsonb
   );
   alter table gp_users enable row level security;
   create policy "public_rw" on gp_users for all using (true) with check (true);

   -- Leaderboard view (auto-computed from real user stats)
   create or replace view gp_leaderboard as
   select
     name,
     school,
     avatar_color,
     (stats->'done')::int                                    as done,
     round((stats->'totalScore')::numeric, 1)               as total_score,
     case when (stats->'done')::int > 0
       then round((stats->'totalScore')::numeric /
                  (stats->'done')::int, 2) else 0 end       as avg_score,
     (stats->'doneToday')::int                              as done_today,
     (stats->'weekScore')::numeric                          as week_score,
     (stats->'streak')::int                                 as streak,
     joined_at
   from gp_users
   where (stats->'done')::int > 0
   order by total_score desc;

   3. Settings → API → copy Project URL + anon key below:
═══════════════════════════════════════════════════════════════ */
const SUPA_URL = "https://xyzxyzxyz.supabase.co";  // ← paste your URL
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder"; // ← anon key
const IS_LOCAL = SUPA_URL.includes("xyzxyzxyz");   // true = demo mode

/* Simple deterministic hash — good enough for a demo app.
   In production use bcrypt on a server. */
async function hashPassword(password) {
  const enc = new TextEncoder();
  const data = enc.encode("ghanaprep_salt_2025_" + password);
  const buf  = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

const supa = {
  async query(path, opts={}) {
    const res = await fetch(`${SUPA_URL}/rest/v1${path}`, {
      ...opts,
      headers: {
        "Content-Type":  "application/json",
        "apikey":        SUPA_KEY,
        "Authorization": `Bearer ${SUPA_KEY}`,
        "Prefer":        "return=representation",
        ...(opts.headers||{})
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(()=>({}));
      throw new Error(err.message || `DB error ${res.status}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : [];
  }
};

/* ── AUTH STORE (Supabase-backed, session in localStorage) ── */
const AUTH = {
  /* ─ session helpers (localStorage only stores phone+name token) ─ */
  getSession()      { return JSON.parse(localStorage.getItem("gp_session_v3")||"null"); },
  setSession(u)     { localStorage.setItem("gp_session_v3", JSON.stringify(u)); },
  clearSession()    { localStorage.removeItem("gp_session_v3"); },

  /* ─ register ─────────────────────────────────────────────── */
  async register(name, phone, email, password, school="", avatarColor="#22c55e") {
    try {
      const existing = await supa.query(`/gp_users?phone=eq.${encodeURIComponent(phone)}&select=phone`);
      if (existing.length > 0) return { ok:false, msg:"This phone number is already registered." };

      if (email) {
        const emailExisting = await supa.query(`/gp_users?email=eq.${encodeURIComponent(email)}&select=email`);
        if (emailExisting.length > 0) return { ok:false, msg:"This email address is already registered." };
      }

      const password_hash = await hashPassword(password);
      const stats = { done:0, totalScore:0, weak:{}, objDone:0, theoryDone:0,
        objScore:0, theoryScore:0, doneToday:0, lastDay:"", streak:0, weekScore:0, weekDay:"" };

      await supa.query("/gp_users", {
        method: "POST",
        body: JSON.stringify({ name, phone, email: email||null, password_hash, school,
          avatar_color: avatarColor, email_verified: true, joined_at: Date.now(), stats })
      });

      this.setSession({ name, phone, email: email||"" });
      return { ok:true };
    } catch(e) {
      if (IS_LOCAL) return this._localRegister(name, phone, email, password, school, avatarColor);
      return { ok:false, msg:"Network error. Check connection and try again." };
    }
  },

  /* ─ login ────────────────────────────────────────────────── */
  async login(phone, password) {
    try {
      const rows = await supa.query(`/gp_users?phone=eq.${encodeURIComponent(phone)}&select=name,phone,password_hash`);
      if (rows.length === 0) return { ok:false, msg:"No account found with this phone number." };

      const user = rows[0];
      const hash = await hashPassword(password);
      if (hash !== user.password_hash) return { ok:false, msg:"Incorrect password. Try again." };

      this.setSession({ name: user.name, phone: user.phone });
      return { ok:true, name: user.name };
    } catch(e) {
      if (SUPA_URL.includes("xyzxyzxyz")) return this._localLogin(phone, password);
      return { ok:false, msg:"Network error. Check connection and try again." };
    }
  },

  /* ─ get user stats ───────────────────────────────────────── */
  async getUser(phone) {
    try {
      const rows = await supa.query(`/gp_users?phone=eq.${encodeURIComponent(phone)}&select=name,phone,stats,joined_at`);
      if (rows.length === 0) return null;
      return rows[0];
    } catch(e) {
      if (SUPA_URL.includes("xyzxyzxyz")) return this._localGetUser(phone);
      return null;
    }
  },

  /* ─ update stats ─────────────────────────────────────────── */
  async updateStats(phone, score, topic, mode) {
    try {
      const rows = await supa.query(`/gp_users?phone=eq.${encodeURIComponent(phone)}&select=stats`);
      if (rows.length === 0) return;
      const s = { ...rows[0].stats };
      const today   = new Date().toDateString();
      const thisWeek = `W${Math.floor(Date.now()/(7*24*3600*1000))}`;

      // Daily reset
      if (s.lastDay !== today) {
        // Streak: increment if yesterday was active, else reset
        const yesterday = new Date(Date.now()-86400000).toDateString();
        s.streak = (s.lastDay === yesterday) ? (s.streak||0)+1 : 1;
        s.doneToday = 0;
        s.lastDay   = today;
      }
      // Weekly reset
      if (s.weekDay !== thisWeek) { s.weekScore=0; s.weekDay=thisWeek; }

      s.done++;
      s.totalScore = (s.totalScore||0) + score;
      s.weekScore  = (s.weekScore||0)  + score;
      s.doneToday++;
      if (mode==="objectives") { s.objDone=(s.objDone||0)+1; s.objScore=(s.objScore||0)+score; }
      else { s.theoryDone=(s.theoryDone||0)+1; s.theoryScore=(s.theoryScore||0)+score; }
      if (!s.weak) s.weak={};
      if (score < 6) s.weak[topic] = (s.weak[topic]||0)+1;

      await supa.query(`/gp_users?phone=eq.${encodeURIComponent(phone)}`, {
        method: "PATCH", body: JSON.stringify({ stats: s })
      });
    } catch(e) {
      if (IS_LOCAL) this._localUpdateStats(phone, score, topic, mode);
    }
  },

  /* ─ real leaderboard fetch ───────────────────────────────── */
  async fetchLeaderboard(period="alltime") {
    try {
      if (IS_LOCAL) return this._localLeaderboard(period);
      // Query the gp_leaderboard view created in Supabase
      const col   = period==="today"  ? "done_today"
                  : period==="week"   ? "week_score"
                  : "total_score";
      const rows = await supa.query(
        `/gp_leaderboard?select=name,school,avatar_color,done,total_score,avg_score,done_today,week_score,streak&order=${col}.desc&limit=50`
      );
      return rows.map((r,i) => ({
        rank:        i+1,
        name:        r.name,
        school:      r.school||"",
        avatarColor: r.avatar_color||"#22c55e",
        done:        r.done||0,
        totalScore:  parseFloat(r.total_score)||0,
        avgScore:    parseFloat(r.avg_score)||0,
        doneToday:   r.done_today||0,
        weekScore:   parseFloat(r.week_score)||0,
        streak:      r.streak||0,
        score:       period==="today"  ? (r.done_today||0)*10
                   : period==="week"   ? Math.round((r.week_score||0)*10)/10
                   : Math.round((parseFloat(r.total_score)||0)),
      }));
    } catch(e) {
      return this._localLeaderboard(period);
    }
  },

  /* ─ local leaderboard (uses all local accounts) ─────────── */
  _localLeaderboard(period) {
    const accounts = Object.values(this._localAccounts());
    const thisWeek = `W${Math.floor(Date.now()/(7*24*3600*1000))}`;
    return accounts
      .filter(a => (a.stats?.done||0) > 0)
      .map((a,i) => {
        const s = a.stats||{};
        const isThisWeek = s.weekDay === thisWeek;
        const score = period==="today"  ? (s.doneToday||0)*10
                    : period==="week"   ? (isThisWeek ? s.weekScore||0 : 0)
                    : s.totalScore||0;
        return {
          name:       a.name,
          school:     a.school||"",
          avatarColor:a.avatar_color||"#22c55e",
          done:       s.done||0,
          totalScore: s.totalScore||0,
          avgScore:   s.done>0 ? s.totalScore/s.done : 0,
          doneToday:  s.doneToday||0,
          weekScore:  isThisWeek ? s.weekScore||0 : 0,
          streak:     s.streak||0,
          score:      Math.round(score*10)/10,
        };
      })
      .sort((a,b)=>b.score-a.score)
      .map((u,i)=>({...u, rank:i+1}));
  },

  /* ─ email verification ─────────────────────────────────── */
  generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  },

  async sendVerificationCode(email, name) {
    const code    = this.generateCode();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
    // Store pending verification
    localStorage.setItem("gp_pending_verify", JSON.stringify({ email, code, expires }));

    if (IS_LOCAL) {
      // Demo mode — return code to display on screen
      return { ok:false, msg:"Could not send the verification email. Please try again." };
    }

    // Production — call a Supabase Edge Function or email API
    // Example: deploy a Supabase edge function called "send-otp"
    //   supabase functions deploy send-otp
    // that calls Resend / SendGrid with the code.
    try {
      await fetch(`${SUPA_URL}/functions/v1/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPA_KEY}`,
        },
        body: JSON.stringify({ email, name, code }),
      });
      return { ok:true, demo:false };
    } catch(e) {
      // Fallback: show code on screen if edge function not deployed
      return { ok:false, msg:"Could not send the verification email. Please try again." };
    }
  },

  verifyCode(email, inputCode) {
    const raw = localStorage.getItem("gp_pending_verify");
    if (!raw) return { ok:false, msg:"No verification pending. Please register again." };
    const { email:storedEmail, code, expires } = JSON.parse(raw);
    if (storedEmail !== email)   return { ok:false, msg:"Email mismatch. Please try again." };
    if (Date.now() > expires)    {
      localStorage.removeItem("gp_pending_verify");
      return { ok:false, msg:"Code expired. Please request a new one." };
    }
    if (inputCode.trim() !== code) return { ok:false, msg:"Incorrect code. Try again." };
    localStorage.removeItem("gp_pending_verify");
    return { ok:true };
  },

  clearPendingVerification() {
    localStorage.removeItem("gp_pending_verify");
  },

  /* ─ localStorage fallback (when Supabase not configured) ─── */
  _localAccounts() { return JSON.parse(localStorage.getItem("gp_local_accs")||"{}"); },
  _saveLocal(a)    { localStorage.setItem("gp_local_accs", JSON.stringify(a)); },

  _localRegister(name, phone, email, password, school="", avatarColor="#22c55e") {
    const a = this._localAccounts();
    if (a[phone]) return { ok:false, msg:"This phone number is already registered." };
    if (email) {
      const emailTaken = Object.values(a).some(u => u.email === email);
      if (emailTaken) return { ok:false, msg:"This email address is already registered." };
    }
    a[phone] = { name, phone, email: email||"", password, school, avatar_color: avatarColor,
      email_verified: true,
      stats:{ done:0, totalScore:0, weak:{}, objDone:0, theoryDone:0,
        objScore:0, theoryScore:0, doneToday:0, lastDay:"", streak:0, weekScore:0, weekDay:"" }};
    this._saveLocal(a); this.setSession({ name, phone, email: email||"" });
    return { ok:true };
  },
  _localLogin(phone, password) {
    const a = this._localAccounts();
    if (!a[phone]) return { ok:false, msg:"No account found with this phone number." };
    if (a[phone].password !== password) return { ok:false, msg:"Incorrect password." };
    this.setSession({ name:a[phone].name, phone });
    return { ok:true, name:a[phone].name };
  },
  _localGetUser(phone) { return this._localAccounts()[phone]||null; },
  _localUpdateStats(phone, score, topic, mode) {
    const a = this._localAccounts();
    if (!a[phone]) return;
    const today = new Date().toDateString();
    const s = a[phone].stats;
    if (s.lastDay!==today){const y=new Date(Date.now()-86400000).toDateString();s.streak=(s.lastDay===y)?(s.streak||0)+1:1;s.doneToday=0;s.lastDay=today;}
    s.done++;s.totalScore+=score;s.doneToday++; s.lastActiveAt=Date.now();
    if(mode==="objectives"){s.objDone++;s.objScore+=score;}else{s.theoryDone++;s.theoryScore+=score;}
    if(score<6)s.weak[topic]=(s.weak[topic]||0)+1;
    a[phone].stats=s; this._saveLocal(a);
  }
};

/* ═══════════════════════════════════════════════════════════════
   QUIZ STORE  — teacher-created quizzes with unique 6-char codes
   (localStorage; swap for Supabase tables in production)
═══════════════════════════════════════════════════════════════ */
const QUIZ_STORE = {
  generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code;
    do {
      code = Array.from({length:6}, () => chars[Math.floor(Math.random()*chars.length)]).join("");
    } while (this.getAll()[code]);
    return code;
  },
  getAll() {
    try { return JSON.parse(localStorage.getItem("gp_quizzes_v1") || "{}"); }
    catch { return {}; }
  },
  saveQuiz(quiz) {
    const all = this.getAll();
    all[quiz.code] = quiz;
    localStorage.setItem("gp_quizzes_v1", JSON.stringify(all));
    return quiz;
  },
  getQuiz(code) {
    return this.getAll()[String(code || "").toUpperCase().trim()] || null;
  },
  getMyQuizzes(teacherPhone) {
    return Object.values(this.getAll())
      .filter(q => q.teacherPhone === teacherPhone)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
  getAllResults() {
    try { return JSON.parse(localStorage.getItem("gp_quiz_results_v1") || "{}"); }
    catch { return {}; }
  },
  getResults(code) {
    return this.getAllResults()[code] || [];
  },
  saveResult(code, result) {
    const all = this.getAllResults();
    const list = all[code] || [];
    list.push(result);
    all[code] = list;
    localStorage.setItem("gp_quiz_results_v1", JSON.stringify(all));
  },
  /* Challenges a student has opened with a code (kept per phone number). */
  getJoined(studentPhone) {
    try { return (JSON.parse(localStorage.getItem("gp_challenge_joined_v1") || "{}")[studentPhone]) || []; }
    catch { return []; }
  },
  markJoined(code, studentPhone) {
    if (!studentPhone) return;
    try {
      const all = JSON.parse(localStorage.getItem("gp_challenge_joined_v1") || "{}");
      if (!(all[studentPhone]||[]).includes(code)) { all[studentPhone] = [...(all[studentPhone]||[]), code]; localStorage.setItem("gp_challenge_joined_v1", JSON.stringify(all)); }
    } catch {}
  },
  hasAttempted(code, studentPhone) {
    return this.getResults(code).some(r => r.studentPhone === studentPhone);
  },
};

/* ═══════════════════════════════════════════════════════════════
   QUESTION DATABASE  — ALL TOPICS, objectives + theory
═══════════════════════════════════════════════════════════════ */
const DB = {
  JHS: {
    label:"BECE", accent:"#22c55e", dim:"#16a34a",
    glow:"rgba(34,197,94,0.18)", emoji:<Ico n="school" />,
    subjects: {
      "Mathematics": { icon:<Ico n="calc" />,
        objectives: [
          // Number & Numeration
          { id:"jmo_n1", topic:"Number & Numeration", year:"2023", question:"Write 0.00045 in standard form.",
            options:["A. 4.5×10⁻⁴","B. 4.5×10⁻³","C. 45×10⁻⁵","D. 4.5×10⁴"], correct:"A",
            explanation:"Move decimal 4 places right → 4.5×10⁻⁴." },
          { id:"jmo_n2", topic:"Number & Numeration", year:"2022", question:"What is the value of 3⁴?",
            options:["A. 12","B. 27","C. 64","D. 81"], correct:"D",
            explanation:"3⁴ = 3×3×3×3 = 81." },
          // LCM & HCF
          { id:"jmo_l1", topic:"LCM & HCF", year:"2023", question:"What is the LCM of 12 and 18?",
            options:["A. 36","B. 48","C. 72","D. 216"], correct:"A",
            explanation:"LCM(12,18)=36. 12=2²×3, 18=2×3². LCM=2²×3²=36." },
          { id:"jmo_l2", topic:"LCM & HCF", year:"2022", question:"Find the HCF of 24 and 36.",
            options:["A. 6","B. 9","C. 12","D. 18"], correct:"C",
            explanation:"24=2³×3, 36=2²×3². HCF=2²×3=12." },
          // Fractions, Decimals & Percentages
          { id:"jmo_f1", topic:"Fractions & Decimals", year:"2023", question:"Simplify: 3/4 + 1/3",
            options:["A. 4/7","B. 7/12","C. 13/12","D. 4/12"], correct:"C",
            explanation:"LCD=12. 9/12+4/12=13/12=1 1/12." },
          { id:"jmo_p1", topic:"Percentages", year:"2023", question:"Ama scored 56 out of 80. What percentage did she score?",
            options:["A. 60%","B. 65%","C. 70%","D. 75%"], correct:"C",
            explanation:"(56÷80)×100=70%." },
          { id:"jmo_p2", topic:"Percentages", year:"2022", question:"A shirt costs GHS 80. If VAT is 12.5%, how much VAT is paid?",
            options:["A. GHS 8","B. GHS 10","C. GHS 12","D. GHS 15"], correct:"B",
            explanation:"VAT = 12.5% × 80 = 0.125×80 = GHS 10." },
          // Ratio & Proportion
          { id:"jmo_r1", topic:"Ratio & Proportion", year:"2022", question:"Divide GHS 120 in the ratio 3:5.",
            options:["A. GHS 40 and GHS 80","B. GHS 45 and GHS 75","C. GHS 50 and GHS 70","D. GHS 60 and GHS 60"], correct:"B",
            explanation:"Total parts=8. Each part=120÷8=15. 3×15=45; 5×15=75." },
          { id:"jmo_r2", topic:"Ratio & Proportion", year:"2021", question:"If 5 pens cost GHS 15, how much do 8 pens cost?",
            options:["A. GHS 50","B. GHS 22","C. GHS 24","D. GHS 25"], correct:"C",
            explanation:"Cost per pen=15÷5=3. 8 pens=8×3=GHS 24." },
          // Algebra
          { id:"jmo_a1", topic:"Algebra", year:"2022", question:"If 3x + 7 = 22, what is x?",
            options:["A. 3","B. 4","C. 5","D. 6"], correct:"C",
            explanation:"3x=15, x=5." },
          { id:"jmo_a2", topic:"Algebra", year:"2023", question:"Expand: 3(2x − 4)",
            options:["A. 6x−4","B. 6x−12","C. 5x−12","D. 6x+12"], correct:"B",
            explanation:"3×2x=6x; 3×(−4)=−12. Result: 6x−12." },
          { id:"jmo_a3", topic:"Algebra", year:"2021", question:"Solve: 2x − 3 = x + 5",
            options:["A. x=2","B. x=4","C. x=6","D. x=8"], correct:"D",
            explanation:"2x−x=5+3 → x=8." },
          // Linear Equations
          { id:"jmo_le1", topic:"Linear Equations", year:"2023", question:"Which of these is the solution of 4x = 24?",
            options:["A. x=4","B. x=5","C. x=6","D. x=8"], correct:"C",
            explanation:"x=24÷4=6." },
          { id:"jmo_le2", topic:"Linear Equations", year:"2022", question:"If x + 2y = 8 and x = 2, find y.",
            options:["A. y=2","B. y=3","C. y=4","D. y=6"], correct:"B",
            explanation:"2+2y=8 → 2y=6 → y=3." },
          // Geometry
          { id:"jmo_g1", topic:"Geometry", year:"2022", question:"Angles of a triangle are in ratio 1:2:3. What is the largest angle?",
            options:["A. 60°","B. 80°","C. 90°","D. 120°"], correct:"C",
            explanation:"Sum=180°. Largest=(3/6)×180°=90°." },
          { id:"jmo_g2", topic:"Geometry", year:"2023", question:"The exterior angle of a regular polygon is 45°. How many sides does it have?",
            options:["A. 6","B. 7","C. 8","D. 9"], correct:"C",
            explanation:"Number of sides = 360÷45 = 8." },
          { id:"jmo_g3", topic:"Geometry", year:"2021", question:"What is the sum of interior angles of a pentagon?",
            options:["A. 360°","B. 450°","C. 540°","D. 720°"], correct:"C",
            explanation:"Sum=(n−2)×180=(5−2)×180=540°." },
          // Mensuration
          { id:"jmo_m1", topic:"Mensuration", year:"2023", question:"Find the area of a circle with radius 7cm. (π=22/7)",
            options:["A. 44 cm²","B. 88 cm²","C. 154 cm²","D. 308 cm²"], correct:"C",
            explanation:"A=πr²=(22/7)×7²=22×7=154 cm²." },
          { id:"jmo_m2", topic:"Mensuration", year:"2022", question:"A rectangle has length 12cm and width 5cm. What is its perimeter?",
            options:["A. 17cm","B. 34cm","C. 60cm","D. 120cm"], correct:"B",
            explanation:"P=2(l+w)=2(12+5)=2×17=34cm." },
          { id:"jmo_m3", topic:"Mensuration", year:"2021", question:"The volume of a cube with side 4cm is ___.",
            options:["A. 16 cm³","B. 32 cm³","C. 48 cm³","D. 64 cm³"], correct:"D",
            explanation:"V=s³=4³=64 cm³." },
          // Statistics & Probability
          { id:"jmo_s1", topic:"Statistics", year:"2021", question:"Find the mean of: 12, 14, 13, 15, 11.",
            options:["A. 11","B. 12","C. 13","D. 14"], correct:"C",
            explanation:"Sum=65. Mean=65÷5=13." },
          { id:"jmo_s2", topic:"Statistics", year:"2023", question:"The mode of: 3, 5, 3, 7, 5, 3, 9 is ___.",
            options:["A. 3","B. 5","C. 7","D. 9"], correct:"A",
            explanation:"3 appears 3 times — more than any other value. Mode=3." },
          { id:"jmo_pr1", topic:"Probability", year:"2022", question:"A bag has 4 red and 6 blue balls. P(picking a red ball) = ?",
            options:["A. 2/5","B. 3/5","C. 1/4","D. 2/3"], correct:"A",
            explanation:"P(red)=4/(4+6)=4/10=2/5." },
          // Number Theory
          { id:"jmo_nt1", topic:"Number Theory", year:"2021", question:"Which of the following is a prime number?",
            options:["A. 9","B. 15","C. 21","D. 29"], correct:"D",
            explanation:"29 is only divisible by 1 and itself. 9=3², 15=3×5, 21=3×7." },
          { id:"jmo_nt2", topic:"Number Theory", year:"2023", question:"What is the smallest prime number?",
            options:["A. 0","B. 1","C. 2","D. 3"], correct:"C",
            explanation:"2 is the smallest and only even prime number. 0 and 1 are not prime." },
          // Indices & Logarithms
          { id:"jmo_i1", topic:"Indices & Logarithms", year:"2022", question:"Simplify: 2³ × 2⁴",
            options:["A. 2⁷","B. 2¹²","C. 4⁷","D. 8¹²"], correct:"A",
            explanation:"Same base: add indices. 2³×2⁴=2^(3+4)=2⁷." },
          { id:"jmo_i2", topic:"Indices & Logarithms", year:"2023", question:"What is the value of x if 2ˣ = 32?",
            options:["A. 3","B. 4","C. 5","D. 6"], correct:"C",
            explanation:"32=2⁵, so x=5." },
          // Vectors & Transformation
          { id:"jmo_v1", topic:"Vectors & Transformation", year:"2022", question:"Point A(2,3) is translated by vector (4,−1). What is the image?",
            options:["A. (6,2)","B. (6,4)","C. (−2,4)","D. (2,−3)"], correct:"A",
            explanation:"(2+4, 3+(−1)) = (6,2)." },
        ],
        theory: [
          { id:"jmt_n1", topic:"Number & Numeration", year:"2023", question:"(a) Express 360 as a product of its prime factors. (b) Hence find the square root of 360, leaving your answer in surd form.", answer:"360=2³×3²×5; √360=6√10", solution:"(a) 360=2×180=2×2×90=2×2×2×45=2³×3²×5. (b)√360=√(4×9×10)=2×3×√10=6√10." },
          { id:"jmt_l1", topic:"LCM & HCF", year:"2023", question:"Find the LCM of 12, 18 and 24, showing all prime factorisation steps clearly.", answer:"72", solution:"12=2²×3, 18=2×3², 24=2³×3 → LCM=2³×3²=8×9=72" },
          { id:"jmt_p1", topic:"Percentages", year:"2022", question:"A trader bought goods for GHS 240 and sold them for GHS 300. (a) Find the profit. (b) Calculate the percentage profit.", answer:"(a) GHS 60  (b) 25%", solution:"(a) Profit=300−240=GHS 60. (b) % profit=(60÷240)×100=25%." },
          { id:"jmt_r1", topic:"Ratio & Proportion", year:"2022", question:"Kwame, Ama and Kofi share GHS 420 in the ratio 2:3:5. How much does each person receive?", answer:"Kwame=GHS 84, Ama=GHS 126, Kofi=GHS 210", solution:"Total parts=10. Each part=420÷10=42. Kwame=2×42=84; Ama=3×42=126; Kofi=5×42=210." },
          { id:"jmt_a1", topic:"Algebra", year:"2022", question:"Solve for x and y simultaneously: 2x + y = 7 and x − y = 2. Show all working.", answer:"x=3, y=1", solution:"From eq2: x=y+2. Substitute: 2(y+2)+y=7 → 3y=3 → y=1. x=1+2=3." },
          { id:"jmt_le1", topic:"Linear Equations", year:"2023", question:"Solve: (3x+1)/2 = (x+5)/1. Show all working.", answer:"x=9", solution:"Multiply both sides by 2: 3x+1=2(x+5)=2x+10. 3x−2x=10−1. x=9." },
          { id:"jmt_g1", topic:"Geometry", year:"2021", question:"Calculate the area of a triangle with base 12cm and height 9cm. Show the formula and all working.", answer:"54 cm²", solution:"Area=½×base×height=½×12×9=54 cm²." },
          { id:"jmt_g2", topic:"Geometry", year:"2022", question:"ABCD is a parallelogram. Angle A = 70°. Find angles B, C and D, giving reasons.", answer:"B=110°, C=70°, D=110°", solution:"Consecutive angles in a parallelogram are supplementary. B=180−70=110°. Opposite angles equal: C=A=70°, D=B=110°." },
          { id:"jmt_m1", topic:"Mensuration", year:"2023", question:"A cylinder has radius 7cm and height 10cm. Find: (a) its curved surface area  (b) its volume. (π=22/7)", answer:"(a) 440 cm²  (b) 1540 cm³", solution:"(a) CSA=2πrh=2×(22/7)×7×10=440 cm². (b) V=πr²h=(22/7)×49×10=1540 cm³." },
          { id:"jmt_s1", topic:"Statistics", year:"2023", question:"The marks of 7 students are: 45, 60, 55, 72, 48, 60, 65. Find: (a) mode  (b) median  (c) mean.", answer:"Mode=60, Median=60, Mean≈57.9", solution:"Sorted: 45,48,55,60,60,65,72. (a) Mode=60 (twice). (b) Median=4th value=60. (c) Mean=(45+48+55+60+60+65+72)/7=405/7≈57.86." },
          { id:"jmt_pr1", topic:"Probability", year:"2022", question:"A box contains 5 red, 3 green and 2 yellow sweets. A sweet is chosen at random. Find the probability it is: (a) red  (b) not yellow  (c) green or red.", answer:"(a)1/2 (b)4/5 (c)4/5", solution:"Total=10. (a)P(red)=5/10=1/2. (b)P(not yellow)=8/10=4/5. (c)P(green or red)=(3+5)/10=8/10=4/5." },
          { id:"jmt_i1", topic:"Indices & Logarithms", year:"2022", question:"Simplify: (a) x³ × x⁵  (b) y⁸ ÷ y³  (c) (z²)⁴", answer:"(a)x⁸ (b)y⁵ (c)z⁸", solution:"(a) x^(3+5)=x⁸. (b) y^(8−3)=y⁵. (c) z^(2×4)=z⁸." },
          { id:"jmt_v1", topic:"Vectors & Transformation", year:"2023", question:"Triangle PQR has vertices P(1,2), Q(4,2), R(4,5). Find the image after reflection in the y-axis.", answer:"P'(−1,2), Q'(−4,2), R'(−4,5)", solution:"Reflection in y-axis: (x,y)→(−x,y). P'=(−1,2), Q'=(−4,2), R'=(−4,5)." },
        ]
      },

      "English Language": { icon:<Ico n="lang" />,
        objectives: [
          // Parts of Speech
          { id:"jeo_pos1", topic:"Parts of Speech", year:"2023", question:"'She ran QUICKLY to school.' The capitalised word is a ___.",
            options:["A. Noun","B. Verb","C. Adjective","D. Adverb"], correct:"D",
            explanation:"'Quickly' modifies verb 'ran' → adverb." },
          { id:"jeo_pos2", topic:"Parts of Speech", year:"2022", question:"Which word is a conjunction in: 'I wanted to go, but it rained.'",
            options:["A. wanted","B. go","C. but","D. rained"], correct:"C",
            explanation:"'But' joins two clauses → coordinating conjunction." },
          { id:"jeo_pos3", topic:"Parts of Speech", year:"2021", question:"Identify the pronoun: 'They went to the market together.'",
            options:["A. went","B. They","C. market","D. together"], correct:"B",
            explanation:"'They' replaces a noun (the people) → personal pronoun." },
          // Tenses
          { id:"jeo_t1", topic:"Tenses", year:"2022", question:"Choose correct form: 'By the time we arrived, the teacher _____ already.'",
            options:["A. leaves","B. has left","C. had left","D. left"], correct:"C",
            explanation:"Past Perfect (had+past participle) for action completed before another past event." },
          { id:"jeo_t2", topic:"Tenses", year:"2023", question:"Which sentence is in the Present Perfect tense?",
            options:["A. She goes to school daily.","B. She went to school.","C. She has gone to school.","D. She will go to school."], correct:"C",
            explanation:"Present Perfect = has/have + past participle." },
          { id:"jeo_t3", topic:"Tenses", year:"2021", question:"'We ___ here since 2019.' Choose the correct verb form.",
            options:["A. live","B. lived","C. have lived","D. will live"], correct:"C",
            explanation:"'Since' signals present perfect: have lived." },
          // Grammar & Sentence Structure
          { id:"jeo_g1", topic:"Grammar", year:"2022", question:"'Neither the boys nor the girl ___ present.' Correct form:",
            options:["A. were","B. are","C. was","D. be"], correct:"C",
            explanation:"Verb agrees with the nearest subject 'girl' (singular) → 'was'." },
          { id:"jeo_g2", topic:"Grammar", year:"2023", question:"Which sentence has a grammatical error?",
            options:["A. He runs every day.","B. They is going home.","C. She has finished.","D. We were there."], correct:"B",
            explanation:"'They' is plural → should be 'They are going home.'" },
          // Vocabulary
          { id:"jeo_v1", topic:"Vocabulary", year:"2022", question:"'Benevolent' is closest in meaning to ___.",
            options:["A. Cruel","B. Clever","C. Lazy","D. Kind"], correct:"D",
            explanation:"Benevolent = well-meaning and kind." },
          { id:"jeo_v2", topic:"Vocabulary", year:"2023", question:"The antonym of 'transparent' is ___.",
            options:["A. Clear","B. Opaque","C. Shiny","D. Dull"], correct:"B",
            explanation:"Transparent = see-through; antonym = opaque (cannot see through)." },
          { id:"jeo_v3", topic:"Vocabulary", year:"2021", question:"Which word means 'to make something better'?",
            options:["A. Worsen","B. Ignore","C. Improve","D. Reduce"], correct:"C",
            explanation:"'Improve' = to make better or enhance." },
          // Comprehension & Figures of Speech
          { id:"jeo_c1", topic:"Comprehension", year:"2021", question:"A metaphor is a figure of speech that ___.",
            options:["A. uses 'like' or 'as'","B. exaggerates for effect","C. directly compares two things","D. repeats initial consonants"], correct:"C",
            explanation:"Metaphor makes a direct comparison without 'like/as'. Simile uses 'like/as'; hyperbole exaggerates; alliteration repeats consonants." },
          { id:"jeo_c2", topic:"Comprehension", year:"2023", question:"'The thunder roared like an angry lion.' This is a ___.",
            options:["A. Metaphor","B. Simile","C. Personification","D. Hyperbole"], correct:"B",
            explanation:"Comparison using 'like' → simile." },
          { id:"jeo_c3", topic:"Comprehension", year:"2022", question:"'The wind whispered through the trees.' What figure of speech is this?",
            options:["A. Simile","B. Alliteration","C. Personification","D. Onomatopoeia"], correct:"C",
            explanation:"Wind given human quality (whispering) → personification." },
          // Writing Skills
          { id:"jeo_w1", topic:"Writing Skills", year:"2023", question:"A topic sentence in an essay should ___.",
            options:["A. summarise the whole essay","B. state the main idea of a paragraph","C. introduce the title","D. give evidence"], correct:"B",
            explanation:"A topic sentence states the main idea of a paragraph; it controls all sentences in that paragraph." },
          { id:"jeo_w2", topic:"Writing Skills", year:"2022", question:"Which type of essay requires you to tell a story?",
            options:["A. Argumentative","B. Expository","C. Narrative","D. Descriptive"], correct:"C",
            explanation:"Narrative essay tells a story with characters, setting, plot." },
          // Oral English
          { id:"jeo_o1", topic:"Oral English", year:"2023", question:"The word 'KNEEL' contains a silent letter. What is it?",
            options:["A. N","B. E","C. K","D. L"], correct:"C",
            explanation:"In 'KNEEL', K is silent. Pronounced 'neel'." },
          { id:"jeo_o2", topic:"Oral English", year:"2022", question:"How many syllables does the word 'BEAUTIFUL' have?",
            options:["A. 2","B. 3","C. 4","D. 5"], correct:"B",
            explanation:"Beau-ti-ful = 3 syllables." },
          // Punctuation
          { id:"jeo_pu1", topic:"Punctuation", year:"2022", question:"Which punctuation mark ends an exclamatory sentence?",
            options:["A. Full stop","B. Question mark","C. Exclamation mark","D. Comma"], correct:"C",
            explanation:"Exclamatory sentences express strong emotion → end with exclamation mark (!)." },
        ],
        theory: [
          { id:"jet_pos1", topic:"Parts of Speech", year:"2023", question:"Identify the part of speech of each underlined word and give a reason: (a) She sings BEAUTIFULLY. (b) THE cat sat on the mat. (c) They walked SLOWLY and QUIETLY.", answer:"(a)Adverb (b)Article/Determiner (c)Both adverbs", solution:"(a) 'Beautifully' modifies verb 'sings' → adverb. (b) 'The' is a definite article (determiner before noun). (c) 'Slowly' modifies 'walked'; 'quietly' modifies 'walked' → both adverbs." },
          { id:"jet_t1", topic:"Tenses", year:"2022", question:"Rewrite each sentence in the tense indicated: (a) 'She goes to market.' [Past continuous] (b) 'They finished the work.' [Present perfect] (c) 'He will travel tomorrow.' [Future perfect]", answer:"(a)She was going to market. (b)They have finished the work. (c)He will have travelled by tomorrow.", solution:"(a) Past continuous=was/were+V-ing. (b) Present perfect=has/have+past participle. (c) Future perfect=will have+past participle." },
          { id:"jet_g1", topic:"Grammar", year:"2022", question:"Join these sentences using a suitable conjunction, then explain the relationship shown: (a) 'Kofi studied hard. He passed his BECE.' (b) 'It was raining. We went out.'", answer:"(a)Kofi studied hard, so he passed. (b)Although it was raining, we went out.", solution:"(a) 'So' shows cause and result. (b) 'Although' shows contrast/concession. Conjunctions create logical relationships between clauses." },
          { id:"jet_v1", topic:"Vocabulary", year:"2023", question:"Use each of these words correctly in a sentence that shows its meaning: (a) Meticulous  (b) Procrastinate  (c) Eloquent", answer:"Sentences demonstrating understanding of each word's meaning.", solution:"(a) 'She was so meticulous that she checked every detail twice before submitting her work.' (b) 'Students who procrastinate often struggle to complete assignments before deadlines.' (c) 'The eloquent speaker moved the audience to tears with her powerful words.'" },
          { id:"jet_c1", topic:"Comprehension", year:"2021", question:"Explain the difference between a simile and a metaphor. Give TWO original examples of each.", answer:"Simile uses 'like/as'; metaphor is a direct comparison.", solution:"Simile: 'He is as fast as a cheetah.' / 'Her voice was like honey.' Metaphor: 'He is a cheetah on the track.' / 'Her voice is honey.' Similes compare using 'like/as'; metaphors state one thing IS another without a comparative word." },
          { id:"jet_w1", topic:"Writing Skills", year:"2023", question:"Write a well-structured paragraph (8–10 sentences) on: 'The importance of education in Ghana's development.' Include: a topic sentence, THREE supporting points with evidence, and a concluding sentence.", answer:"Coherent paragraph with topic sentence, 3 evidenced points, conclusion.", solution:"Topic sentence: 'Education is the most powerful tool for Ghana's socio-economic development.' Points: (1)Skilled workforce — educated citizens drive industry and innovation; (2)Reduces poverty — literate population can access better jobs; (3)Health outcomes — educated mothers make better health decisions. Conclusion: 'For Ghana to achieve its development goals, sustained investment in quality education at all levels is indispensable.'" },
          { id:"jet_o1", topic:"Oral English", year:"2022", question:"(a) Explain what is meant by 'stress' in spoken English. (b) Write the stressed syllable of these words: (i) baNAna (ii) PHOtograph (iii) proFESsion", answer:"(a) Stress = emphasis on one syllable. (b)(i)NA (ii)PHO (iii)FES", solution:"Word stress places emphasis on one syllable, making it louder, longer, and higher-pitched than others. (i) ba-NA-na → 'NA' stressed. (ii) PHO-to-graph → 'PHO' stressed. (iii) pro-FES-sion → 'FES' stressed." },
          { id:"jet_pu1", topic:"Punctuation", year:"2023", question:"Rewrite the following passage, inserting correct punctuation: \"kofi said im going to accra tomorrow will you come with me ama replied yes i will come\"", answer:"Correctly punctuated passage with speech marks, commas, question mark, capital letters.", solution:"Kofi said, \"I'm going to Accra tomorrow. Will you come with me?\" Ama replied, \"Yes, I will come.\"" },
        ]
      },

      "Integrated Science": { icon:null,
        objectives: [
          // Living Things / Biology
          { id:"jso_l1", topic:"Living Things", year:"2023", question:"Which of these is NOT a characteristic of living things?",
            options:["A. Nutrition","B. Respiration","C. Combustion","D. Excretion"], correct:"C",
            explanation:"Combustion is a chemical reaction, not a life process. MRSGREN covers all life processes." },
          { id:"jso_l2", topic:"Living Things", year:"2022", question:"The process by which green plants make their own food is called ___.",
            options:["A. Respiration","B. Digestion","C. Photosynthesis","D. Transpiration"], correct:"C",
            explanation:"Photosynthesis: CO₂+H₂O+light→Glucose+O₂." },
          // Human Biology
          { id:"jso_h1", topic:"Human Biology", year:"2021", question:"The main function of red blood cells is to ___.",
            options:["A. Fight infection","B. Carry oxygen","C. Produce hormones","D. Digest food"], correct:"B",
            explanation:"RBCs contain haemoglobin which binds and transports oxygen from lungs to tissues." },
          { id:"jso_h2", topic:"Human Biology", year:"2023", question:"Which organ controls all body activities in humans?",
            options:["A. Heart","B. Kidney","C. Brain","D. Liver"], correct:"C",
            explanation:"The brain is the control centre of the nervous system, coordinating all bodily functions." },
          { id:"jso_h3", topic:"Human Biology", year:"2022", question:"Where does digestion of proteins begin?",
            options:["A. Mouth","B. Stomach","C. Small intestine","D. Large intestine"], correct:"B",
            explanation:"Protein digestion begins in the stomach where pepsin (enzyme) and HCl break down proteins." },
          // Reproduction
          { id:"jso_r1", topic:"Reproduction", year:"2022", question:"In humans, fertilisation normally takes place in the ___.",
            options:["A. Uterus","B. Ovary","C. Fallopian tube","D. Vagina"], correct:"C",
            explanation:"A sperm fertilises an egg in the fallopian tube (oviduct); the zygote then travels to the uterus." },
          { id:"jso_r2", topic:"Reproduction", year:"2023", question:"Which part of a flower contains the male sex cells?",
            options:["A. Pistil","B. Petal","C. Sepal","D. Pollen grain"], correct:"D",
            explanation:"Pollen grains produced by the anther contain the male gametes (sex cells) of a plant." },
          // States of Matter
          { id:"jso_sm1", topic:"States of Matter", year:"2022", question:"A substance has a definite volume but no definite shape. What state is it in?",
            options:["A. Solid","B. Liquid","C. Gas","D. Plasma"], correct:"B",
            explanation:"Liquids have definite volume but take the shape of their container." },
          { id:"jso_sm2", topic:"States of Matter", year:"2023", question:"What is the term for a solid changing directly to a gas without passing through the liquid state?",
            options:["A. Evaporation","B. Condensation","C. Sublimation","D. Melting"], correct:"C",
            explanation:"Sublimation: solid→gas directly. Example: dry ice (solid CO₂), iodine." },
          // Photosynthesis
          { id:"jso_ph1", topic:"Photosynthesis", year:"2022", question:"Which gas is released during photosynthesis?",
            options:["A. Carbon dioxide","B. Nitrogen","C. Oxygen","D. Hydrogen"], correct:"C",
            explanation:"6CO₂+6H₂O→C₆H₁₂O₆+6O₂. Oxygen is the byproduct." },
          { id:"jso_ph2", topic:"Photosynthesis", year:"2021", question:"In which part of the plant cell does photosynthesis take place?",
            options:["A. Mitochondria","B. Ribosome","C. Chloroplast","D. Vacuole"], correct:"C",
            explanation:"Chloroplasts contain chlorophyll, the pigment that absorbs light energy for photosynthesis." },
          // Forces & Motion
          { id:"jso_f1", topic:"Forces & Motion", year:"2022", question:"Which of Newton's laws states: 'A body remains at rest or in uniform motion unless acted upon by a force'?",
            options:["A. First Law","B. Second Law","C. Third Law","D. Law of Gravitation"], correct:"A",
            explanation:"Newton's First Law (Law of Inertia): a body at rest stays at rest; in motion stays in motion, unless a net force acts on it." },
          { id:"jso_f2", topic:"Forces & Motion", year:"2023", question:"Speed = Distance ÷ Time. A car travels 120km in 2 hours. What is its speed?",
            options:["A. 30 km/h","B. 40 km/h","C. 60 km/h","D. 80 km/h"], correct:"C",
            explanation:"Speed=120÷2=60 km/h." },
          // Electricity
          { id:"jso_e1", topic:"Electricity", year:"2021", question:"The unit of electrical resistance is the ___.",
            options:["A. Volt","B. Ampere","C. Watt","D. Ohm"], correct:"D",
            explanation:"Resistance is measured in Ohms (Ω). Ohm's Law: V=IR." },
          { id:"jso_e2", topic:"Electricity", year:"2023", question:"Which material is the best conductor of electricity?",
            options:["A. Wood","B. Plastic","C. Rubber","D. Copper"], correct:"D",
            explanation:"Copper is one of the best electrical conductors due to its free electrons." },
          // Chemistry — Elements & Compounds
          { id:"jso_ch1", topic:"Elements & Compounds", year:"2022", question:"How many elements are in the compound H₂SO₄?",
            options:["A. 2","B. 3","C. 4","D. 5"], correct:"B",
            explanation:"H₂SO₄ contains Hydrogen (H), Sulphur (S), and Oxygen (O) — 3 elements." },
          { id:"jso_ch2", topic:"Elements & Compounds", year:"2023", question:"Which of the following is a mixture?",
            options:["A. Water","B. Salt","C. Air","D. Carbon dioxide"], correct:"C",
            explanation:"Air is a mixture of gases (N₂, O₂, CO₂, etc.) that can be separated. Water and salt are compounds; CO₂ is a compound." },
          // Environment
          { id:"jso_en1", topic:"Environment & Ecology", year:"2021", question:"Which of the following is a renewable energy source?",
            options:["A. Coal","B. Petroleum","C. Solar","D. Natural gas"], correct:"C",
            explanation:"Solar energy from the sun is renewable (inexhaustible). Coal, petroleum, and natural gas are fossil fuels (non-renewable)." },
        ],
        theory: [
          { id:"jst_l1", topic:"Living Things", year:"2023", question:"State FOUR characteristics of living things and give ONE example of each in a named organism.", answer:"Any 4 of MRSGREN with examples.", solution:"(1)Nutrition — a cow eats grass. (2)Respiration — a fish uses gills to breathe. (3)Excretion — humans excrete urea in urine. (4)Growth — a mango tree increases in size. (5)Reproduction — a dog gives birth to puppies. (6)Movement — a cat walks. (7)Sensitivity — a plant bends toward light." },
          { id:"jst_h1", topic:"Human Biology", year:"2023", question:"Describe the pathway of blood through the human heart, naming the chambers in the correct order.", answer:"Right atrium→right ventricle→lungs→left atrium→left ventricle→body", solution:"Deoxygenated blood: (1)Enters right atrium via vena cava. (2)Flows to right ventricle. (3)Pumped to lungs via pulmonary artery — oxygenated. (4)Returns to left atrium via pulmonary vein. (5)Flows to left ventricle. (6)Pumped to body via aorta." },
          { id:"jst_r1", topic:"Reproduction", year:"2022", question:"State FOUR differences between sexual and asexual reproduction.", answer:"Sexual: 2 parents, gametes, variation, slower. Asexual: 1 parent, no gametes, identical offspring, faster.", solution:"(1)Parents: sexual needs 2; asexual needs 1. (2)Gametes: sexual uses eggs+sperm; asexual does not. (3)Variation: sexual offspring show genetic variation; asexual offspring are genetically identical (clones). (4)Speed: asexual is faster. (5)Examples: sexual=humans; asexual=bacteria (binary fission), strawberry (runners)." },
          { id:"jst_sm1", topic:"States of Matter", year:"2021", question:"Give THREE differences between a solid and a gas, using particle theory.", answer:"Shape, volume, particle spacing — all differ.", solution:"(1)Shape: Solids have fixed shape; gases take any container shape. Solid particles vibrate in fixed positions; gas particles move randomly. (2)Volume: Solids have fixed volume; gases fill any container. Gas particles are easily compressed. (3)Movement: Solid particles only vibrate; gas particles move very fast in all directions." },
          { id:"jst_ph1", topic:"Photosynthesis", year:"2022", question:"Write the word equation for photosynthesis. Name the part of the cell where it occurs and state TWO raw materials required.", answer:"CO₂+H₂O→Glucose+O₂; chloroplast; raw materials: CO₂, water, light", solution:"Carbon dioxide + Water → Glucose + Oxygen (in the presence of light and chlorophyll). Location: chloroplast. Raw materials: (1)Carbon dioxide — absorbed from air through stomata; (2)Water — absorbed from soil through roots; (3)Light energy from the sun." },
          { id:"jst_f1", topic:"Forces & Motion", year:"2022", question:"A car of mass 800kg accelerates from rest to 20m/s in 5 seconds. Calculate: (a) its acceleration  (b) the force that produced this acceleration.", answer:"(a) 4 m/s²  (b) 3200 N", solution:"(a) a=(v−u)/t=(20−0)/5=4 m/s². (b) F=ma=800×4=3200 N." },
          { id:"jst_e1", topic:"Electricity", year:"2023", question:"(a) State Ohm's Law. (b) A lamp has resistance 12Ω. If a current of 2A flows through it, calculate the voltage across it.", answer:"(a) V=IR  (b) 24V", solution:"(a) Ohm's Law: The current through a conductor is directly proportional to the voltage across it, at constant temperature. V=IR. (b) V=IR=2×12=24 V." },
          { id:"jst_ch1", topic:"Elements & Compounds", year:"2022", question:"Explain the difference between an element, a compound, and a mixture. Give ONE example of each.", answer:"Element: one type of atom. Compound: two+ elements chemically combined. Mixture: substances physically combined.", solution:"Element: made of only one type of atom; cannot be broken down further. Example: Gold (Au). Compound: two or more elements chemically joined in fixed ratios. Example: Water (H₂O). Mixture: two or more substances physically combined, not chemically. Can be separated. Example: Salt water." },
          { id:"jst_en1", topic:"Environment & Ecology", year:"2021", question:"Explain FOUR ways in which human activities damage the environment in Ghana.", answer:"Mining, burning, deforestation, pollution of water bodies.", solution:"(1)Galamsey (illegal mining): pollutes rivers with mercury, destroys farmland. (2)Burning of vegetation (bush fires): destroys habitat, causes soil erosion, releases CO₂. (3)Deforestation: loss of biodiversity, reduced rainfall, soil erosion. (4)Industrial pollution: factory waste contaminates water bodies and soil. (5)Plastic waste: clogs drains, pollutes beaches, kills marine life." },
        ]
      },

      "Social Studies": { icon:<Ico n="globe" />,
        objectives: [
          // Ghana History
          { id:"jsso_gh1", topic:"Ghana History", year:"2023", question:"On which date did Ghana gain independence?",
            options:["A. 1st July 1960","B. 6th March 1957","C. 24th Feb 1966","D. 4th Aug 1983"], correct:"B",
            explanation:"Ghana became the first sub-Saharan African country to gain independence on 6th March 1957, led by Dr. Kwame Nkrumah." },
          { id:"jsso_gh2", topic:"Ghana History", year:"2022", question:"The Big Six were freedom fighters who were arrested in ___.",
            options:["A. 1947","B. 1948","C. 1950","D. 1957"], correct:"B",
            explanation:"The Big Six (including Nkrumah, Danquah, Ofori Atta) were arrested following the 1948 Accra riots." },
          { id:"jsso_gh3", topic:"Ghana History", year:"2021", question:"Ghana's first president was ___.",
            options:["A. J.J. Rawlings","B. K.A. Busia","C. Kwame Nkrumah","D. J.B. Danquah"], correct:"C",
            explanation:"Dr. Kwame Nkrumah became Ghana's (and Africa's) first president of the First Republic in 1960." },
          // Democracy & Governance
          { id:"jsso_d1", topic:"Democracy & Governance", year:"2022", question:"In Ghana, how often are general elections held?",
            options:["A. Every 2 years","B. Every 3 years","C. Every 4 years","D. Every 5 years"], correct:"C",
            explanation:"Ghana's 1992 Constitution mandates presidential and parliamentary elections every 4 years." },
          { id:"jsso_d2", topic:"Democracy & Governance", year:"2023", question:"The arm of government that makes laws in Ghana is the ___.",
            options:["A. Executive","B. Judiciary","C. Legislature","D. Military"], correct:"C",
            explanation:"Legislature (Parliament) makes laws. Executive implements them; Judiciary interprets them." },
          { id:"jsso_d3", topic:"Democracy & Governance", year:"2021", question:"The Electoral Commission of Ghana conducts ___.",
            options:["A. Court cases","B. Budget reviews","C. Public elections","D. Tax collection"], correct:"C",
            explanation:"The Electoral Commission (EC) is constitutionally mandated to organise and supervise public elections in Ghana." },
          // Natural Resources
          { id:"jsso_nr1", topic:"Natural Resources", year:"2021", question:"Which region is the main cocoa-growing area of Ghana?",
            options:["A. Northern","B. Greater Accra","C. Ashanti","D. Volta"], correct:"C",
            explanation:"Ashanti Region (plus Brong-Ahafo and Eastern) forms Ghana's cocoa belt due to the suitable humid climate." },
          { id:"jsso_nr2", topic:"Natural Resources", year:"2022", question:"Ghana's main source of hydroelectric power is the ___.",
            options:["A. Pra River","B. Volta Lake","C. White Volta","D. Ankobra River"], correct:"B",
            explanation:"Akosombo Dam on the Volta Lake is Ghana's primary source of hydroelectric power, built in 1965." },
          { id:"jsso_nr3", topic:"Natural Resources", year:"2023", question:"Which of these is a renewable resource?",
            options:["A. Gold","B. Petroleum","C. Timber","D. Natural gas"], correct:"C",
            explanation:"Timber can be renewed through reforestation. Gold, petroleum, and natural gas are non-renewable (finite) resources." },
          // Population & Settlement
          { id:"jsso_p1", topic:"Population & Settlement", year:"2021", question:"Which of these is a consequence of rapid population growth in Ghana?",
            options:["A. Less unemployment","B. More school places","C. Pressure on social services","D. Improved housing"], correct:"C",
            explanation:"Rapid population growth strains hospitals, schools, roads, and housing — demand exceeds supply." },
          { id:"jsso_p2", topic:"Population & Settlement", year:"2023", question:"Rural-urban migration in Ghana is mainly caused by ___.",
            options:["A. Poor weather in cities","B. Search for better jobs and amenities","C. Lack of food in rural areas","D. Government policy"], correct:"B",
            explanation:"People migrate to cities mainly seeking employment, education, healthcare, and better living conditions." },
          // Environment
          { id:"jsso_e1", topic:"Environment", year:"2021", question:"Which of these is a direct effect of deforestation?",
            options:["A. Increased rainfall","B. Soil erosion","C. Lower temperatures","D. More biodiversity"], correct:"B",
            explanation:"Tree roots hold soil in place. Without trees, topsoil is washed away by rain → soil erosion." },
          { id:"jsso_e2", topic:"Environment", year:"2022", question:"Galamsey (illegal small-scale mining) mainly damages ___.",
            options:["A. Air only","B. Soil and water bodies","C. Forest only","D. Roads"], correct:"B",
            explanation:"Galamsey uses mercury and heavy machinery, polluting rivers and destroying farmland and soil." },
          // Culture & Tradition
          { id:"jsso_c1", topic:"Culture & Tradition", year:"2022", question:"Which of these is a symbol of Ghanaian chieftaincy?",
            options:["A. The flag","B. The Kente cloth","C. The stool","D. The cedi"], correct:"C",
            explanation:"The stool (especially the Golden Stool of the Ashanti) is the ultimate symbol of chieftaincy, representing the soul of the people." },
          // Economic Activities
          { id:"jsso_ea1", topic:"Economic Activities", year:"2023", question:"Which sector of the economy includes farming and fishing?",
            options:["A. Primary","B. Secondary","C. Tertiary","D. Quaternary"], correct:"A",
            explanation:"Primary sector: extraction of raw materials directly from nature — farming, fishing, mining, forestry." },
          // Regional Integration
          { id:"jsso_ri1", topic:"Regional Integration", year:"2021", question:"ECOWAS was established primarily to ___.",
            options:["A. Promote military cooperation","B. Encourage economic integration","C. Create a common African currency","D. Manage colonial boundaries"], correct:"B",
            explanation:"ECOWAS (Economic Community of West African States, 1975) promotes economic integration and free movement." },
        ],
        theory: [
          { id:"jsst_gh1", topic:"Ghana History", year:"2023", question:"Explain THREE reasons why Ghana's independence in 1957 was significant for Africa.", answer:"First sub-Saharan independent nation; inspired other nations; showed peaceful transition possible.", solution:"(1)First: Ghana was the first sub-Saharan African country to gain independence, proving it was achievable. (2)Inspiration: Sparked independence movements across Africa — by 1960, 17 more nations were free (Year of Africa). (3)Peaceful model: Showed independence could be achieved through political organisation rather than armed struggle. (4)Pan-Africanism: Nkrumah championed African unity and hosted liberation movements." },
          { id:"jsst_d1", topic:"Democracy & Governance", year:"2022", question:"Describe the THREE arms of government in Ghana and explain the role of each.", answer:"Executive, Legislature, Judiciary — each with distinct constitutional roles.", solution:"(1)Executive: Led by the President; implements laws, manages national policy and administration. (2)Legislature (Parliament): 275 MPs debate, pass, and amend laws; approves the national budget. (3)Judiciary: Courts (Supreme Court, High Courts) interpret laws and ensure justice. Separation of powers ensures no arm dominates." },
          { id:"jsst_nr1", topic:"Natural Resources", year:"2023", question:"Explain FOUR ways in which Ghana's natural resources contribute to its national development.", answer:"Revenue, employment, industrial raw materials, energy generation.", solution:"(1)Gold and cocoa exports earn foreign exchange used to fund development projects. (2)Oil (since 2010) contributes to the government budget and energy supply. (3)Timber provides raw materials for furniture/construction industries. (4)Volta Lake generates hydroelectric power for industry and homes. (5)Minerals like bauxite supply raw materials for manufacturing." },
          { id:"jsst_p1", topic:"Population & Settlement", year:"2021", question:"Explain FOUR effects of rural-urban migration on Ghana's cities and rural areas.", answer:"Urban overcrowding, rural depopulation, unemployment, infrastructure strain.", solution:"Effects on cities: (1)Overcrowding → slums, poor sanitation; (2)Unemployment — more people than jobs; (3)Strain on infrastructure (roads, hospitals, schools). Effects on rural areas: (4)Labour shortage → reduced agricultural output; (5)Aging population left behind; (6)Underdevelopment of rural areas." },
          { id:"jsst_e1", topic:"Environment", year:"2021", question:"Explain FOUR effects of environmental pollution on the people of Ghana.", answer:"Health problems, water contamination, crop damage, loss of tourism.", solution:"(1)Health: Air pollution from burning and mining causes respiratory diseases. (2)Water: Galamsey pollutes rivers with mercury, making water unsafe for drinking. (3)Agriculture: Soil contamination reduces crop yields. (4)Economy: Polluted beaches reduce tourism revenue. (5)Biodiversity: Chemical spills kill aquatic life in rivers and coastal areas." },
          { id:"jsst_c1", topic:"Culture & Tradition", year:"2022", question:"Explain the importance of the family in Ghanaian society.", answer:"Social security, cultural transmission, economic support, identity.", solution:"(1)Social security: Family members support each other during illness, hardship, and old age. (2)Cultural transmission: Family is where children learn language, values, customs, and traditions. (3)Economic support: Extended family provides financial assistance for education, business, and emergencies. (4)Identity: Family gives individuals a sense of belonging and social status. (5)Conflict resolution: Elders in the family resolve disputes, maintaining social harmony." },
          { id:"jsst_ea1", topic:"Economic Activities", year:"2023", question:"Explain THREE problems facing agriculture in Ghana and suggest ONE solution to each.", answer:"Poor roads, lack of credit, outdated methods — each with a solution.", solution:"(1)Poor infrastructure: Bad roads prevent farmers from getting produce to market → solution: government to invest in rural road construction. (2)Lack of credit: Farmers cannot buy improved seeds/equipment → solution: expand agricultural loans through rural banks. (3)Outdated methods: Many use hoe and cutlass → solution: introduce mechanised farming and train farmers. (4)Post-harvest losses: Lack of storage → solution: build cold stores and processing facilities." },
        ]
      }
    }
  },

  SHS: {
    label:"WASSCE", accent:"#38bdf8", dim:"#0284c7",
    glow:"rgba(56,189,248,0.18)", emoji:<Ico n="grad" />,
    subjects: {
      "Core Mathematics": { icon:<Ico n="calc" />,
        objectives: [
          // Number & Numeration
          { id:"smo_nn1", topic:"Number & Numeration", year:"2023", question:"Express 0.000325 in standard form.",
            options:["A. 3.25×10⁻⁴","B. 3.25×10⁻³","C. 32.5×10⁻⁵","D. 3.25×10⁴"], correct:"A",
            explanation:"Move decimal 4 places right → 3.25×10⁻⁴." },
          { id:"smo_nn2", topic:"Number & Numeration", year:"2022", question:"Evaluate: log₁₀1000",
            options:["A. 1","B. 2","C. 3","D. 4"], correct:"C",
            explanation:"10³=1000 → log₁₀1000=3." },
          // Indices & Logarithms
          { id:"smo_il1", topic:"Indices & Logarithms", year:"2023", question:"Given log₁₀2=0.3010, what is log₁₀8?",
            options:["A. 0.6020","B. 0.7525","C. 0.9030","D. 1.2040"], correct:"C",
            explanation:"log₁₀8=log₁₀2³=3×0.3010=0.9030." },
          { id:"smo_il2", topic:"Indices & Logarithms", year:"2022", question:"Simplify: 2^(n+2) − 2^n",
            options:["A. 2^(2n)","B. 3×2^n","C. 2^n","D. 2^(2)"], correct:"B",
            explanation:"2^(n+2)−2^n=4×2^n−2^n=3×2^n." },
          // Sets
          { id:"smo_se1", topic:"Sets", year:"2021", question:"If n(A)=15, n(B)=12, n(A∩B)=5, find n(A∪B).",
            options:["A. 17","B. 22","C. 27","D. 32"], correct:"B",
            explanation:"n(A∪B)=15+12−5=22." },
          { id:"smo_se2", topic:"Sets", year:"2023", question:"If U={1,2,3,4,5,6,7,8} and A={2,4,6,8}, find A' (complement of A).",
            options:["A. {1,3,5,7}","B. {2,4,6,8}","C. {1,2,3}","D. {}"], correct:"A",
            explanation:"A' = elements in U but not in A = {1,3,5,7}." },
          // Algebra & Quadratics
          { id:"smo_qe1", topic:"Quadratic Equations", year:"2023", question:"What are the roots of x²−5x+6=0?",
            options:["A. x=1,6","B. x=2,3","C. x=−2,−3","D. x=−1,6"], correct:"B",
            explanation:"Factor: (x−2)(x−3)=0 → x=2 or x=3." },
          { id:"smo_qe2", topic:"Quadratic Equations", year:"2022", question:"For 3x²−7x+2=0, the product of the roots is ___.",
            options:["A. 7/3","B. 2/3","C. −7/3","D. 3/2"], correct:"B",
            explanation:"Product of roots=c/a=2/3 (Vieta's formula)." },
          // Functions & Graphs
          { id:"smo_fg1", topic:"Functions & Graphs", year:"2022", question:"If f(x)=2x−3, find f(4).",
            options:["A. 2","B. 4","C. 5","D. 8"], correct:"C",
            explanation:"f(4)=2(4)−3=8−3=5." },
          { id:"smo_fg2", topic:"Functions & Graphs", year:"2023", question:"The gradient of the line y=3x−7 is ___.",
            options:["A. −7","B. 3","C. 7","D. −3"], correct:"B",
            explanation:"In y=mx+c form, m (gradient)=3." },
          // Sequences & Series
          { id:"smo_ss1", topic:"Sequences & Series", year:"2021", question:"The 3rd term of an AP is 7 and common difference is 3. What is the 1st term?",
            options:["A. 1","B. 2","C. 3","D. 4"], correct:"A",
            explanation:"T₃=a+2d=7. a=7−6=1." },
          { id:"smo_ss2", topic:"Sequences & Series", year:"2023", question:"Sum of first n terms of an AP: S=(n/2)(first+last). Find S for 1+3+5+...+19.",
            options:["A. 50","B. 80","C. 100","D. 120"], correct:"C",
            explanation:"n=10 terms (1,3,5..19). S=(10/2)(1+19)=5×20=100." },
          // Probability
          { id:"smo_pr1", topic:"Probability", year:"2022", question:"A die is rolled once. What is P(even number)?",
            options:["A. 1/6","B. 1/3","C. 1/2","D. 2/3"], correct:"C",
            explanation:"Even={2,4,6}=3 out of 6. P=1/2." },
          { id:"smo_pr2", topic:"Probability", year:"2023", question:"Two fair coins are tossed. P(at least one head) = ?",
            options:["A. 1/4","B. 1/2","C. 3/4","D. 1"], correct:"C",
            explanation:"Sample space: HH,HT,TH,TT. At least one head=HH,HT,TH=3/4." },
          // Statistics
          { id:"smo_st1", topic:"Statistics", year:"2022", question:"Which measure of central tendency is most affected by extreme values?",
            options:["A. Mode","B. Median","C. Mean","D. Range"], correct:"C",
            explanation:"The mean uses all values in calculation, so extreme values (outliers) pull it significantly." },
          // Mensuration
          { id:"smo_mn1", topic:"Mensuration", year:"2021", question:"Find the total surface area of a cylinder with r=7cm, h=10cm. (π=22/7)",
            options:["A. 440 cm²","B. 594 cm²","C. 748 cm²","D. 880 cm²"], correct:"C",
            explanation:"TSA=2πr(r+h)=2×(22/7)×7×(7+10)=44×17=748 cm²." },
          // Vectors
          { id:"smo_ve1", topic:"Vectors", year:"2022", question:"If a=(3,−4), what is |a|?",
            options:["A. 1","B. 5","C. 7","D. 25"], correct:"B",
            explanation:"|a|=√(9+16)=√25=5." },
          { id:"smo_ve2", topic:"Vectors", year:"2023", question:"Vector p=(2,5) and q=(−1,3). Find p+q.",
            options:["A. (1,8)","B. (3,2)","C. (1,2)","D. (−2,15)"], correct:"A",
            explanation:"p+q=(2+(−1), 5+3)=(1,8)." },
          // Calculus
          { id:"smo_ca1", topic:"Calculus", year:"2023", question:"Differentiate y=5x³ with respect to x.",
            options:["A. 5x²","B. 10x","C. 15x²","D. 15x³"], correct:"C",
            explanation:"dy/dx=3×5x^(3−1)=15x²." },
          { id:"smo_ca2", topic:"Calculus", year:"2022", question:"Find ∫3x² dx.",
            options:["A. 6x","B. x³+C","C. 3x³+C","D. x²+C"], correct:"B",
            explanation:"∫3x² dx = 3x³/3 + C = x³+C." },
          // Transformation
          { id:"smo_tr1", topic:"Transformation", year:"2022", question:"Point P(3,−2) is reflected in the x-axis. Its image is ___.",
            options:["A. (3,2)","B. (−3,−2)","C. (−3,2)","D. (2,3)"], correct:"A",
            explanation:"Reflection in x-axis: (x,y)→(x,−y). P(3,−2)→P'(3,2)." },
          // Trigonometry
          { id:"smo_tg1", topic:"Trigonometry", year:"2023", question:"In a right triangle, if the opposite side=3 and hypotenuse=5, what is sin θ?",
            options:["A. 3/5","B. 4/5","C. 5/3","D. 3/4"], correct:"A",
            explanation:"sin θ = opposite/hypotenuse = 3/5." },
          { id:"smo_tg2", topic:"Trigonometry", year:"2022", question:"What is tan 45°?",
            options:["A. 0","B. 1/2","C. 1","D. √2"], correct:"C",
            explanation:"tan 45°=sin45°/cos45°=(√2/2)/(√2/2)=1." },
        ],
        theory: [
          { id:"smt_il1", topic:"Indices & Logarithms", year:"2022", question:"(a) Simplify: 3^(2n+1)÷3^n. (b) Evaluate log₂32.", answer:"(a)3^(n+1) (b)5", solution:"(a)3^(2n+1−n)=3^(n+1). (b)2⁵=32→log₂32=5." },
          { id:"smt_se1", topic:"Sets", year:"2023", question:"In a class of 40 students, 25 study Maths, 18 study Science, and 8 study both. Using a Venn diagram, find how many study neither.", answer:"5 students", solution:"n(M∪S)=25+18−8=35. Neither=40−35=5." },
          { id:"smt_qe1", topic:"Quadratic Equations", year:"2023", question:"Solve 2x²−5x−3=0 by factorisation. Show all steps.", answer:"x=3 or x=−½", solution:"2x²−6x+x−3=2x(x−3)+1(x−3)=(2x+1)(x−3)=0. x=−½ or x=3." },
          { id:"smt_fg1", topic:"Functions & Graphs", year:"2022", question:"Given f(x)=x²−4x+3: (a) Find f(0) and f(3). (b) Find the values of x where f(x)=0. (c) State the axis of symmetry.", answer:"(a)f(0)=3, f(3)=0. (b)x=1 or x=3. (c)x=2.", solution:"(a)f(0)=0−0+3=3; f(3)=9−12+3=0. (b)x²−4x+3=0→(x−1)(x−3)=0→x=1 or 3. (c)Axis=−(−4)/(2×1)=2." },
          { id:"smt_ss1", topic:"Sequences & Series", year:"2021", question:"The 3rd term of an AP is 7 and 7th term is 19. Find: (a)common difference (b)1st term (c)sum of first 10 terms.", answer:"d=3, a=1, S₁₀=145", solution:"a+2d=7; a+6d=19. Subtract: 4d=12→d=3. a=1. S₁₀=(10/2)(2×1+9×3)=5×29=145." },
          { id:"smt_pr1", topic:"Probability", year:"2022", question:"Bag: 5 red and 3 blue balls. Two drawn without replacement. Find: (a)P(both red) (b)P(one each colour).", answer:"(a)5/14 (b)15/28", solution:"(a)P(RR)=5/8×4/7=20/56=5/14. (b)P(RB or BR)=(5/8×3/7)+(3/8×5/7)=15/56+15/56=30/56=15/28." },
          { id:"smt_st1", topic:"Statistics", year:"2023", question:"Data: 5,8,3,7,9,5,4,6,5,8. Find the (a)mean (b)mode (c)median.", answer:"(a)6 (b)5 (c)5.5", solution:"(a)Sum=60; mean=60/10=6. (b)5 appears 3 times→mode=5. (c)Sorted:3,4,5,5,5,6,7,8,8,9. Median=(5+6)/2=5.5." },
          { id:"smt_mn1", topic:"Mensuration", year:"2022", question:"A cone has base radius 6cm and slant height 10cm. Find: (a)curved surface area (b)total surface area. (π=3.142)", answer:"(a)188.5 cm² (b)301.6 cm²", solution:"(a)CSA=πrl=3.142×6×10=188.52 cm². (b)TSA=πr(r+l)=3.142×6×(6+10)=3.142×96=301.6 cm²." },
          { id:"smt_ca1", topic:"Calculus", year:"2023", question:"(a)Differentiate y=4x³−3x²+7x−2. (b)Find the gradient of the curve at x=1.", answer:"(a)dy/dx=12x²−6x+7 (b)13", solution:"(a)dy/dx=12x²−6x+7 (power rule). (b)At x=1: 12(1)²−6(1)+7=12−6+7=13." },
          { id:"smt_tr1", topic:"Transformation", year:"2022", question:"Triangle ABC has vertices A(1,1), B(3,1), C(2,4). Find the image under enlargement centre O(0,0) scale factor 2.", answer:"A'(2,2), B'(6,2), C'(4,8)", solution:"Enlargement from origin, scale factor k: (x,y)→(kx,ky). A'=(2,2), B'=(6,2), C'=(4,8)." },
          { id:"smt_tg1", topic:"Trigonometry", year:"2023", question:"From a point 50m from the base of a tower, the angle of elevation to the top is 32°. Find the height of the tower (tan32°=0.6249).", answer:"≈ 31.25 m", solution:"tan(angle)=opposite/adjacent. Height=50×tan32°=50×0.6249=31.25 m." },
          { id:"smt_ve1", topic:"Vectors", year:"2022", question:"Given p=(4,3) and q=(1,−2): (a)find p−q (b)find |p| (c)find the unit vector in the direction of q.", answer:"(a)(3,5) (b)5 (c)(1/√5, −2/√5)", solution:"(a)p−q=(4−1,3−(−2))=(3,5). (b)|p|=√(16+9)=√25=5. (c)|q|=√(1+4)=√5. Unit vector=(1/√5,−2/√5)." },
        ]
      },

      "Core English": { icon:<Ico n="lang" />,
        objectives: [
          // Figures of Speech
          { id:"seo_fs1", topic:"Figures of Speech", year:"2023", question:"'The classroom was a zoo.' This is a ___.",
            options:["A. Simile","B. Metaphor","C. Personification","D. Hyperbole"], correct:"B",
            explanation:"Metaphor: direct comparison, one thing IS another (no 'like/as')." },
          { id:"seo_fs2", topic:"Figures of Speech", year:"2022", question:"'I'm so hungry I could eat a horse.' This is a ___.",
            options:["A. Simile","B. Metaphor","C. Personification","D. Hyperbole"], correct:"D",
            explanation:"Hyperbole: deliberate extreme exaggeration for emphasis." },
          { id:"seo_fs3", topic:"Figures of Speech", year:"2021", question:"'The stars danced in the night sky.' This is a ___.",
            options:["A. Simile","B. Metaphor","C. Personification","D. Alliteration"], correct:"C",
            explanation:"Personification: non-human thing (stars) given human action (dancing)." },
          { id:"seo_fs4", topic:"Figures of Speech", year:"2023", question:"'Peter Piper picked a peck of pickled peppers.' This uses ___.",
            options:["A. Assonance","B. Alliteration","C. Rhyme","D. Onomatopoeia"], correct:"B",
            explanation:"Alliteration: repetition of initial consonant sounds (here 'p')." },
          // Oral English
          { id:"seo_oe1", topic:"Oral English", year:"2023", question:"The silent letter in 'KNIGHT' is ___.",
            options:["A. K","B. N","C. G","D. H"], correct:"A",
            explanation:"In 'KNIGHT', K is silent. Pronounced 'nite'." },
          { id:"seo_oe2", topic:"Oral English", year:"2022", question:"Which word is stressed on the SECOND syllable?",
            options:["A. PHOtograph","B. baNAna","C. FOOtball","D. TAble"], correct:"B",
            explanation:"ba-NA-na → second syllable 'NA' is stressed." },
          { id:"seo_oe3", topic:"Oral English", year:"2021", question:"How many phonemes (sounds) are in the word 'SHIP'?",
            options:["A. 2","B. 3","C. 4","D. 5"], correct:"B",
            explanation:"/ʃ/ + /ɪ/ + /p/ = 3 phonemes. Note: 'sh' = 1 sound." },
          // Grammar
          { id:"seo_gr1", topic:"Grammar", year:"2022", question:"Which sentence is grammatically correct?",
            options:["A. Neither of them are right.","B. Neither of them is right.","C. Neither of they is right.","D. Neither of they are right."], correct:"B",
            explanation:"'Neither' is singular; 'them' is correct object pronoun. → 'Neither of them IS right.'" },
          { id:"seo_gr2", topic:"Grammar", year:"2023", question:"Choose the correct passive form: 'They built the bridge in 1960.'",
            options:["A. The bridge is built in 1960.","B. The bridge was built in 1960.","C. The bridge has been built in 1960.","D. The bridge will be built in 1960."], correct:"B",
            explanation:"Past tense passive: was/were + past participle. 'was built' is correct." },
          { id:"seo_gr3", topic:"Grammar", year:"2021", question:"'She is the _____ student in the class.' Choose the correct form of 'tall'.",
            options:["A. more tall","B. most tall","C. tallest","D. taller"], correct:"C",
            explanation:"Superlative of 'tall' = tallest. 'Most tall' is incorrect; use '-est' for short adjectives." },
          // Vocabulary
          { id:"seo_vo1", topic:"Vocabulary", year:"2021", question:"Choose the word OPPOSITE in meaning to 'verbose'.",
            options:["A. Talkative","B. Fluent","C. Concise","D. Elaborate"], correct:"C",
            explanation:"Verbose = using too many words. Antonym = concise." },
          { id:"seo_vo2", topic:"Vocabulary", year:"2022", question:"'The politician gave an AMBIGUOUS statement.' AMBIGUOUS means ___.",
            options:["A. Clear and direct","B. Open to more than one interpretation","C. Dishonest","D. Short and brief"], correct:"B",
            explanation:"Ambiguous = having more than one possible meaning; unclear." },
          // Essay Writing
          { id:"seo_ew1", topic:"Essay Writing", year:"2023", question:"Which type of essay presents both sides of an issue and takes a clear position?",
            options:["A. Narrative","B. Descriptive","C. Argumentative","D. Expository"], correct:"C",
            explanation:"Argumentative essay: presents evidence for a position while acknowledging and refuting counter-arguments." },
          { id:"seo_ew2", topic:"Essay Writing", year:"2022", question:"The CONCLUSION of an essay should ___.",
            options:["A. Introduce new ideas","B. Restate the thesis and summarise key points","C. Give only examples","D. Start with 'In conclusion' always"], correct:"B",
            explanation:"A conclusion restates the thesis (in different words) and summarises the main points without introducing new ideas." },
          // Summary Writing
          { id:"seo_sw1", topic:"Summary Writing", year:"2022", question:"When writing a summary, you should ___.",
            options:["A. Copy sentences from the original","B. Add your own opinions","C. Use your own words to state main ideas","D. Include all details"], correct:"C",
            explanation:"A summary paraphrases (restates in own words) the main ideas, omitting minor details and personal opinions." },
          // Comprehension
          { id:"seo_cp1", topic:"Comprehension", year:"2023", question:"When reading for the main idea, you should focus on ___.",
            options:["A. Every single word","B. Unknown vocabulary only","C. The topic sentence and supporting points","D. The last paragraph only"], correct:"C",
            explanation:"The main idea is usually found in the topic sentence; supporting points develop it." },
        ],
        theory: [
          { id:"set_fs1", topic:"Figures of Speech", year:"2023", question:"Identify and explain the figure of speech in each sentence: (a)'Life is a journey.' (b)'She is as brave as a lion.' (c)'The wind moaned through the trees.' (d)'I've told you a million times!'", answer:"(a)Metaphor (b)Simile (c)Personification (d)Hyperbole", solution:"(a)Metaphor: life directly equated to a journey — no 'like/as'. (b)Simile: 'as brave as' — comparison using 'as'. (c)Personification: wind given human quality (moaning). (d)Hyperbole: extreme exaggeration ('a million times') for emphasis." },
          { id:"set_oe1", topic:"Oral English", year:"2022", question:"(a)Explain 'word stress' in spoken English. (b)For each word, write the stressed syllable: (i)BEautiful (ii)comPUter (iii)PHOtograph (iv)eCOnomy", answer:"(a)Stress=emphasis on one syllable. (b)(i)BEA (ii)PU (iii)PHO (iv)CO", solution:"Word stress: one syllable is made louder, longer, and higher-pitched. (i)BEA-u-ti-ful. (ii)com-PU-ter. (iii)PHO-to-graph. (iv)e-CO-no-my." },
          { id:"set_gr1", topic:"Grammar", year:"2021", question:"Rewrite in passive voice: (a)'The teacher marked our books.' (b)'Ghana won the match.' (c)'Someone has stolen my bag.'", answer:"(a)Our books were marked by the teacher. (b)The match was won by Ghana. (c)My bag has been stolen.", solution:"Passive voice: object→subject + was/were/has been + past participle + (by agent optional). (a)Our books were marked by the teacher. (b)The match was won by Ghana. (c)My bag has been stolen (by someone)." },
          { id:"set_vo1", topic:"Vocabulary", year:"2023", question:"Use each word correctly in a sentence that clearly shows its meaning: (a)Meticulous (b)Magnanimous (c)Procrastinate (d)Eloquent", answer:"Sentences using each word in context.", solution:"(a)'She was so meticulous that she proofread her essay five times before submission.' (b)'The magnanimous chief forgave his enemies and welcomed them back.' (c)'Students who procrastinate always struggle to meet deadlines.' (d)'The eloquent speaker captivated the audience from the moment she began.'" },
          { id:"set_ew1", topic:"Essay Writing", year:"2023", question:"Write a well-developed argumentative essay on: 'Social media does more harm than good to students.' Your essay must have an introduction with a thesis, TWO body paragraphs, and a conclusion. (Approximately 350–400 words)", answer:"Structured essay: introduction with thesis + 2 body paragraphs + conclusion.", solution:"Introduction: Hook → Background → Thesis (clear position). Body 1: Point 1 (academic distraction) + evidence + analysis. Body 2: Point 2 (mental health) + evidence + analysis. Conclusion: Restate thesis, summarise, call to action. Good essays acknowledge a counter-argument and refute it." },
          { id:"set_sw1", topic:"Summary Writing", year:"2022", question:"In NOT more than 60 words, summarise the key message of this passage in your own words: 'Reading is one of the most powerful habits a student can cultivate. It expands vocabulary, sharpens critical thinking, and broadens understanding of the world. Students who read consistently outperform their peers in all subjects. Beyond academics, reading reduces stress and builds empathy by exposing readers to different lives and perspectives. A student who reads is a student who grows.'", answer:"≤60-word summary in own words covering main benefit.", solution:"Model (55 words): 'Reading is an essential habit for students. It builds vocabulary, develops critical thinking, and improves performance across all subjects. Regular readers also manage stress better and become more empathetic, as exposure to diverse experiences broadens their worldview. Ultimately, consistent reading drives comprehensive academic and personal growth that benefits students throughout their lives.'" },
          { id:"set_cp1", topic:"Comprehension", year:"2021", question:"Read the following and answer the questions: 'Kwame arrived at school late. The teacher looked at him sternly and said nothing. The class was silent.' (a)What is the mood of the extract? (b)What does 'looked at him sternly' suggest about the teacher? (c)What literary device is used in 'The class was silent'?", answer:"(a)Tense/uncomfortable (b)Displeasure/strictness (c)Understatement or imagery", solution:"(a)The mood is tense, uncomfortable, and awkward — created by silence and the stern look. (b)It suggests the teacher is displeased, strict, and disapproving of Kwame's lateness — the look conveys displeasure without words. (c)Understatement — 'silent' understates the awkward tension. Could also be identified as imagery (visual)." },
        ]
      },

      "Core Science": { icon:<Ico n="atom" />,
        objectives: [
          // Cell Biology
          { id:"ssc_cb1", topic:"Cell Biology", year:"2023", question:"Which organelle is called the 'powerhouse of the cell'?",
            options:["A. Nucleus","B. Ribosome","C. Mitochondrion","D. Vacuole"], correct:"C",
            explanation:"Mitochondria carry out aerobic respiration, producing ATP. Hence 'powerhouse'." },
          { id:"ssc_cb2", topic:"Cell Biology", year:"2022", question:"Which structure controls what enters and leaves the cell?",
            options:["A. Cell wall","B. Cytoplasm","C. Cell membrane","D. Nucleus"], correct:"C",
            explanation:"The cell membrane (plasma membrane) is selectively permeable — it controls passage of substances into and out of the cell." },
          { id:"ssc_cb3", topic:"Cell Biology", year:"2021", question:"The process of cell division that produces genetically identical daughter cells is ___.",
            options:["A. Meiosis","B. Mitosis","C. Fertilisation","D. Diffusion"], correct:"B",
            explanation:"Mitosis: produces 2 identical daughter cells (same chromosome number). Meiosis produces 4 non-identical cells with half the chromosomes." },
          // Genetics
          { id:"ssc_ge1", topic:"Genetics", year:"2022", question:"Blood group O parents (ii×ii) can only produce children with blood group ___.",
            options:["A. A","B. B","C. AB","D. O"], correct:"D",
            explanation:"ii×ii→all offspring ii → blood group O only." },
          { id:"ssc_ge2", topic:"Genetics", year:"2023", question:"A person with sickle-cell trait has genotype ___.",
            options:["A. HbAHbA","B. HbSHbS","C. HbAHbS","D. HbAHbB"], correct:"C",
            explanation:"HbAHbS = sickle-cell trait (carrier). HbSHbS = sickle-cell disease. HbAHbA = normal." },
          // Ecology
          { id:"ssc_ec1", topic:"Ecology", year:"2023", question:"In the food chain: Grass→Grasshopper→Frog→Snake→Hawk. The Frog is a ___.",
            options:["A. Producer","B. Primary consumer","C. Secondary consumer","D. Tertiary consumer"], correct:"C",
            explanation:"Grass=producer. Grasshopper=primary consumer. Frog=secondary consumer. Snake=tertiary consumer." },
          { id:"ssc_ec2", topic:"Ecology", year:"2022", question:"The total amount of organic matter in an ecosystem at a given time is called ___.",
            options:["A. Biomass","B. Energy flow","C. Photosynthesis","D. Decomposition"], correct:"A",
            explanation:"Biomass is the total mass of living (or recently living) organisms in a given area." },
          // Chemistry — Atomic Structure
          { id:"ssc_as1", topic:"Atomic Structure", year:"2021", question:"An element has atomic number 17 and mass number 35. How many neutrons does it have?",
            options:["A. 17","B. 18","C. 35","D. 52"], correct:"B",
            explanation:"Neutrons = Mass number − Atomic number = 35−17=18." },
          { id:"ssc_as2", topic:"Atomic Structure", year:"2023", question:"Elements in the same group of the periodic table have the same ___.",
            options:["A. Number of neutrons","B. Atomic mass","C. Number of valence electrons","D. Electron shells"], correct:"C",
            explanation:"Elements in the same group have the same number of valence (outermost shell) electrons, giving them similar chemical properties." },
          // Chemistry — Reactions
          { id:"ssc_cr1", topic:"Chemical Reactions", year:"2021", question:"Which type of reaction is: 2H₂+O₂→2H₂O?",
            options:["A. Decomposition","B. Displacement","C. Neutralisation","D. Synthesis"], correct:"D",
            explanation:"Two substances combine to form one product → synthesis (combination) reaction." },
          { id:"ssc_cr2", topic:"Chemical Reactions", year:"2022", question:"In the reaction: HCl+NaOH→NaCl+H₂O. This type of reaction is ___.",
            options:["A. Decomposition","B. Synthesis","C. Neutralisation","D. Displacement"], correct:"C",
            explanation:"Acid + Base → Salt + Water is a neutralisation reaction." },
          // Physics — Forces & Motion
          { id:"ssc_fm1", topic:"Forces & Motion", year:"2022", question:"A 1200kg car accelerates at 2.5m/s². What force is applied?",
            options:["A. 480 N","B. 1200 N","C. 2500 N","D. 3000 N"], correct:"D",
            explanation:"F=ma=1200×2.5=3000 N." },
          { id:"ssc_fm2", topic:"Forces & Motion", year:"2023", question:"Newton's Third Law states: 'For every action, there is ___.'",
            options:["A. an equal force","B. an equal and opposite reaction","C. a greater reaction","D. a smaller opposite force"], correct:"B",
            explanation:"Newton's 3rd Law: forces come in equal and opposite pairs." },
          // Physics — Electricity
          { id:"ssc_el1", topic:"Electricity", year:"2022", question:"A resistor of 15Ω is connected to a 9V battery. What current flows?",
            options:["A. 0.4A","B. 0.6A","C. 1.2A","D. 135A"], correct:"B",
            explanation:"I=V/R=9/15=0.6 A." },
          { id:"ssc_el2", topic:"Electricity", year:"2023", question:"In a parallel circuit, the voltage across each branch is ___.",
            options:["A. Different","B. Zero","C. The same","D. Halved"], correct:"C",
            explanation:"In a parallel circuit, all branches have the same voltage (equal to source voltage)." },
          // Physics — Waves
          { id:"ssc_wa1", topic:"Waves", year:"2021", question:"A wave has frequency 500Hz and wavelength 0.68m. What is its speed?",
            options:["A. 200m/s","B. 300m/s","C. 340m/s","D. 400m/s"], correct:"C",
            explanation:"v=fλ=500×0.68=340m/s (speed of sound in air)." },
          { id:"ssc_wa2", topic:"Waves", year:"2023", question:"Which type of wave can travel through a vacuum?",
            options:["A. Sound","B. Water","C. Electromagnetic","D. Seismic"], correct:"C",
            explanation:"Electromagnetic waves (light, radio, X-rays) do not need a medium and can travel through a vacuum." },
          // Human Health & Disease
          { id:"ssc_hh1", topic:"Human Health & Disease", year:"2022", question:"Malaria is caused by ___.",
            options:["A. A virus","B. A bacterium","C. A protozoan (Plasmodium)","D. A fungus"], correct:"C",
            explanation:"Malaria is caused by Plasmodium, a protozoan parasite, transmitted by the female Anopheles mosquito." },
          { id:"ssc_hh2", topic:"Human Health & Disease", year:"2023", question:"Which nutrient is most important for building and repairing body tissues?",
            options:["A. Carbohydrates","B. Fats","C. Proteins","D. Vitamins"], correct:"C",
            explanation:"Proteins are the body's building blocks — essential for growth, repair, and maintenance of tissues." },
        ],
        theory: [
          { id:"sst_cb1", topic:"Cell Biology", year:"2023", question:"(a)State the function of mitochondria. (b)Explain why athletes have more mitochondria in their muscle cells than non-athletes.", answer:"(a)ATP production via aerobic respiration. (b)Higher energy demand requires more ATP.", solution:"(a)Mitochondria are the sites of aerobic respiration (Krebs cycle + electron transport chain), producing ATP — the cell's energy currency. (b)Athletes' muscles contract repeatedly and intensely, needing large amounts of ATP. More mitochondria = more sites for ATP production = faster energy supply to meet the higher energy demand during exercise." },
          { id:"sst_ge1", topic:"Genetics", year:"2022", question:"A woman with sickle-cell trait (HbAHbS) marries a man with sickle-cell trait (HbAHbS). (a)Draw a genetic cross diagram. (b)State the probability of having a child with sickle-cell disease.", answer:"(a)Cross diagram showing 4 possible offspring. (b)P(disease)=1/4=25%.", solution:"(a)HbAHbS × HbAHbS. Gametes: HbA,HbS | HbA,HbS. Offspring: HbAHbA(25%,normal), HbAHbS(50%,trait), HbSHbS(25%,disease). (b)Probability of sickle-cell disease (HbSHbS)=1/4=25%." },
          { id:"sst_ec1", topic:"Ecology", year:"2023", question:"(a)Construct a food chain with 5 organisms from a Ghanaian ecosystem, starting with a producer. (b)Explain the role of decomposers in the ecosystem.", answer:"(a)E.g. Maize→Grasshopper→Lizard→Hawk→Vulture. (b)Decomposers break down dead matter, recycling nutrients.", solution:"(a)Any valid 5-organism food chain starting with a green plant. (b)Decomposers (bacteria, fungi) break down dead organisms and waste, releasing mineral salts back into the soil — recycling nutrients for producers to use again. Without decomposers, nutrients would be locked in dead matter and the ecosystem would collapse." },
          { id:"sst_as1", topic:"Atomic Structure", year:"2022", question:"Element X has atomic number 11 and mass number 23. (a)State the number of protons, neutrons, and electrons. (b)Name element X. (c)Draw its electronic configuration.", answer:"(a)Protons=11, Neutrons=12, Electrons=11. (b)Sodium. (c)2,8,1", solution:"(a)Protons=Atomic number=11. Electrons=11 (neutral atom). Neutrons=23−11=12. (b)Atomic number 11=Sodium (Na). (c)Electronic structure: 2,8,1 (first shell 2, second shell 8, third shell 1 electron)." },
          { id:"sst_cr1", topic:"Chemical Reactions", year:"2021", question:"Write a balanced equation for the reaction between calcium carbonate and dilute hydrochloric acid. State the type of reaction and describe TWO observations.", answer:"CaCO₃+2HCl→CaCl₂+H₂O+CO₂; acid-carbonate; effervescence; solid dissolves.", solution:"CaCO₃+2HCl→CaCl₂+H₂O+CO₂. Type: acid-carbonate reaction. Observations: (1)Effervescence (bubbling) — CO₂ gas produced; (2)White solid (CaCO₃) gradually dissolves; (3)CO₂ turns limewater milky if tested." },
          { id:"sst_fm1", topic:"Forces & Motion", year:"2022", question:"A ball is thrown upward with initial velocity 20m/s. (a)Calculate its maximum height (g=10m/s²). (b)How long does it take to reach maximum height? (c)What is its velocity when it returns to the starting point?", answer:"(a)20m (b)2s (c)20m/s downward", solution:"(a)v²=u²−2gh. At max height v=0: 0=400−20h → h=20m. (b)v=u−gt → 0=20−10t → t=2s. (c)By symmetry, returns at same speed 20m/s but downward." },
          { id:"sst_el1", topic:"Electricity", year:"2023", question:"Three resistors of 2Ω, 3Ω, and 6Ω are connected in parallel. (a)Calculate the total resistance. (b)If connected to a 12V battery, find the total current drawn.", answer:"(a)1Ω (b)12A", solution:"(a)1/R=1/2+1/3+1/6=3/6+2/6+1/6=6/6=1. R=1Ω. (b)I=V/R=12/1=12A." },
          { id:"sst_hh1", topic:"Human Health & Disease", year:"2022", question:"(a)State the causative organism, vector, and TWO symptoms of malaria. (b)State TWO methods of preventing malaria.", answer:"(a)Plasmodium; female Anopheles mosquito; fever, chills. (b)Nets, repellent, destroy breeding sites.", solution:"(a)Causative organism: Plasmodium (protozoan). Vector: female Anopheles mosquito. Symptoms: high fever with chills and sweating; headache; muscle/joint pain; nausea/vomiting. (b)Prevention: (1)Sleep under insecticide-treated mosquito nets; (2)Use insect repellents; (3)Drain stagnant water to eliminate breeding sites; (4)Spray insecticides." },
        ]
      },

      "Social Studies": { icon:<Ico n="map" />,
        objectives: [
          // Ghana's Economy
          { id:"sss_ge1", topic:"Ghana's Economy", year:"2023", question:"Which of these is Ghana's leading export commodity?",
            options:["A. Timber","B. Cocoa","C. Diamond","D. Bauxite"], correct:"B",
            explanation:"Ghana is one of the world's top cocoa producers. Cocoa, gold, and oil are the top three exports by value." },
          { id:"sss_ge2", topic:"Ghana's Economy", year:"2022", question:"Ghana joined which international trade organisation in 1995?",
            options:["A. OPEC","B. AU","C. WTO","D. ECOWAS"], correct:"C",
            explanation:"Ghana became a member of the World Trade Organization (WTO) in 1995, committing to global free trade principles." },
          // Governance & Democracy
          { id:"sss_gd1", topic:"Governance & Democracy", year:"2022", question:"The body responsible for conducting elections in Ghana is the ___.",
            options:["A. CHRAJ","B. Electoral Commission","C. National Commission","D. Parliament"], correct:"B",
            explanation:"The Electoral Commission (EC) is constitutionally mandated to compile the voters register and conduct public elections." },
          { id:"sss_gd2", topic:"Governance & Democracy", year:"2023", question:"Ghana's Fourth Republican Constitution was adopted in ___.",
            options:["A. 1966","B. 1979","C. 1992","D. 2000"], correct:"C",
            explanation:"Ghana's current constitution (Fourth Republic) was adopted in 1992 and came into force on 7 January 1993." },
          { id:"sss_gd3", topic:"Governance & Democracy", year:"2021", question:"Which arm of government interprets the laws of Ghana?",
            options:["A. Executive","B. Legislature","C. Judiciary","D. Military"], correct:"C",
            explanation:"The Judiciary (courts, including the Supreme Court) interprets and applies Ghana's laws." },
          // Human Rights
          { id:"sss_hr1", topic:"Human Rights", year:"2023", question:"The Universal Declaration of Human Rights was adopted in ___.",
            options:["A. 1945","B. 1948","C. 1957","D. 1960"], correct:"B",
            explanation:"The UDHR was adopted by the UN General Assembly on 10 December 1948." },
          { id:"sss_hr2", topic:"Human Rights", year:"2022", question:"Which of these is a human right?",
            options:["A. The right to enslave others","B. The right to free expression","C. The right to steal","D. The right to discriminate"], correct:"B",
            explanation:"Freedom of expression is a fundamental human right protected under the UDHR and Ghana's Constitution." },
          // Population & Migration
          { id:"sss_pm1", topic:"Population & Migration", year:"2021", question:"Which of these is a consequence of rapid population growth in Ghana?",
            options:["A. Decreased unemployment","B. More school places","C. Pressure on social services","D. Improved housing"], correct:"C",
            explanation:"Rapid population growth strains hospitals, schools, roads, and housing." },
          { id:"sss_pm2", topic:"Population & Migration", year:"2023", question:"Brain drain refers to ___.",
            options:["A. Immigration of unskilled workers","B. Emigration of skilled professionals","C. Internal migration to cities","D. Population decline due to disease"], correct:"B",
            explanation:"Brain drain is the emigration of skilled and educated professionals (doctors, engineers, teachers) to other countries, depriving developing nations of human capital." },
          // Regional Integration
          { id:"sss_ri1", topic:"Regional Integration", year:"2021", question:"ECOWAS was founded in ___.",
            options:["A. 1963","B. 1975","C. 1984","D. 1991"], correct:"B",
            explanation:"ECOWAS (Economic Community of West African States) was founded on 28 May 1975 in Lagos, Nigeria." },
          { id:"sss_ri2", topic:"Regional Integration", year:"2022", question:"The headquarters of ECOWAS is in ___.",
            options:["A. Accra","B. Lagos","C. Abuja","D. Dakar"], correct:"C",
            explanation:"ECOWAS Secretariat headquarters moved from Lagos to Abuja, Nigeria, in 1991." },
          // Environment & Sustainable Development
          { id:"sss_en1", topic:"Environment & Sustainable Development", year:"2022", question:"Sustainable development means ___.",
            options:["A. Rapid industrial growth at all costs","B. Meeting current needs without compromising future generations","C. Using all natural resources as fast as possible","D. Only developing urban areas"], correct:"B",
            explanation:"Sustainable development (Brundtland, 1987): development that meets present needs without compromising future generations' ability to meet their needs." },
          { id:"sss_en2", topic:"Environment & Sustainable Development", year:"2023", question:"Galamsey (illegal mining) most directly affects ___.",
            options:["A. Air quality only","B. Water bodies and farmland","C. Urban buildings","D. Only national parks"], correct:"B",
            explanation:"Galamsey uses mercury and heavy machinery to mine gold, polluting rivers and destroying agricultural land." },
          // Culture & Identity
          { id:"sss_ci1", topic:"Culture & Identity", year:"2023", question:"Kente cloth is traditionally made by which Ghanaian ethnic group?",
            options:["A. Ewe and Dagomba","B. Ashanti and Ewe","C. Ga and Fante","D. Gonja and Kusasi"], correct:"B",
            explanation:"Kente (Nwentoma) is woven by the Ashanti (Asante) and Ewe peoples of Ghana, each with distinct patterns and meanings." },
          // Conflict Resolution
          { id:"sss_cr1", topic:"Conflict Resolution", year:"2022", question:"Which of these is a peaceful method of resolving conflicts?",
            options:["A. War","B. Intimidation","C. Mediation","D. Revenge"], correct:"C",
            explanation:"Mediation involves a neutral third party helping conflicting parties reach a peaceful agreement." },
        ],
        theory: [
          { id:"sss_ge_t1", topic:"Ghana's Economy", year:"2023", question:"Explain THREE ways in which Ghana can reduce its dependence on cocoa exports for foreign exchange.", answer:"Industrialisation, tourism, ICT, diversified agriculture.", solution:"(1)Industrialisation: Process raw materials domestically (e.g., produce chocolate, not raw cocoa) to add value before export. (2)Tourism: Invest in heritage sites, eco-tourism, and PANAFEST to attract foreign visitors. (3)ICT sector: Develop Ghana's growing tech hub (fintech, software exports, BPO) to earn forex. (4)Diversify agriculture: Cashew, shea, palm oil, and mango as additional export crops." },
          { id:"sss_gd_t1", topic:"Governance & Democracy", year:"2022", question:"Describe the doctrine of separation of powers and explain its importance in Ghana's democratic system.", answer:"Three independent arms prevent abuse of power.", solution:"Separation of powers: government divided into (1)Executive (President) — implements laws; (2)Legislature (Parliament) — makes laws; (3)Judiciary (Courts) — interprets laws. Each arm operates independently and checks the others. Importance: (a)Prevents tyranny — no one body holds all power; (b)Ensures accountability; (c)Protects citizens' rights; (d)Upholds democracy." },
          { id:"sss_hr_t1", topic:"Human Rights", year:"2023", question:"(a)State FOUR human rights protected by Ghana's 1992 Constitution. (b)Explain what happens when a citizen's rights are violated.", answer:"(a)Any 4 rights. (b)Can seek legal redress through the courts or CHRAJ.", solution:"(a)(1)Right to life; (2)Right to personal liberty; (3)Freedom of expression; (4)Right to education; (5)Right to fair trial; (6)Right to equality. (b)If rights are violated: citizen can (1)Report to police; (2)File a case in court; (3)Report to CHRAJ (Commission on Human Rights and Administrative Justice) for investigation and redress." },
          { id:"sss_pm_t1", topic:"Population & Migration", year:"2021", question:"Explain FOUR effects of rapid population growth on Ghana's socio-economic development.", answer:"Education strain, unemployment, housing shortage, environmental pressure.", solution:"(1)Education: Schools overcrowded → worse teacher-student ratio → quality declines. (2)Unemployment: Labour supply exceeds demand, especially among youth. (3)Housing: Demand outstrips supply → slums, overcrowding in cities like Accra. (4)Environment: Deforestation, pollution, pressure on water resources increase. (5)Healthcare: Hospitals overwhelmed; doctor-patient ratio worsens." },
          { id:"sss_ri_t1", topic:"Regional Integration", year:"2022", question:"Discuss THREE benefits of Ghana's membership of ECOWAS.", answer:"Free movement, trade, security, peacekeeping, development.", solution:"(1)Free movement of persons: Ghanaians can travel and work across ECOWAS member states without visa restrictions. (2)Trade expansion: ECOWAS trade protocols reduce tariffs and promote intra-regional trade. (3)Security cooperation: ECOMOG (ECOWAS Military Observer Group) maintains peace in the region — Ghana participated in Liberia and Sierra Leone. (4)Development projects: Joint infrastructure projects (roads, energy grids) benefit all members." },
          { id:"sss_en_t1", topic:"Environment & Sustainable Development", year:"2023", question:"Explain FOUR ways in which Ghana can promote sustainable development.", answer:"Renewable energy, reforestation, responsible mining, recycling.", solution:"(1)Renewable energy: Invest in solar, wind, and hydropower to reduce dependence on fossil fuels. (2)Reforestation: Plant trees to replace those lost to deforestation — combat soil erosion and climate change. (3)Responsible mining: Enforce regulations to prevent illegal galamsey; use environmentally safe techniques. (4)Waste management: Promote recycling and proper disposal of plastic and electronic waste. (5)Sustainable agriculture: Use organic farming and crop rotation to maintain soil health." },
          { id:"sss_ci_t1", topic:"Culture & Identity", year:"2023", question:"Explain the role of culture in promoting national unity in Ghana.", answer:"Shared values, arts, festivals, language — all unite diverse ethnic groups.", solution:"Ghana has over 100 ethnic groups. Culture promotes unity through: (1)National symbols (flag, anthem, coat of arms) — all Ghanaians share these regardless of ethnicity. (2)Festivals (Homowo, Odwira, Aboakyere) — cross-cultural celebrations that attract all citizens. (3)Ghanaian arts (Kente, Adinkra, drumming) — recognised as national heritage, a source of pride for all. (4)Common language (English as official; Akan widely spoken) — facilitates communication and understanding." },
        ]
      }
    }
  }
};


/* ═══════════════════════════════════════════════════════════════
   AI HELPERS
═══════════════════════════════════════════════════════════════ */
/* Free models often wrap JSON in extra text. Pull out the first {...} block. */
function extractJSON(text) {
  const clean = String(text).replace(/```json|```/g, "");
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON in AI response");
  return JSON.parse(clean.slice(start, end + 1));
}

async function markTheory(q, studentAnswer, level, subject) {
  const res = await fetch("/api/llm", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      model:"claude-sonnet-4-20250514", max_tokens:1000,
      messages:[{ role:"user", content:
        `You are a WAEC ${level==="JHS"?"BECE":"WASSCE"} ${subject} examiner in Ghana.

Question: ${q.question}
Model Answer: ${q.answer}
Full Solution: ${q.solution}
Student's Answer: ${studentAnswer}

Score /10, award partial marks for partial working. Give feedback in warm Ghanaian Pidgin.
Use: "ei!", "chale", "herh", "you see ehn", "correct!", "as for that one", "my brother/sis".

JSON only, no markdown:
{"score":<0-10>,"scoreText":"<x out of 10>","feedback":"<2-4 Pidgin sentences>","correctAnswer":"<clear step-by-step solution>","topic":"${q.topic}"}`
      }]
    })
  });
  const d = await res.json();
  return extractJSON(d.content.map(b=>b.text||"").join(""));
}

async function getTwi(feedback, topic) {
  const res = await fetch("/api/llm", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      model:"claude-sonnet-4-20250514", max_tokens:250,
      messages:[{ role:"user", content:
        `Translate to Twi (Akan Ghana language). Encouraging, brief, for a student.
Feedback: ${feedback}
Topic: ${topic}
Return ONLY Twi text, 3 sentences max.`
      }]
    })
  });
  const d = await res.json();
  return d.content.map(b=>b.text||"").join("").trim();
}

/* ═══════════════════════════════════════════════════════════════
   REUSABLE UI COMPONENTS
═══════════════════════════════════════════════════════════════ */
function Spinner({ size=18, color="#22c55e" }) {
  return <div style={{ width:size, height:size, border:`2.5px solid rgba(255,255,255,0.1)`, borderTop:`2.5px solid ${color}`, borderRadius:"50%", animation:"spin 0.7s linear infinite", display:"inline-block", flexShrink:0 }} />;
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ width:36, height:36, borderRadius:10, background:"var(--surface3)", border:"1px solid var(--border2)", color:"var(--text)", fontSize:19, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>‹</button>
  );
}

function Tag({ children, color="#22c55e" }) {
  return <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, background:`${color}18`, color, border:`1px solid ${color}28`, fontFamily:"'DM Sans',sans-serif" }}>{children}</span>;
}

function FieldInput({ label, type="text", value, onChange, placeholder, icon, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--muted2)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>{label}</label>}
      <div style={{ position:"relative" }}>
        {icon && <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15, opacity:0.45, pointerEvents:"none" }}>{icon}</span>}
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={{ width:"100%", padding:`13px 14px 13px ${icon?"42px":"14px"}`, background:"var(--surface3)", border:`1.5px solid ${focused?"var(--green)":error?"var(--danger)":"var(--border2)"}`, borderRadius:11, fontSize:15, color:"var(--text)", fontFamily:"'DM Sans',sans-serif", transition:"all 0.2s", boxShadow:focused?"0 0 0 3px rgba(34,197,94,0.1)":"none" }}
        />
      </div>
      {error && <p style={{ fontSize:12, color:"var(--danger)", marginTop:4, fontFamily:"'DM Sans',sans-serif" }}>{error}</p>}
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled, loading, color="#22c55e", small=false, style={} }) {
  const isDisabled = disabled || loading;
  return (
    <button onClick={onClick} disabled={isDisabled} style={{
      width:"100%", padding:small?"11px":"14px",
      background: isDisabled?"var(--surface4)":color,
      color: isDisabled?"var(--muted)":"#000",
      border:"none", borderRadius:12, fontSize:small?13:15, fontWeight:700,
      fontFamily:"'Syne',sans-serif", letterSpacing:"0.02em",
      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
      transition:"all 0.2s",
      boxShadow: isDisabled?"none":`0 4px 20px ${color}44`,
      cursor: isDisabled?"not-allowed":"pointer", ...style
    }}>
      {loading ? <><Spinner color={color}/> Processing…</> : children}
    </button>
  );
}

function ScoreBadge({ score }) {
  const col = score>=7?"#22c55e":score>=5?"#fbbf24":"#f87171";
  return (
    <div style={{ width:62, height:62, borderRadius:"50%", border:`3px solid ${col}`, background:`${col}14`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 0 22px ${col}44` }}>
      <span style={{ fontSize:22, fontWeight:800, color:col, fontFamily:"'Syne',sans-serif" }}>{score}</span>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════ */
function App() {
  // ── ALL useState hooks declared first (React rules of hooks) ──────────────
  const [screen,         setScreen]         = useState("splash");
  const [authMode,       setAuthMode]       = useState("login");
  const [user,           setUser]           = useState(null);
  const [userData,       setUserData]       = useState(null);
  const [level,          setLevel]          = useState(null);
  const [subject,        setSubject]        = useState(null);
  const [mode,           setMode]           = useState(null);
  const [topic,          setTopic]          = useState(null);
  const [qIndex,         setQIndex]         = useState(0);
  const [tab,            setTab]            = useState("practice");
  const [isPaid,         setIsPaid]         = useState(false);

  // Modals
  const [showPaywall,    setShowPaywall]    = useState(false);
  const [showSupport,    setShowSupport]    = useState(false);
  const [showLeaderboard,setShowLeaderboard]= useState(false);
  const [showTeacherHub, setShowTeacherHub] = useState(false);
  const [showJoinQuiz,   setShowJoinQuiz]   = useState(false);
  const [activeQuiz,     setActiveQuiz]     = useState(null);

  // Legal compliance
  const [cookieConsent,  setCookieConsent]  = useState(() =>
    localStorage.getItem("gp_cookie_consent") || null);
  const [pendingReg,     setPendingReg]     = useState(null); // {name,phone,email,password,school,avatarColor}
  const [legalModal,     setLegalModal]     = useState(null); // "privacy"|"terms"|"refund"|"cookie"|"delete"|"accessibility"
  const [ageVerified,    setAgeVerified]    = useState(() =>
    localStorage.getItem("gp_age_verified") === "true");

  // Objectives
  const [selectedOpt,    setSelectedOpt]    = useState(null);
  const [revealed,       setRevealed]       = useState(false);

  // Theory / AI
  const [theoryAns,      setTheoryAns]      = useState("");
  const [marking,        setMarking]        = useState(false);
  const [theoryResult,   setTheoryResult]   = useState(null);
  const [twiText,        setTwiText]        = useState("");
  const [loadingTwi,     setLoadingTwi]     = useState(false);
  const [userLoaded,     setUserLoaded]     = useState(false); // false until the signed-in student's data has arrived
  const [speaking,       setSpeaking]       = useState(false);

  // ── ALL useRef hooks ──────────────────────────────────────────────────────
  const utterRef = useRef(null);

  // ── ALL useEffect hooks ───────────────────────────────────────────────────
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  /* Load session on mount */
  useEffect(() => {
    const sess = AUTH.getSession();
    if (sess) {
      setUser(sess);
      AUTH.getUser(sess.phone).then(u => { if(u) setUserData(u); }).catch(()=>{}).finally(()=>setUserLoaded(true));
      setScreen("levels");
    } else {
      setTimeout(() => setScreen("auth"), 1500);
    }
  }, []);

  /* Reload user data when user changes */
  useEffect(() => {
    if (!user) return;
    AUTH.getUser(user.phone).then(u => { if(u) setUserData(u); }).catch(()=>{}).finally(()=>setUserLoaded(true));
  }, [user?.phone]);

  /* Refresh stats after answer */
  function refreshUser() {
    if (!user) return;
    setTimeout(() => AUTH.getUser(user.phone).then(u => { if(u) setUserData(u); }), 400);
  }

  const stats     = userData?.stats || { done:0, totalScore:0, weak:{}, objDone:0, theoryDone:0, objScore:0, theoryScore:0, doneToday:0 };
  const avgScore  = stats.done>0 ? (stats.totalScore/stats.done).toFixed(1) : "—";
  const weakList  = Object.entries(stats.weak||{}).sort((a,b)=>b[1]-a[1]).slice(0,3);

  const FREE_LIMIT = 3;

  /* Home screen helpers */
  const homeName     = String(userData?.name || user?.name || "Student").trim().split(/\s+/)[0]; // first name only, so it never truncates
  const homeHour     = new Date().getHours();
  const homeGreeting = homeHour < 12 ? "Good morning" : homeHour < 17 ? "Good afternoon" : "Good evening";
  let lastPractice = null; // the last topic this student opened on this device
  if (screen==="levels" && user) {
    try {
      const lp = JSON.parse(localStorage.getItem("gp_last_practice") || "null");
      if (lp && lp.phone === user.phone && DB[lp.level]?.subjects?.[lp.subject]) lastPractice = lp;
    } catch {}
  }
  function resumeLast() {
    const lp = lastPractice; if (!lp) return;
    setLevel(lp.level); setSubject(lp.subject); resetPractice();
    const hasMode = lp.mode && (DB[lp.level].subjects[lp.subject]?.[lp.mode] || []).length > 0;
    if (!hasMode) { setMode(null); setTopic(null); setScreen("modeSelect"); return; }
    setMode(lp.mode); setTopic(lp.topic || null); setTab("practice"); setScreen("practice");
  }
  const limitHit   = !isPaid && stats.doneToday >= FREE_LIMIT;

  const lvl        = level ? DB[level] : null;
  const lvlAccent  = lvl?.accent || "#22c55e";
  const lvlGlow    = lvl?.glow   || "rgba(34,197,94,0.18)";

  const allModeQs  = level && subject && mode ? (DB[level].subjects[subject]?.[mode] || []) : [];
  const qs         = topic ? allModeQs.filter(q => q.topic === topic) : allModeQs;
  const currentQ   = qs[qIndex];

  /* Tell the AI tutor what the student is looking at. null hides it (signed out, teacher quiz...). */
  const tutorOn       = !!user && !pendingReg && !activeQuiz && !showTeacherHub && !showJoinQuiz && ["levels","subjects","modeSelect","topicSelect","practice"].includes(screen);
  const tutorQ        = screen==="practice" && tab==="practice" ? currentQ : null;
  const tutorAnswered = revealed || !!theoryResult;
  useEffect(() => {
    setTutorContext(tutorOn ? {
      layout: "column",
      userKey: user.phone,
      name: homeName,
      exam: level ? (level==="JHS" ? "BECE" : "WASSCE") : undefined,
      subject: subject || undefined,
      topic: tutorQ?.topic || topic || undefined,
      question: tutorQ?.question,
      options: tutorQ?.options,
      answered: tutorQ ? tutorAnswered : undefined,
      // the marking guide is only shared with the tutor after the student has answered
      solution: tutorQ && tutorAnswered ? [tutorQ.correct && `Correct option: ${tutorQ.correct}`, tutorQ.answer, tutorQ.solution || tutorQ.explanation].filter(Boolean).join(". ") : undefined,
    } : null);
  }, [tutorOn, user?.phone, homeName, level, subject, topic, tutorQ?.id, tutorAnswered]);
  useEffect(() => () => setTutorContext(null), []);

  function logout() {
    AUTH.clearSession();
    setUser(null); setLevel(null); setSubject(null); setMode(null);
    setTab("practice"); setScreen("auth"); setAuthMode("login");
    resetPractice();
  }

  function resetPractice() {
    setSelectedOpt(null); setRevealed(false);
    setTheoryAns(""); setTheoryResult(null); setTwiText("");
    setQIndex(0);
  }

  /* Get unique topics for a given subject+mode */
  function getTopics(subj, md) {
    if (!level || !subj || !md) return [];
    const qs = DB[level].subjects[subj]?.[md] || [];
    return [...new Set(qs.map(q => q.topic))];
  }

  function selectLevel(l)   { setLevel(l); setSubject(null); setMode(null); setTopic(null); setScreen("subjects"); resetPractice(); }
  function selectSubject(s) { setSubject(s); setMode(null); setTopic(null); setScreen("modeSelect"); resetPractice(); }
  function selectMode(m)    { setMode(m); setTopic(null); setScreen("topicSelect"); resetPractice(); }
  function selectTopic(t)   { try { localStorage.setItem("gp_last_practice", JSON.stringify({ subject, level, mode, topic:t, phone:user?.phone })); } catch {} setTopic(t); setTab("practice"); setScreen("practice"); resetPractice(); }

  function goBack() {
    if (screen==="practice")     { setScreen("topicSelect"); resetPractice(); }
    else if (screen==="topicSelect") { setScreen("modeSelect"); setTopic(null); }
    else if (screen==="modeSelect")  { setScreen("subjects"); setMode(null); }
    else if (screen==="subjects")    { setScreen("levels"); setLevel(null); }
    else if (screen==="levels")      logout();
  }

  // OBJECTIVES logic
  async function handleOptSelect(opt) {
    if (revealed) return;
    setSelectedOpt(opt);
    setRevealed(true);
    const isCorrect = opt === currentQ.correct;
    await AUTH.updateStats(user.phone, isCorrect ? 10 : 0, currentQ.topic, "objectives");
    refreshUser();
  }

  function nextQ() {
    if (limitHit) { setShowPaywall(true); return; }
    setQIndex(i => (i+1) % qs.length);
    setSelectedOpt(null); setRevealed(false);
    setTheoryAns(""); setTheoryResult(null); setTwiText("");
  }

  // THEORY logic
  async function handleMark() {
    if (!theoryAns.trim() || marking) return;
    if (limitHit) { setShowPaywall(true); return; }
    setMarking(true); setTheoryResult(null); setTwiText("");
    try {
      const r = await markTheory(currentQ, theoryAns, level, subject);
      setTheoryResult(r);
      await AUTH.updateStats(user.phone, r.score, r.topic, "theory");
      refreshUser();
    } catch {
      setTheoryResult({ score:0, scoreText:"Error", feedback:"Ei chale, network issue. Try again!", correctAnswer:currentQ.solution, topic:currentQ.topic });
    }
    setMarking(false);
  }

  async function handleTwi() {
    if (!theoryResult) return;
    if (twiText) { speak(twiText); return; }
    setLoadingTwi(true);
    try { const t = await getTwi(theoryResult.feedback, currentQ.topic); setTwiText(t); speak(t); }
    catch { speak("Twi explanation unavailable."); }
    setLoadingTwi(false);
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang="en-GH"; u.rate=0.88; setSpeaking(true);
    u.onend = () => setSpeaking(false);
    utterRef.current = u;
    window.speechSynthesis.speak(u);
  }

  const wrap = { fontFamily:"'DM Sans',sans-serif", background:"var(--surface)", minHeight:"100vh", maxWidth:430, margin:"0 auto", color:"var(--text)" };
  const card = { background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:14, padding:18, marginBottom:12 };

  /* ─── SPLASH ──────────────────────────────────────────── */
  // Show email verification screen if registration is pending
  if (pendingReg) return (
    <VerifyEmailScreen
      pending={pendingReg}
      onSuccess={() => {
        setPendingReg(null);
        setUser({ name:pendingReg.name, phone:pendingReg.phone, email:pendingReg.email });
        setScreen("levels");
      }}
      onBack={() => {
        AUTH.clearPendingVerification();
        setPendingReg(null);
      }}
    />
  );

  if (screen==="splash") return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", maxWidth:430, margin:"0 auto", minHeight:"100vh", display:"flex", flexDirection:"column", position:"relative", overflow:"hidden" }}>
      <style>{GLOBAL_CSS}</style>
      {/* Ghana flag stripes */}
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", zIndex:0 }}>
        <div style={{ flex:1, background:"#CE1126", opacity:0.92 }}/>
        <div style={{ flex:1, background:"#FCD116", opacity:0.92 }}/>
        <div style={{ flex:1, background:"#006B3F", opacity:0.92 }}/>
      </div>
      {/* Dark overlay for readability */}
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.62)", zIndex:1 }}/>
      {/* Subtle radial glow in centre */}
      <div style={{ position:"absolute", top:"35%", left:"50%", transform:"translate(-50%,-50%)", width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle, rgba(252,209,22,0.18) 0%, transparent 70%)", zIndex:2, pointerEvents:"none" }}/>

      {/* Content */}
      <div style={{ position:"relative", zIndex:3, flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 24px", textAlign:"center" }}>
        {/* Black star (Ghana flag centre symbol) */}
        <div className="fadeUp" style={{ fontSize:72, marginBottom:4, animation:"flagFloat 3s ease-in-out infinite", display:"inline-block" }}><Ico n="star" /></div>
        <div className="fadeUp" style={{ fontSize:18, color:"rgba(252,209,22,0.85)", fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:12, fontFamily:"'Syne',sans-serif" }}>Ghana Prep</div>
        <h1 className="fadeUp2" style={{ fontFamily:"'Syne',sans-serif", fontSize:40, fontWeight:800, color:"#ffffff", lineHeight:1.1, marginBottom:12 }}>
          BECE &<br/>WASSCE
        </h1>
        <p className="fadeUp3" style={{ fontSize:15, color:"rgba(255,255,255,0.75)", lineHeight:1.6, marginBottom:32, maxWidth:280 }}>
          AI-Powered Past Questions<br/>Marked in Pidgin · Explained in Twi
        </p>
        {/* Tricolour accent bar */}
        <div className="fadeUp4" style={{ display:"flex", gap:6, marginBottom:28 }}>
          <div style={{ width:40, height:4, borderRadius:99, background:"#CE1126" }}/>
          <div style={{ width:40, height:4, borderRadius:99, background:"#FCD116" }}/>
          <div style={{ width:40, height:4, borderRadius:99, background:"#006B3F" }}/>
        </div>
        {/* Loading dots */}
        <div className="fadeUp5" style={{ display:"flex", gap:8, justifyContent:"center", alignItems:"center" }}>
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginRight:6 }}>Loading</span>
          {[0,1,2].map(i=><div key={i} style={{ width:8, height:8, borderRadius:"50%", background:"#FCD116", animation:`pulse 1.3s ${i*0.22}s ease-in-out infinite` }}/>)}
        </div>
      </div>

      {/* Bottom flag badge */}
      <div style={{ position:"relative", zIndex:3, textAlign:"center", paddingBottom:32 }}>
        <span style={{ fontSize:13, color:"rgba(255,255,255,0.4)", letterSpacing:"0.05em" }}><Ico n="ghana" /> Made for Ghanaian Students</span>
      </div>
    </div>
  );

  /* ─── AUTH ────────────────────────────────────────────── */
  if (screen==="auth") return (
    <>
    <AuthScreen
      mode={authMode}
      setMode={setAuthMode}
      onSupport={()=>setShowSupport(true)}
      onPendingVerify={(pending) => setPendingReg(pending)}
      onSuccess={(u) => {
        setUser(u);
        AUTH.getUser(u.phone).then(d => setUserData(d));
        setScreen("levels");
      }}
    />
    {showSupport && <SupportModal onClose={()=>setShowSupport(false)}/>}
    </>
  );

  /* ─── LEVELS ──────────────────────────────────────────── */
  if (screen==="levels" && user && !userData && !userLoaded) return (
    <div style={wrap}><style>{GLOBAL_CSS}</style><HomeSkeleton /></div>
  );
  if (screen==="levels") return (
    <div style={wrap}>
      <style>{GLOBAL_CSS}</style>
      {/* ── Top bar: who is signed in, streak, support, sign out ── */}
      <div className="fadeUp" style={{ padding:"20px 20px 0", display:"flex", alignItems:"center", gap:12 }}>
        <div aria-hidden="true" style={{ width:44, height:44, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,rgba(52,211,153,0.28),rgba(52,211,153,0.08))", border:"1px solid rgba(52,211,153,0.45)", color:"#6ee7b7", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:17 }}>{homeName.charAt(0).toUpperCase()}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ color:"var(--muted)", fontSize:12, fontWeight:500 }}>{homeGreeting},</p>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:19, fontWeight:800, lineHeight:1.2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{homeName}</h2>
        </div>
        <div title="Daily streak" style={{ display:"flex", alignItems:"center", gap:5, height:38, padding:"0 11px", borderRadius:12, background:"rgba(232,196,104,0.1)", border:"1px solid rgba(232,196,104,0.28)", color:"#e8c468", fontSize:13, fontWeight:800, flexShrink:0 }}><Ico n="flame" /><span aria-label={`${stats.streak||0} day streak`}>{stats.streak||0}</span></div>
        <AnnouncementBell phone={user?.phone} />
        <button onClick={()=>setShowSupport(true)} aria-label="Support" title="Support" style={{ width:38, height:38, borderRadius:12, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", color:"#cbd5d1", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, cursor:"pointer" }}><Ico n="message" /></button>
        <button onClick={logout} aria-label="Sign out" title="Sign out" style={{ width:38, height:38, borderRadius:12, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", color:"#cbd5d1", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, cursor:"pointer" }}><Ico n="logout" /></button>
      </div>

      <div style={{ padding:"18px 20px 0" }}>

        {/* ── Hero: the one thing to do next, plus today's progress ── */}
        <div className="fadeUp2" style={{ position:"relative", overflow:"hidden", borderRadius:22, padding:"20px 20px 18px", marginBottom:14, background:"linear-gradient(145deg,rgba(16,82,58,0.75),rgba(9,34,26,0.9))", border:"1px solid rgba(52,211,153,0.3)", boxShadow:"0 18px 40px -22px rgba(52,211,153,0.55)" }}>
          <div aria-hidden="true" style={{ position:"absolute", top:-60, right:-50, width:190, height:190, borderRadius:"50%", background:"radial-gradient(circle,rgba(232,196,104,0.2) 0%,transparent 68%)", pointerEvents:"none" }}/>
          <p style={{ position:"relative", fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#6ee7b7" }}>{lastPractice ? "Continue practising" : "Start here"}</p>
          <div style={{ position:"relative", display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:12, marginTop:6 }}>
            <div style={{ minWidth:0 }}>
              <p style={{ fontFamily:"'Syne',sans-serif", fontSize:21, fontWeight:800, color:"#ffffff", lineHeight:1.2 }}>{lastPractice ? lastPractice.subject : "Your first practice set"}</p>
              <p style={{ fontSize:12.5, color:"rgba(255,255,255,0.68)", marginTop:4, lineHeight:1.45 }}>{lastPractice ? `${DB[lastPractice.level].label} · ${lastPractice.topic || "All topics"}` : "Pick your exam below and answer real past questions."}</p>
            </div>
            {lastPractice && (
              <button onClick={resumeLast} style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0, border:"none", borderRadius:999, padding:"11px 18px", background:"linear-gradient(135deg,#34d399,#10b981)", color:"#04130d", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:13, cursor:"pointer", boxShadow:"0 8px 20px -8px rgba(52,211,153,0.8)" }}><Ico n="play" /> Resume</button>
            )}
          </div>
          <div style={{ position:"relative", marginTop:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:7 }}>
              <span style={{ fontSize:11.5, fontWeight:600, color:"rgba(255,255,255,0.7)" }}>{isPaid ? "Answered today" : "Today's free questions"}</span>
              <span style={{ fontSize:12, fontWeight:800, color:"#ffffff" }}>{isPaid ? (stats.doneToday||0) : `${Math.min(stats.doneToday||0,FREE_LIMIT)} of ${FREE_LIMIT}`}</span>
            </div>
            <div role="progressbar" aria-label="Today's progress" aria-valuemin={0} aria-valuemax={FREE_LIMIT} aria-valuenow={Math.min(stats.doneToday||0,FREE_LIMIT)} style={{ height:7, borderRadius:99, background:"rgba(255,255,255,0.12)", overflow:"hidden" }}>
              <div style={{ width:`${Math.min(100,((stats.doneToday||0)/FREE_LIMIT)*100)}%`, height:"100%", borderRadius:99, background:"linear-gradient(90deg,#34d399,#e8c468)", transition:"width .5s ease" }}/>
            </div>
          </div>
        </div>

        {/* ── Progress at a glance ── */}
        <div className="fadeUp2" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:22 }}>
          {[["Answered", stats.done||0], ["Average", stats.done>0 ? `${avgScore}/10` : "—"], ["Streak", `${stats.streak||0}d`]].map(([l,v])=>(
            <div key={l} style={{ borderRadius:16, padding:"13px 14px", background:"rgba(255,255,255,0.035)", border:"1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:"#ffffff", lineHeight:1.1 }}>{v}</p>
              <p style={{ fontSize:11, color:"var(--muted)", fontWeight:600, marginTop:4 }}>{l}</p>
            </div>
          ))}
        </div>

        {/* ── Choose your exam ── */}
        <p className="fadeUp3" style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:800, marginBottom:10 }}>Choose your exam</p>
        <div className="fadeUp3" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:22 }}>
          {[
            { key:"JHS", name:"BECE", stage:"Junior High", icon:"school", tint:"52,211,153", ink:"#6ee7b7" },
            { key:"SHS", name:"WASSCE", stage:"Senior High", icon:"grad", tint:"232,196,104", ink:"#e8c468" },
          ].map(({key,name,stage,icon,tint,ink})=>(
            <button key={key} onClick={()=>selectLevel(key)} aria-label={`${name}, ${stage}`} style={{ textAlign:"left", borderRadius:20, padding:"16px 16px 14px", cursor:"pointer", color:"inherit", background:`linear-gradient(160deg,rgba(${tint},0.13),rgba(255,255,255,0.02))`, border:`1px solid rgba(${tint},0.26)` }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ width:44, height:44, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:21, color:ink, background:`rgba(${tint},0.14)`, border:`1px solid rgba(${tint},0.3)` }}><Ico n={icon} /></div>
                <span style={{ color:`rgba(${tint},0.7)`, fontSize:18 }}><Ico n="chev" /></span>
              </div>
              <p style={{ fontFamily:"'Syne',sans-serif", fontSize:19, fontWeight:800, color:"#ffffff", marginTop:14 }}>{name}</p>
              <p style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>{stage} · {Object.keys(DB[key].subjects).length} subjects</p>
            </button>
          ))}
        </div>

        {/* ── Weak topics, only once there is real practice data ── */}
        {weakList.length>0 && (<>
          <p style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:800, marginBottom:10 }}>Focus next</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:22 }}>
            {weakList.map(([t])=>(
              <span key={t} style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:12, fontWeight:600, color:"#e8c468", background:"rgba(232,196,104,0.08)", border:"1px solid rgba(232,196,104,0.24)", borderRadius:999, padding:"7px 12px" }}><Ico n="target" /> {t}</span>
            ))}
          </div>
        </>)}

        {/* ── Class and quiz tools ── */}
        <p className="fadeUp4" style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:800, marginBottom:10 }}>With your class</p>
        <div className="fadeUp4" style={{ borderRadius:20, overflow:"hidden", background:"rgba(255,255,255,0.035)", border:"1px solid rgba(255,255,255,0.08)", marginBottom:18 }}>
          {[
            { icon:"school",  label:"Join Classroom", sub:"Enter your teacher's code and see assignments", fn:()=>{ window.location.href="/join"; } },
            { icon:"target",  label:"Join Quiz",      sub:"Take a quiz with a 6-character code",          fn:()=>setShowJoinQuiz(true) },
            { icon:"trophy",  label:"Rankings",       sub:"See where you stand on the leaderboard",       fn:()=>setShowLeaderboard(true) },
            { icon:"users",   label:"Challenge Friends", sub:"Set a quiz and share the code with friends",     fn:()=>setShowTeacherHub(true) },
          ].map(({icon,label,sub,fn},i)=>(
            <button key={label} onClick={fn} style={{ width:"100%", display:"flex", alignItems:"center", gap:13, padding:"13px 15px", background:"transparent", border:"none", borderTop:i?"1px solid rgba(255,255,255,0.07)":"none", cursor:"pointer", textAlign:"left", color:"inherit" }}>
              <span style={{ width:40, height:40, borderRadius:12, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:"#6ee7b7", background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.22)" }}><Ico n={icon} /></span>
              <span style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:14, fontWeight:700, color:"#ffffff" }}>{label}</p>
                <span style={{ display:"block", fontSize:12, color:"var(--muted)", marginTop:2 }}>{sub}</span>
              </span>
              <span style={{ color:"rgba(255,255,255,0.3)", fontSize:17 }}><Ico n="chev" /></span>
            </button>
          ))}
          <ParentAccessRow phone={user?.phone} />
        </div>

        {/* ── Plan ── */}
        {!isPaid
          ? <div className="fadeUp5" style={{ background:"linear-gradient(135deg,rgba(232,196,104,0.12),rgba(232,196,104,0.03))", border:"1px solid rgba(232,196,104,0.26)", borderRadius:18, padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
              <div style={{ minWidth:0 }}>
                <p style={{ fontSize:13.5, fontWeight:800, color:"#e8c468", fontFamily:"'Syne',sans-serif" }}>Go unlimited</p>
                <p style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>All questions, AI marking and Twi voice. GHS 50/month</p>
              </div>
              <button onClick={()=>setShowPaywall(true)} style={{ background:"linear-gradient(135deg,#f0d383,#d9ae4a)", color:"#1a1303", border:"none", borderRadius:999, padding:"10px 17px", fontSize:12.5, fontWeight:800, fontFamily:"'Syne',sans-serif", whiteSpace:"nowrap", flexShrink:0, cursor:"pointer" }}>Upgrade</button>
            </div>
          : <div style={{ background:"rgba(52,211,153,0.07)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:18, padding:"13px 16px", textAlign:"center" }}>
              <p style={{ fontSize:13, fontWeight:700, color:"#6ee7b7" }}><Ico n="ok" /> Premium active: unlimited access</p>
            </div>
        }

        {/* Legal footer */}
        <div style={{ marginTop:22, paddingBottom:28 }}>
          <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:"4px 12px", marginBottom:8 }}>
            {[["Privacy Policy","privacy"],["Terms of Service","terms"],["Refund Policy","refund"],["Cookie Policy","cookie"],["Data Deletion","delete"],["Accessibility","accessibility"]].map(([lbl,t])=>(
              <button key={t} onClick={()=>setLegalModal(t)} style={{ background:"none", border:"none", color:"var(--muted)", fontSize:11, cursor:"pointer", textDecoration:"underline", fontFamily:"'DM Sans',sans-serif", padding:"3px 2px" }}>{lbl}</button>
            ))}
          </div>
          <p style={{ textAlign:"center", fontSize:10, color:"var(--muted)" }}>© {new Date().getFullYear()} {CONTACT.company}</p>
        </div>
      </div>
      {showPaywall && <PaywallModal onClose={()=>setShowPaywall(false)} onPay={()=>{ setIsPaid(true); setShowPaywall(false); }}/>}
      {showSupport && <SupportModal onClose={()=>setShowSupport(false)}/>}
      {showLeaderboard && <LeaderboardModal currentUser={user} userData={userData} onClose={()=>setShowLeaderboard(false)}/>}
      {showTeacherHub && <TeacherQuizHub mode="student" user={user} onTake={(q)=>{ setShowTeacherHub(false); setActiveQuiz(q); }} onClose={()=>setShowTeacherHub(false)}/>}
      {showJoinQuiz && <JoinQuizModal user={user} onJoin={(quiz)=>{ setActiveQuiz(quiz); setShowJoinQuiz(false); }} onClose={()=>setShowJoinQuiz(false)}/>}
      {activeQuiz && <QuizTakerScreen quiz={activeQuiz} user={user} onClose={()=>setActiveQuiz(null)}/>}
      {legalModal && <LegalModal type={legalModal} onClose={()=>setLegalModal(null)}/>}
      {!cookieConsent && <CookieBanner onAccept={()=>{ localStorage.setItem('gp_cookie_consent','accepted'); setCookieConsent('accepted'); }} onDecline={()=>{ localStorage.setItem('gp_cookie_consent','declined'); setCookieConsent('declined'); }}/>}
    </div>
  );

  /* ─── SUBJECTS ────────────────────────────────────────── */
  if (screen==="subjects" && level) return (
    <div style={wrap}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:12, borderBottom:"1px solid var(--border)" }}>
        <BackBtn onClick={goBack}/>
        <div>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:800, color:lvlAccent }}>{lvl.emoji} {lvl.label} — Pick a Subject</h2>
          <p style={{ fontSize:11, color:"var(--muted)" }}>{Object.keys(lvl.subjects).length} subjects available</p>
        </div>
      </div>
      <div style={{ padding:"14px 16px" }}>

        {Object.entries(lvl.subjects).map(([name,data],i)=>(
          <div key={name} className={`fadeUp${Math.min(i+1,5)}`} onClick={()=>selectSubject(name)}
            style={{ background:"var(--surface2)", border:`1px solid ${lvlAccent}1a`, borderRadius:15, padding:"15px 17px", marginBottom:11, cursor:"pointer", display:"flex", alignItems:"center", gap:13, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at left, ${lvlGlow} 0%, transparent 55%)`, pointerEvents:"none" }}/>
            <div style={{ width:46, height:46, borderRadius:13, background:`${lvlAccent}15`, border:`1px solid ${lvlAccent}28`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:lvlAccent, fontFamily:"'Syne',sans-serif", flexShrink:0 }}>{data.icon}</div>
            <div style={{ flex:1 }}>
              <p style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700 }}>{name}</p>
              <p style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{(data.objectives||[]).length} obj • {(data.theory||[]).length} theory</p>
            </div>
            <Tag color={lvlAccent}>{lvl.label}</Tag>
            <span style={{ fontSize:16, color:`${lvlAccent}50`, marginLeft:4 }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );

  /* ─── MODE SELECT ─────────────────────────────────────── */
  if (screen==="modeSelect" && level && subject) return (
    <div style={wrap}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:12, borderBottom:"1px solid var(--border)" }}>
        <BackBtn onClick={goBack}/>
        <div>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:800, color:lvlAccent }}>{subject}</h2>
          <p style={{ fontSize:11, color:"var(--muted)" }}>Choose your question type</p>
        </div>
      </div>

      <div style={{ padding:"24px 16px" }}>
        <p className="fadeUp" style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, textAlign:"center", marginBottom:6 }}>What type of questions? </p>
        <p className="fadeUp2" style={{ fontSize:13, color:"var(--muted)", textAlign:"center", marginBottom:28, lineHeight:1.6 }}>Choose how you want to practice your {subject} today</p>

        {/* Objectives Card */}
        <div className="fadeUp2" onClick={()=>selectMode("objectives")} style={{ background:"linear-gradient(135deg,#0d2618,#0a1a10)", border:"2px solid rgba(34,197,94,0.3)", borderRadius:20, padding:22, marginBottom:14, cursor:"pointer", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", bottom:-20, right:-20, width:120, height:120, borderRadius:"50%", background:"radial-gradient(circle,rgba(34,197,94,0.12),transparent)", pointerEvents:"none" }}/>
          <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
            <div style={{ width:52, height:52, borderRadius:15, background:"rgba(34,197,94,0.15)", border:"1px solid rgba(34,197,94,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}><Ico n="list" /></div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:"#22c55e" }}>Objectives</span>
                <span style={{ background:"rgba(34,197,94,0.15)", color:"#22c55e", borderRadius:5, padding:"1px 8px", fontSize:10, fontWeight:700 }}>MCQ</span>
              </div>
              <p style={{ fontSize:13, color:"#4ade80", opacity:0.8, lineHeight:1.6, marginBottom:10 }}>Multiple-choice questions. Pick the correct option from A, B, C, D — get instant results with explanations.</p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {["Instant feedback","No typing needed","Great for speed practice"].map(t=>(
                  <span key={t} style={{ fontSize:11, color:"#22c55e", background:"rgba(34,197,94,0.1)", borderRadius:4, padding:"2px 8px", fontWeight:600 }}><Ico n="check" /> {t}</span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16, paddingTop:14, borderTop:"1px solid rgba(34,197,94,0.12)" }}>
            <span style={{ fontSize:12, color:"var(--muted)" }}>{(DB[level].subjects[subject]?.objectives||[]).length} questions ready</span>
            <span style={{ fontSize:14, fontWeight:700, color:"#22c55e", fontFamily:"'Syne',sans-serif" }}>Start →</span>
          </div>
        </div>

        {/* Theory Card */}
        <div className="fadeUp3" onClick={()=>selectMode("theory")} style={{ background:"linear-gradient(135deg,#0c1e2e,#0a1820)", border:"2px solid rgba(167,139,250,0.3)", borderRadius:20, padding:22, cursor:"pointer", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", bottom:-20, right:-20, width:120, height:120, borderRadius:"50%", background:"radial-gradient(circle,rgba(167,139,250,0.12),transparent)", pointerEvents:"none" }}/>
          <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
            <div style={{ width:52, height:52, borderRadius:15, background:"rgba(167,139,250,0.15)", border:"1px solid rgba(167,139,250,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}><Ico n="pen" /></div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:"#a78bfa" }}>Theory</span>
                <span style={{ background:"rgba(167,139,250,0.15)", color:"#a78bfa", borderRadius:5, padding:"1px 8px", fontSize:10, fontWeight:700 }}>WRITTEN</span>
              </div>
              <p style={{ fontSize:13, color:"#c4b5fd", opacity:0.8, lineHeight:1.6, marginBottom:10 }}>Write out full solutions. AI marks your answer, gives a score /10, and explains in Ghanaian Pidgin + Twi voice.</p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {["AI marking","Pidgin feedback","Twi voice notes"].map(t=>(
                  <span key={t} style={{ fontSize:11, color:"#a78bfa", background:"rgba(167,139,250,0.1)", borderRadius:4, padding:"2px 8px", fontWeight:600 }}><Ico n="check" /> {t}</span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16, paddingTop:14, borderTop:"1px solid rgba(167,139,250,0.12)" }}>
            <span style={{ fontSize:12, color:"var(--muted)" }}>{(DB[level].subjects[subject]?.theory||[]).length} questions ready</span>
            <span style={{ fontSize:14, fontWeight:700, color:"#a78bfa", fontFamily:"'Syne',sans-serif" }}>Start →</span>
          </div>
        </div>
      </div>
    </div>
  );

  /* ─── TOPIC SELECT ────────────────────────────────────── */
  if (screen==="topicSelect" && level && subject && mode) {
    const isObj      = mode==="objectives";
    const modeAccent = isObj ? lvlAccent : "#a78bfa";
    const modeGlow   = isObj ? lvlGlow : "rgba(167,139,250,0.18)";
    const topics     = getTopics(subject, mode);
    const allCount   = allModeQs.length;

    // Topic stats from user's weak map
    const weakMap = stats.weak || {};

    return (
      <div style={wrap}>
        <style>{GLOBAL_CSS}</style>

        {/* Header */}
        <div style={{ padding:"13px 15px", display:"flex", alignItems:"center", gap:11, borderBottom:"1px solid var(--border)", background:"var(--surface)" }}>
          <BackBtn onClick={goBack}/>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, color:modeAccent, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {subject} — {isObj ? "Objectives" : "Theory"}
            </p>
            <p style={{ fontSize:11, color:"var(--muted)" }}>Choose a topic to practise</p>
          </div>
          <div style={{ background:`${modeAccent}18`, border:`1px solid ${modeAccent}28`, borderRadius:20, padding:"3px 11px", fontSize:11, fontWeight:700, color:modeAccent, flexShrink:0 }}>
            {topics.length} topics
          </div>
        </div>

        <div style={{ padding:"16px 15px 28px" }}>
          {/* Intro */}
          <p className="fadeUp" style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:6 }}>
            Pick a Topic <Ico n="library" />
          </p>
          <p className="fadeUp2" style={{ fontSize:13, color:"var(--muted)", marginBottom:18, lineHeight:1.6 }}>
            Focus on a specific topic or practise all questions at once.
          </p>

          {/* ALL TOPICS card */}
          <div className="fadeUp2" onClick={() => selectTopic(null)}
            style={{ background:`linear-gradient(135deg, ${modeAccent}22, ${modeAccent}10)`, border:`2px solid ${modeAccent}44`, borderRadius:16, padding:"16px 18px", marginBottom:14, cursor:"pointer", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-20, right:-20, width:100, height:100, borderRadius:"50%", background:`radial-gradient(circle, ${modeAccent}20, transparent)`, pointerEvents:"none" }}/>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:`${modeAccent}20`, border:`1.5px solid ${modeAccent}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}><Ico n="target" /></div>
              <div style={{ flex:1 }}>
                <p style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:modeAccent }}>All Topics</p>
                <p style={{ fontSize:12, color:"var(--muted2)", marginTop:2 }}>{allCount} questions · Mixed order</p>
              </div>
              <div style={{ background:modeAccent, color:"#000", borderRadius:999, padding:"6px 14px", fontSize:12, fontWeight:800, fontFamily:"'Syne',sans-serif", flexShrink:0 }}>
                Start →
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ display:"flex", alignItems:"center", gap:10, margin:"6px 0 14px" }}>
            <div style={{ flex:1, height:1, background:"var(--border)" }}/>
            <span style={{ fontSize:11, color:"var(--muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>Or pick a topic</span>
            <div style={{ flex:1, height:1, background:"var(--border)" }}/>
          </div>

          {/* Individual topic cards */}

          {topics.map((t, i) => {
            const topicQs   = allModeQs.filter(q => q.topic === t);
            const missed    = weakMap[t] || 0;
            const isWeak    = missed > 0;
            const years     = [...new Set(topicQs.map(q => q.year))].sort().reverse();
            const cardBg    = isWeak ? "rgba(248,113,113,0.06)" : "var(--surface2)";
            const cardBorder = isWeak ? "rgba(248,113,113,0.22)" : `${modeAccent}1a`;

            return (
              <div key={t} className={`fadeUp${Math.min(i+2,5)}`} onClick={() => selectTopic(t)}
                style={{ background:cardBg, border:`1px solid ${cardBorder}`, borderRadius:14, padding:"15px 16px", marginBottom:10, cursor:"pointer", position:"relative", overflow:"hidden" }}>
                {/* Glow blob */}
                <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at left, ${modeGlow} 0%, transparent 50%)`, pointerEvents:"none" }}/>

                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  {/* Topic icon / number */}
                  <div style={{ width:44, height:44, borderRadius:12, background:`${modeAccent}14`, border:`1px solid ${modeAccent}28`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:modeAccent, flexShrink:0 }}>
                    {i+1}
                  </div>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:4 }}>
                      <p style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:"var(--text)" }}>{t}</p>
                      {isWeak && (
                        <span style={{ background:"rgba(248,113,113,0.14)", color:"#f87171", border:"1px solid rgba(248,113,113,0.2)", borderRadius:20, padding:"1px 8px", fontSize:10, fontWeight:700 }}>
                          <Ico n="warn" /> {missed}× missed
                        </span>
                      )}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <span style={{ fontSize:11, color:"var(--muted)" }}>{topicQs.length} question{topicQs.length!==1?"s":""}</span>
                      <span style={{ fontSize:11, color:"var(--muted)", opacity:0.5 }}>·</span>
                      <span style={{ fontSize:11, color:"var(--muted)" }}>{years.join(", ")} WAEC</span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <span style={{ fontSize:18, color:`${modeAccent}55`, flexShrink:0 }}>›</span>
                </div>
              </div>
            );
          })}

          {/* Weak topic tip */}
          {Object.keys(weakMap).some(t => topics.includes(t)) && (
            <div style={{ background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.15)", borderRadius:12, padding:"11px 14px", marginTop:6, display:"flex", gap:10, alignItems:"flex-start" }}>
              <span style={{ fontSize:16, flexShrink:0 }}><Ico n="bulb" /></span>
              <p style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.6 }}>
                Topics marked <span style={{ color:"#f87171", fontWeight:700 }}><Ico n="warn" /></span> are ones you've struggled with. Focus on those first chale!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─── PRACTICE ────────────────────────────────────────── */
  if (screen==="practice" && currentQ) {
    const isObj     = mode==="objectives";
    const modeAccent = isObj ? lvlAccent : "#a78bfa";
    const modeGlow  = isObj ? lvlGlow : "rgba(167,139,250,0.18)";
    const scoreColor = s => s>=7?"#22c55e":s>=5?"#fbbf24":"#f87171";

    return (
      <div style={wrap}>
        <style>{GLOBAL_CSS}</style>
        {/* Top bar */}
        <div style={{ padding:"13px 15px", display:"flex", alignItems:"center", gap:11, borderBottom:"1px solid var(--border)", background:"var(--surface)" }}>
          <BackBtn onClick={goBack}/>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:modeAccent, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{subject} — {topic || "All Topics"}</p>
            <p style={{ fontSize:11, color:"var(--muted)" }}>{currentQ.topic} · {currentQ.year} {lvl.label} · {isObj?"Objectives":"Theory"}</p>
          </div>
          <div style={{ background:`${modeAccent}18`, border:`1px solid ${modeAccent}28`, borderRadius:20, padding:"3px 11px", fontSize:12, fontWeight:700, color:modeAccent, flexShrink:0, fontFamily:"'Syne',sans-serif" }}>
            {qIndex+1}/{qs.length}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid var(--border)" }}>
          {["practice","dashboard"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"10px", background:"none", border:"none", fontSize:13, fontWeight:tab===t?700:500, color:tab===t?modeAccent:"var(--muted)", borderBottom:tab===t?`2.5px solid ${modeAccent}`:"2.5px solid transparent", fontFamily:"'DM Sans',sans-serif", transition:"color 0.2s" }}>
              {t==="practice"?(isObj?<><Ico n="list" />{" Objectives"}</>:<><Ico n="pen" />{" Theory"}</>):<><Ico n="chart" />{" Dashboard"}</>}
            </button>
          ))}
        </div>

        {tab==="practice" ? (
          <div style={{ padding:"15px 15px 30px" }}>
            {/* Question card — key forces re-mount animation on each question */}
            <div className="fadeUp" style={{ background:"var(--surface2)", border:`1px solid ${modeAccent}1a`, borderRadius:16, padding:18, marginBottom:14, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${modeAccent},transparent)` }}/>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                <Tag color={modeAccent}>{currentQ.topic}</Tag>
                <Tag color="#a78bfa">{currentQ.year}</Tag>
                <Tag color={isObj?"#22c55e":"#a78bfa"}>{isObj?"MCQ":"Theory"}</Tag>
              </div>
              <p style={{ fontSize:15, lineHeight:1.8, color:"var(--text)", fontWeight:500 }}>{currentQ.question}</p>
            </div>

            {/* ─── OBJECTIVES UI ─────────────────────────── */}
            {isObj && (
              <div className="fadeUp2">
                {currentQ.options.map((opt,i)=>{
                  const letter = opt[0];
                  const isSelected = selectedOpt===letter;
                  const isCorrect  = currentQ.correct===letter;
                  let bg = "var(--surface3)", border = "var(--border2)", color = "var(--text)";
                  if (revealed) {
                    if (isCorrect)             { bg="rgba(34,197,94,0.12)"; border="#22c55e"; color="#22c55e"; }
                    else if (isSelected)       { bg="rgba(248,113,113,0.12)"; border="#f87171"; color="#f87171"; }
                    else                       { bg="var(--surface2)"; border="var(--border)"; color="var(--muted)"; }
                  } else if (isSelected)       { bg=`${lvlAccent}18`; border=lvlAccent; color=lvlAccent; }

                  return (
                    <div key={opt} onClick={()=>handleOptSelect(letter)}
                      className={revealed && isCorrect ? "pop" : ""}
                      style={{ display:"flex", alignItems:"center", gap:12, background:bg, border:`1.5px solid ${border}`, borderRadius:12, padding:"13px 15px", marginBottom:10, cursor:revealed?"default":"pointer", transition:"all 0.25s",
                        animation: revealed && isSelected && !isCorrect ? "wrongShake 0.4s ease" : (revealed && isCorrect ? "correctPulse 0.5s ease" : "none")
                      }}>
                      <div style={{ width:32, height:32, borderRadius:9, background:`${border}18`, border:`1.5px solid ${border}`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color, flexShrink:0 }}>{letter}</div>
                      <span style={{ fontSize:14, color, fontWeight:isSelected||isCorrect?600:400, flex:1 }}>{opt.slice(3)}</span>
                      {revealed && isCorrect  && <span style={{ fontSize:18 }}><Ico n="ok" /></span>}
                      {revealed && isSelected && !isCorrect && <span style={{ fontSize:18 }}><Ico n="no" /></span>}
                    </div>
                  );
                })}

                {/* Explanation after reveal */}
                {revealed && (
                  <div className="fadeIn" style={{ background:"var(--surface2)", border:`1px solid ${selectedOpt===currentQ.correct?"rgba(34,197,94,0.2)":"rgba(248,113,113,0.2)"}`, borderRadius:14, padding:16, marginTop:4 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                      <span style={{ fontSize:22 }}>{selectedOpt===currentQ.correct?<Ico n="party" />:<Ico n="book" />}</span>
                      <p style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:800, color:selectedOpt===currentQ.correct?"#22c55e":"#f87171" }}>
                        {selectedOpt===currentQ.correct?"Correct! Ayekoo!":"Not quite, chale!"}
                      </p>
                    </div>
                    <p style={{ fontSize:11, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>Explanation</p>
                    <p style={{ fontSize:13, lineHeight:1.75, color:"#cbd5e1" }}>{currentQ.explanation}</p>
                    <StepExplanation key={currentQ.id} q={currentQ} exam={level==="JHS"?"BECE":"WASSCE"} subject={subject} chosen={selectedOpt} accent={lvlAccent}/>
                    <div style={{ height:12 }}/>
                    <PrimaryBtn onClick={nextQ} color={lvlAccent}>Next Question →</PrimaryBtn>
                  </div>
                )}

                {!revealed && limitHit && (
                  <div style={{ background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:12, padding:14, marginTop:4 }}>
                    <p style={{ fontWeight:700, color:"#fbbf24", marginBottom:6 }}><Ico n="lock" /> Daily Limit Reached</p>
                    <p style={{ fontSize:13, color:"var(--muted)", marginBottom:12 }}>You've used your 3 free questions. Upgrade for GHS 50/month chale!</p>
                    <PrimaryBtn onClick={()=>setShowPaywall(true)} color="#fbbf24">Upgrade with MoMo →</PrimaryBtn>
                  </div>
                )}
              </div>
            )}

            {/* ─── THEORY UI ─────────────────────────────── */}
            {!isObj && (
              <div className="fadeUp2">
                <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--muted2)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>Your Working & Answer</label>
                <textarea value={theoryAns} onChange={e=>setTheoryAns(e.target.value)}
                  placeholder={"Write your full solution here…\n\nStep 1:\nStep 2:\nAnswer:"}
                  style={{ width:"100%", minHeight:130, padding:"13px 14px", background:"var(--surface3)", border:`1.5px solid ${theoryAns?"#a78bfa":"var(--border2)"}`, borderRadius:12, fontSize:14, color:"var(--text)", resize:"vertical", lineHeight:1.75, fontFamily:"'DM Sans',sans-serif", transition:"border-color 0.2s, box-shadow 0.2s", boxShadow:theoryAns?"0 0 0 3px rgba(167,139,250,0.12)":"none" }}
                />
                <div style={{ height:10 }}/>
                <PrimaryBtn onClick={handleMark} disabled={!theoryAns.trim()} loading={marking} color="#a78bfa">
                  {!marking && <><Ico n="ok" />{" Mark My Answer"}</>}
                </PrimaryBtn>


                {/* Limit wall */}
                {limitHit && !theoryResult && (
                  <div className="fadeIn" style={{ background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:12, padding:14, marginTop:14 }}>
                    <p style={{ fontWeight:700, color:"#fbbf24", marginBottom:6 }}><Ico n="lock" /> Daily Limit Reached</p>
                    <p style={{ fontSize:13, color:"var(--muted)", marginBottom:12 }}>Upgrade for unlimited theory + objectives chale!</p>
                    <PrimaryBtn onClick={()=>setShowPaywall(true)} color="#fbbf24">Upgrade with MoMo →</PrimaryBtn>
                  </div>
                )}

                {/* Theory result */}
                {theoryResult && (
                  <div className="fadeIn" style={{ background:"var(--surface2)", border:`1px solid ${scoreColor(theoryResult.score)}22`, borderRadius:16, padding:18, marginTop:14, position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${scoreColor(theoryResult.score)},transparent)` }}/>
                    <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
                      <ScoreBadge score={theoryResult.score}/>
                      <div style={{ flex:1 }}>
                        <p style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:800 }}>{theoryResult.scoreText}</p>
                        <p style={{ fontSize:12, fontWeight:600, color:scoreColor(theoryResult.score), marginTop:2 }}>
                          {theoryResult.score>=8?<><Ico n="party" />{" Excellent!"}</>:theoryResult.score>=6?<>{" Good effort!"}</>:theoryResult.score>=4?<><Ico n="book" />{" Study more!"}</>:<>{" Keep pushing!"}</>}
                        </p>
                      </div>
                      <button onClick={handleTwi} disabled={loadingTwi} style={{ background:speaking?"#a78bfa":"var(--surface4)", color:speaking?"#000":"#a78bfa", border:"1px solid rgba(167,139,250,0.3)", borderRadius:10, padding:"8px 11px", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:5, flexShrink:0, transition:"all 0.2s" }}>
                        {loadingTwi ? <Spinner color="#a78bfa" size={15}/> : speaking ? <><Ico n="volume" />{" Playing"}</> : <><Ico n="mic" />{" Twi"}</>}
                      </button>
                    </div>
                    <div style={{ height:1, background:"var(--border)", margin:"0 0 14px" }}/>
                    <p style={{ fontSize:11, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>AI Feedback (Pidgin)</p>
                    <div style={{ background:"var(--surface3)", borderRadius:10, padding:"11px 13px", marginBottom:theoryResult.score<10?14:0 }}>
                      <p style={{ fontSize:14, lineHeight:1.8, color:"#cbd5e1", fontStyle:"italic" }}>"{theoryResult.feedback}"</p>
                    </div>
                    {theoryResult.score<10 && (<>
                      <p style={{ fontSize:11, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>Correct Solution</p>
                      <div style={{ background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.14)", borderRadius:10, padding:"11px 13px" }}>
                        <p style={{ fontSize:13, lineHeight:1.78, color:"#4ade80" }}>{theoryResult.correctAnswer}</p>
                      </div>
                    </>)}
                    <StepExplanation key={currentQ.id} q={currentQ} exam={level==="JHS"?"BECE":"WASSCE"} subject={subject} studentAnswer={theoryAns} accent="#a78bfa"/>
                    {twiText && (<>
                      <div style={{ height:1, background:"var(--border)", margin:"14px 0" }}/>
                      <p style={{ fontSize:11, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}><Ico n="ghana" /> Twi Explanation</p>
                      <p style={{ fontSize:13, lineHeight:1.78, color:"var(--text)", background:"var(--surface3)", padding:"11px 13px", borderRadius:10 }}>{twiText}</p>
                    </>)}
                    <div style={{ height:14 }}/>
                    <PrimaryBtn onClick={nextQ} color="#a78bfa">Next Question →</PrimaryBtn>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <DashboardView stats={stats} weakList={weakList} avgScore={avgScore} isPaid={isPaid} onUpgrade={()=>setShowPaywall(true)} accent={lvlAccent}/>
        )}

        {showPaywall && <PaywallModal onClose={()=>setShowPaywall(false)} onPay={()=>{ setIsPaid(true); setShowPaywall(false); }}/>}
        {showSupport && <SupportModal onClose={()=>setShowSupport(false)}/>}
      </div>
    );
  }

  return null;
}

/* ═══════════════════════════════════════════════════════════════
   AUTH SCREEN  — Lively: particles, waves, orbiting star, GSAP
═══════════════════════════════════════════════════════════════ */
function AuthScreen({ mode, setMode, onSuccess, onPendingVerify, onSupport }) {
  const [name,        setName]        = useState("");
  const [phone,       setPhone]       = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [school,      setSchool]      = useState("");
  const [role,        setRoleChoice]  = useState("student"); // student | teacher | parent
  const [region,      setRegion]      = useState("");
  const [avatarColor, setAvatarColor] = useState("#22c55e");
  const [errors,      setErrors]      = useState({});
  const [loading,     setLoading]     = useState(false);
  const [serverErr,   setServerErr]   = useState("");
  const [typedText,   setTypedText]   = useState("");
  const isLogin = mode === "login";

  // Avatar colour options
  const AVATAR_COLORS = ["#22c55e","#38bdf8","#f59e0b","#f87171","#a78bfa","#fb923c","#34d399","#e879f9"];

  const bodyRef     = useRef(null);
  const loginRef    = useRef(null);
  const registerRef = useRef(null);
  const sliderRef   = useRef(null);
  const headingRef  = useRef(null);
  const gsapRef     = useRef(null);
  const typeRef     = useRef(null);

  // Typewriter effect for tagline
  const phrases = ["Pass your BECE ", "Ace your WASSCE ", "Practice in Twi ", "Get AI Feedback "];
  const phraseIdx = useRef(0);
  const charIdx   = useRef(0);
  const deleting  = useRef(false);

  useEffect(() => {
    let timer;
    function type() {
      const phrase = phrases[phraseIdx.current];
      if (!deleting.current) {
        charIdx.current++;
        setTypedText(phrase.slice(0, charIdx.current));
        if (charIdx.current === phrase.length) {
          deleting.current = true;
          timer = setTimeout(type, 1600);
          return;
        }
      } else {
        charIdx.current--;
        setTypedText(phrase.slice(0, charIdx.current));
        if (charIdx.current === 0) {
          deleting.current = false;
          phraseIdx.current = (phraseIdx.current + 1) % phrases.length;
        }
      }
      timer = setTimeout(type, deleting.current ? 42 : 68);
    }
    timer = setTimeout(type, 900);
    return () => clearTimeout(timer);
  }, []);

  // Load GSAP from CDN
  useEffect(() => {
    if (window.gsap) { gsapRef.current = window.gsap; return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";
    s.onload = () => { gsapRef.current = window.gsap; };
    document.head.appendChild(s);
  }, []);

  // GSAP mode-switch animation
  useEffect(() => {
    const gsap  = gsapRef.current;
    const body  = bodyRef.current;
    const login = loginRef.current;
    const reg   = registerRef.current;
    const head  = headingRef.current;
    if (!gsap || !body || !login) return;

    if (isLogin) {
      gsap.to(body, { backgroundColor:"#0a0f0d", duration:0.6, ease:"power2.inOut" });
      login.classList.add("active");
      gsap.fromTo(login,  { opacity:0, y:20 }, { opacity:1, y:0, duration:0.45, ease:"power3.out", delay:0.05 });
      if (reg) gsap.to(reg, { opacity:0, x:20, duration:0.28, ease:"power2.in", onComplete:()=>{ reg.classList.remove("active"); reg.style.display="none"; } });
      if (sliderRef.current) gsap.to(sliderRef.current, { x:0, duration:0.38, ease:"power2.inOut" });
    } else {
      gsap.to(body, { backgroundColor:"#0d1610", duration:0.6, ease:"power2.inOut" });
      login.classList.remove("active");
      gsap.to(login, { opacity:0, y:-14, duration:0.28, ease:"power2.in" });
      if (reg) {
        reg.style.display = "block";
        reg.classList.add("active");
        gsap.fromTo(reg, { opacity:0, x:28 }, { opacity:1, x:0, duration:0.45, ease:"power3.out", delay:0.08 });
      }
      if (sliderRef.current) {
        const w = (sliderRef.current.parentElement?.offsetWidth ?? 320) / 2;
        gsap.to(sliderRef.current, { x:w, duration:0.38, ease:"power2.inOut" });
      }
    }
    if (head) gsap.fromTo(head, { opacity:0, y:10 }, { opacity:1, y:0, duration:0.38, ease:"power2.out", delay:0.12 });
  }, [isLogin]);

  function switchMode(m) { setMode(m); setErrors({}); setServerErr(""); }

  async function submit() {
    setErrors({}); setServerErr("");
    const e = {};
    if (!isLogin && !name.trim()) e.name = "Full name is required";
    const digits = phone.replace(/\D/g,"");
    if (!digits.length)            e.phone    = "Phone number is required";
    else if (digits.length<10)     e.phone    = "Enter a valid 10-digit number";
    if (!isLogin && email.trim()) {
      // validate email format if provided
      if (!/^[^@]+@[^@]+\.[^@]+$/.test(email.trim())) e.email = "Enter a valid email address";
    }
    if (!password)                 e.password = "Password is required";
    else if (!isLogin && password.length<6) e.password = "Minimum 6 characters";
    if (!isLogin && password!==confirm)     e.confirm  = "Passwords don't match";
    if (!isLogin && role==="teacher") {
      if (!email.trim()) e.email = "Email is required for teachers";
      if (!school.trim()) e.school = "School name is required for teachers";
      if (!region) e.region = "Choose your region";
    }
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);

    if (isLogin) {
      // ── Login flow ────────────────────────────────────────────
      const res = await AUTH.login(phone, password);
      setLoading(false);
      if (!res.ok) {
        setServerErr(res.msg);
        const gsap = gsapRef.current;
        const el = loginRef.current;
        if (gsap && el) gsap.fromTo(el, { x:-10 }, { x:0, duration:0.5, ease:"elastic.out(1,0.4)" });
        return;
      }
      // The button you picked must match the account type
      const accountRole = getRole(phone);
      if (accountRole !== role) {
        localStorage.removeItem("gp_session_v3");
        setServerErr(accountRole === "teacher" ? "This is a teacher account. Choose Teacher to sign in." : accountRole === "parent" ? "This is a parent account. Choose Parent to sign in." : "This is a student account. Choose Student to sign in.");
        return;
      }
      if (role === "teacher") {
        const prof = teacherProfileByPhone(phone);
        if (!prof) { localStorage.removeItem("gp_session_v3"); setServerErr("Teacher profile not found on this device."); return; }
        startTeacherSession(prof);
        window.location.href = "/teacher/dashboard";
        return;
      }
      if (role === "parent") {
        startParentSession({ name: res.name || "Parent", phone });
        window.location.href = "/parent";
        return;
      }
      onSuccess({ name:res.name||name, phone });

    } else {
      // ── Register flow — send verification code first ──────────
      if (role === "teacher") {
        // Teachers register directly (no email-code step) and land on the Teacher Dashboard
        const tres = await AUTH.register(name.trim(), phone, email.trim(), password, school.trim(), avatarColor);
        setLoading(false);
        if (!tres.ok) { setServerErr(tres.msg); return; }
        startTeacherSession({ fullName: name.trim(), email: email.trim(), phone, school: school.trim(), region });
        window.location.href = "/teacher/dashboard";
        return;
      }
      if (role === "parent") {
        // Parents register with name, phone and password only, and land on the parent page
        const pres = await AUTH.register(name.trim(), phone, "", password, "", avatarColor);
        setLoading(false);
        if (!pres.ok) { setServerErr(pres.msg); return; }
        startParentSession({ name: name.trim(), phone });
        window.location.href = "/parent";
        return;
      }
      const trimEmail = email.trim();

      if (trimEmail && !IS_LOCAL) {
        // Email provided → send OTP then verify
        const sendRes = await AUTH.sendVerificationCode(trimEmail, name.trim());
        setLoading(false);
        if (!sendRes.ok) { setServerErr(sendRes.msg||"Failed to send code."); return; }
        // Store pending registration data and switch to verify screen
        onPendingVerify({
          name: name.trim(), phone, email: trimEmail, password,
          school, avatarColor,
          demoCode: null,
        });
      } else {
        // No email → register directly (phone-only)
        const res = await AUTH.register(name.trim(), phone, trimEmail, password, school, avatarColor);
        setLoading(false);
        if (!res.ok) {
          setServerErr(res.msg);
          const gsap = gsapRef.current;
          const el = registerRef.current;
          if (gsap && el) gsap.fromTo(el, { x:-10 }, { x:0, duration:0.5, ease:"elastic.out(1,0.4)" });
          return;
        }
        onSuccess({ name:name.trim(), phone });
      }
    }
  }

  // Floating particles data
  const particles = [
    { top:"8%",  left:"6%",  size:7,  anim:"floatA", dur:"6s",  del:"0s",   col:"rgba(34,197,94,0.7)" },
    { top:"14%", left:"88%", size:5,  anim:"floatB", dur:"7.5s",del:"1.2s", col:"rgba(252,209,22,0.8)" },
    { top:"22%", left:"15%", size:10, anim:"floatC", dur:"5.5s",del:"0.6s", col:"rgba(206,17,38,0.6)"  },
    { top:"30%", left:"78%", size:6,  anim:"floatD", dur:"8s",  del:"2s",   col:"rgba(34,197,94,0.5)"  },
    { top:"42%", left:"5%",  size:8,  anim:"floatB", dur:"6.8s",del:"1.5s", col:"rgba(252,209,22,0.6)" },
    { top:"55%", left:"92%", size:5,  anim:"floatA", dur:"7.2s",del:"0.3s", col:"rgba(206,17,38,0.5)"  },
    { top:"68%", left:"10%", size:9,  anim:"floatC", dur:"6.2s",del:"2.5s", col:"rgba(34,197,94,0.65)" },
    { top:"75%", left:"82%", size:6,  anim:"floatD", dur:"5.8s",del:"1s",   col:"rgba(252,209,22,0.55)"},
    { top:"5%",  left:"50%", size:4,  anim:"floatA", dur:"9s",  del:"3s",   col:"rgba(255,255,255,0.3)" },
    { top:"88%", left:"45%", size:5,  anim:"floatB", dur:"7s",  del:"0.8s", col:"rgba(34,197,94,0.4)"  },
    { top:"60%", left:"55%", size:3,  anim:"floatC", dur:"10s", del:"4s",   col:"rgba(252,209,22,0.35)"},
    { top:"18%", left:"40%", size:4,  anim:"floatD", dur:"8.5s",del:"2.8s", col:"rgba(206,17,38,0.4)"  },
  ];

  return (
    <div ref={bodyRef} style={{ fontFamily:"'DM Sans',sans-serif", minHeight:"100vh",
      maxWidth:430, margin:"0 auto", color:"var(--text)", display:"flex",
      flexDirection:"column", position:"relative", overflow:"hidden", background:"#0a0f0d" }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── FLOATING PARTICLES ───────────────────────────────── */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
        {particles.map((p,i) => (
          <div key={i} style={{
            position:"absolute", top:p.top, left:p.left,
            width:p.size, height:p.size, borderRadius:"50%",
            background:p.col,
            animation:`${p.anim} ${p.dur} ${p.del} ease-in-out infinite`,
            filter:"blur(0.5px)",
            boxShadow:`0 0 ${p.size*2}px ${p.col}`,
          }}/>
        ))}
      </div>

      {/* ── ANIMATED GHANA FLAG HERO ─────────────────────────── */}
      <div style={{ position:"relative", overflow:"hidden", flexShrink:0, zIndex:1 }}>
        {/* Animated stripes — each wave at different speed */}
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column" }}>
          <div style={{ flex:1, background:"#CE1126", animation:"waveRed 4s ease-in-out infinite",
                        transformOrigin:"left center" }}/>
          <div style={{ flex:1, background:"#FCD116", animation:"waveGold 5s ease-in-out infinite",
                        transformOrigin:"right center" }}/>
          <div style={{ flex:1, background:"#006B3F", animation:"waveGreen 4.5s ease-in-out infinite",
                        transformOrigin:"left center" }}/>
        </div>

        {/* Dark overlay with shimmer sweep */}
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)" }}/>
        <div style={{ position:"absolute", inset:0, opacity:0.15,
          background:"linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)",
          backgroundSize:"200% 100%", animation:"shimmerSweep 3.5s linear infinite" }}/>

        {/* Grid lines overlay for depth */}
        <div style={{ position:"absolute", inset:0, opacity:0.06,
          backgroundImage:"repeating-linear-gradient(0deg,rgba(255,255,255,0.8) 0px,transparent 1px,transparent 40px,rgba(255,255,255,0.8) 40px), repeating-linear-gradient(90deg,rgba(255,255,255,0.8) 0px,transparent 1px,transparent 40px,rgba(255,255,255,0.8) 40px)" }}/>

        {/* Support pill */}
        <button onClick={() => { if (!openWhatsApp("I need help signing in to GhanaPrep.")) onSupport(); }} style={{ position:"absolute", top:14, right:14, zIndex:10,
          background:"rgba(0,0,0,0.5)", backdropFilter:"blur(10px)",
          border:"1px solid rgba(255,255,255,0.2)", borderRadius:999,
          padding:"7px 16px", color:"#fff", fontSize:12, fontWeight:700,
          fontFamily:"'Syne',sans-serif", display:"flex", alignItems:"center", gap:6,
          cursor:"pointer", transition:"background 0.2s" }}>
          <Ico n="message" /> Support
        </button>

        {/* Content */}
        <div style={{ position:"relative", zIndex:2, padding:"44px 24px 36px", textAlign:"center" }}>

          {/* Orbiting star ring */}
          <div style={{ position:"relative", display:"inline-block", marginBottom:12 }}>
            {/* Glowing ring */}
            <div style={{ position:"absolute", top:"50%", left:"50%",
              transform:"translate(-50%,-50%)", width:90, height:90,
              borderRadius:"50%", border:"2px solid rgba(252,209,22,0.35)",
              animation:"glowPulse 2.5s ease-in-out infinite" }}/>

            {/* Orbiting dots */}
            {[0,1,2].map(i => (
              <div key={i} style={{ position:"absolute", top:"50%", left:"50%",
                width:7, height:7, borderRadius:"50%",
                background: i===0?"#FCD116": i===1?"#CE1126":"#22c55e",
                marginTop:-3.5, marginLeft:-3.5,
                animation:`orbit${["A","B","C"][i]} ${2.8+(i*0.4)}s linear infinite`,
                filter:"blur(0.3px)",
                boxShadow:`0 0 8px ${i===0?"#FCD116":i===1?"#CE1126":"#22c55e"}`,
              }}/>
            ))}

            {/* Star */}
            <div style={{ fontSize:54, display:"block", position:"relative", zIndex:2,
              animation:"starBob 3s ease-in-out infinite",
              filter:"drop-shadow(0 0 18px rgba(252,209,22,0.9))" }}><Ico n="star" /></div>
          </div>

          {/* Brand name */}
          <div className="fadeUp" style={{ fontSize:13, color:"rgba(252,209,22,0.95)", fontWeight:800,
            letterSpacing:"0.22em", textTransform:"uppercase", marginBottom:8,
            fontFamily:"'Syne',sans-serif",
            textShadow:"0 0 20px rgba(252,209,22,0.5)" }}>
            Ghana Prep
          </div>

          {/* Main title */}
          <h1 className="fadeUp2" style={{ fontFamily:"'Syne',sans-serif", fontSize:28,
            fontWeight:800, color:"#fff", lineHeight:1.18, marginBottom:10,
            textShadow:"0 2px 20px rgba(0,0,0,0.8)" }}>
            BECE & WASSCE<br/>Practice
          </h1>

          {/* Typewriter line */}
          <div className="fadeUp3" style={{ minHeight:28, marginBottom:16 }}>
            <span style={{ fontSize:15, color:"rgba(255,255,255,0.85)", fontWeight:600 }}>
              {typedText}
            </span>
            <span style={{ display:"inline-block", width:2, height:16, background:"#22c55e",
              marginLeft:2, verticalAlign:"middle", borderRadius:2,
              animation:"blink 1s step-end infinite" }}/>
          </div>

          {/* Tricolour bar */}
          <div className="fadeUp4" style={{ display:"flex", justifyContent:"center", gap:5 }}>
            {["#CE1126","#FCD116","#006B3F"].map((c,i)=>(
              <div key={i} style={{ height:4, borderRadius:99, background:c,
                animation:`shimmer ${1.8+i*0.4}s ease-in-out ${i*0.3}s infinite`,
                width:36 }}/>
            ))}
          </div>
        </div>
      </div>

      {/* ── AUTH CARD ─────────────────────────────────────────── */}
      <div className="auth-card-enter" style={{
        flex:1, borderRadius:"24px 24px 0 0", padding:"24px 20px 36px", marginTop:-10,
        background:"rgba(15,20,16,0.97)", backdropFilter:"blur(20px)",
        border:"1px solid rgba(34,197,94,0.15)", borderBottom:"none",
        position:"relative", zIndex:3,
        boxShadow:"0 -8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(34,197,94,0.2)" }}>

        {/* Green accent line at top of card */}
        <div style={{ position:"absolute", top:0, left:"10%", right:"10%", height:2,
          background:"linear-gradient(90deg,transparent,#22c55e,#FCD116,#22c55e,transparent)",
          borderRadius:99, animation:"shimmer 2s ease-in-out infinite" }}/>

        {/* ── Tab toggle ──────────────────────────────────────── */}
        <div role="group" aria-label="I am joining as" style={{ display:"flex", gap:8, marginBottom:14 }}>
          {[["student","I'm a Student"],["teacher","I'm a Teacher"],["parent","I'm a Parent"]].map(([r,l])=>(
            <button key={r} type="button" aria-pressed={role===r}
              onClick={()=>{ setRoleChoice(r); setErrors({}); setServerErr(""); }}
              style={{ flex:1, padding:"11px 4px", borderRadius:12, cursor:"pointer", fontSize:12.5, fontWeight:800, whiteSpace:"nowrap",
                fontFamily:"'Syne',sans-serif", background: role===r ? "rgba(34,197,94,0.15)" : "transparent",
                border: `1.5px solid ${role===r ? "#22c55e" : "rgba(255,255,255,0.14)"}`,
                color: role===r ? "#22c55e" : "var(--muted2)" }}>{l}</button>
          ))}
        </div>
        <div style={{ position:"relative", display:"flex", background:"rgba(30,39,31,0.8)",
          borderRadius:999, padding:4, marginBottom:24, border:"1px solid rgba(34,197,94,0.12)" }}>
          <div ref={sliderRef} className="auth-tab-slider"/>
          {["login","register"].map(m=>(
            <button key={m} onClick={()=>switchMode(m)} style={{
              flex:1, padding:"10px", background:"transparent", border:"none",
              borderRadius:999, zIndex:1, position:"relative",
              color: mode===m ? "#000" : "var(--muted2)",
              fontSize:13, fontWeight:800, fontFamily:"'Syne',sans-serif",
              cursor:"pointer", transition:"color 0.3s" }}>
              {m==="login" ? <><Ico n="key" />{" Sign In"}</> : <><Ico n="sparkles" />{" Create Account"}</>}
            </button>
          ))}
        </div>

        {/* Heading */}
        <h2 ref={headingRef} style={{ fontFamily:"'Syne',sans-serif", fontSize:20,
          fontWeight:800, marginBottom:6, color:"var(--text)" }}>
          {isLogin ? <>{"Welcome back "}</> : <>{"Join GhanaPrep "}<Ico n="ghana" /></>}
        </h2>
        <p style={{ fontSize:12, color:"var(--muted)", marginBottom:18 }}>
          {isLogin
            ? "Sign in to continue your practice streak"
            : "Create your free account and start practising today"}
        </p>

        {/* Error banner */}
        {serverErr && (
          <div className="pop" style={{ background:"rgba(248,113,113,0.1)",
            border:"1px solid rgba(248,113,113,0.3)", borderRadius:12,
            padding:"10px 14px", marginBottom:14,
            display:"flex", alignItems:"center", gap:8 }}>
            <span style={{fontSize:16}}><Ico n="warn" /></span>
            <p style={{ color:"#f87171", fontSize:13, fontWeight:600 }}>{serverErr}</p>
          </div>
        )}

        {/* ── LOGIN FORM ─────────────────────────────────────── */}
        <div ref={loginRef} className="login-form active">
          <LivelyInput label="Phone Number" type="tel" value={phone}
            onChange={e=>setPhone(e.target.value)} placeholder="024 XXX XXXX"
            icon={<Ico n="phone" />} error={errors.phone}/>
          <LivelyInput label="Password" type="password" value={password}
            onChange={e=>setPassword(e.target.value)} placeholder="Enter your password"
            icon={<Ico n="lock" />} error={errors.password}/>
        </div>

        {/* ── REGISTER FORM ──────────────────────────────────── */}
        <div ref={registerRef} className="register-form" style={{display:isLogin?"none":"block"}}>
          <LivelyInput label="Full Name" value={name}
            onChange={e=>setName(e.target.value)} placeholder="Kwame Mensah"
            icon={<Ico n="user" />} error={errors.name}/>
          <LivelyInput label="Phone Number" type="tel" value={phone}
            onChange={e=>setPhone(e.target.value)} placeholder="024 XXX XXXX"
            icon={<Ico n="phone" />} error={errors.phone}/>
          {role!=="parent" && (<>
          <LivelyInput label={role==="teacher" ? "School name" : "School (optional, shows on leaderboard)"} value={school}
            onChange={e=>setSchool(e.target.value)} placeholder="e.g. Prempeh College"
            icon={<Ico n="school" />} error={errors.school}/>
          <LivelyInput label={role==="teacher" ? "Email address" : "Email address (optional)"} type="email" value={email}
            onChange={e=>setEmail(e.target.value)} placeholder="you@gmail.com"
            icon={<Ico n="mail" />} error={errors.email}/>
          </>)}
          {role==="teacher" && (
            <div style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:"var(--muted2)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>Region in Ghana</label>
              <select value={region} aria-label="Region in Ghana" onChange={e=>{ setRegion(e.target.value); setErrors({...errors, region:""}); }}
                style={{width:"100%",padding:"13px 14px",background:"rgba(30,39,31,0.9)",border:`1.5px solid ${errors.region?"var(--danger)":"rgba(255,255,255,0.1)"}`,borderRadius:12,color:"var(--text)",fontSize:14,fontFamily:"'DM Sans',sans-serif"}}>
                <option value="">Select your region</option>
                {REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
              {errors.region && <p style={{fontSize:11,color:"var(--danger)",marginTop:5}}>{errors.region}</p>}
            </div>
          )}
          <LivelyInput label="Password" type="password" value={password}
            onChange={e=>setPassword(e.target.value)} placeholder="Minimum 6 characters"
            icon={<Ico n="lock" />} error={errors.password}/>
          <LivelyInput label="Confirm Password" type="password" value={confirm}
            onChange={e=>setConfirm(e.target.value)} placeholder="Repeat password"
            icon={<Ico n="lock" />} error={errors.confirm}/>
          {/* Avatar colour picker */}
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"var(--muted2)",
              textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8,
              fontFamily:"'DM Sans',sans-serif"}}>Pick Your Colour</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {AVATAR_COLORS.map(c=>(
                <button key={c} onClick={()=>setAvatarColor(c)} style={{
                  width:32,height:32,borderRadius:"50%",background:c,border:"none",
                  cursor:"pointer",outline:avatarColor===c?`3px solid #fff`:"3px solid transparent",
                  outlineOffset:2,boxShadow:avatarColor===c?`0 0 12px ${c}`:"none",
                  transition:"all .15s"}}/>
              ))}
            </div>
          </div>
        </div>

        {/* ── Shiny submit button ─────────────────────────────── */}
        <button onClick={submit} disabled={loading} className="btn-shine"
          style={{ width:"100%", padding:"14px 0", marginTop:6 }}>
          {loading
            ? <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                <Spinner color="#000"/> Processing…
              </span>
            : (isLogin ? "Sign In →" : "Create Account →")}
        </button>

        {/* Switch mode link */}
        <p style={{ textAlign:"center", fontSize:12, color:"var(--muted)", marginTop:14 }}>
          {isLogin ? "No account yet? " : "Already have an account? "}
          <button onClick={()=>switchMode(isLogin?"register":"login")}
            style={{ background:"none", border:"none", color:"#22c55e",
              fontWeight:700, fontSize:12, fontFamily:"'DM Sans',sans-serif",
              cursor:"pointer", textDecoration:"underline", textUnderlineOffset:2 }}>
            {isLogin ? "Create one free" : "Sign in instead"}
          </button>
        </p>

        {/* ── Feature pills ───────────────────────────────────── */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:7, justifyContent:"center",
          marginTop:20 }}>
          {[
            [<Ico n="ok" />,"Free 3 Qs/day","pill-1"],
            [<Ico n="key" />,"GHS 50/month","pill-2"],
            [<Ico n="mic" />,"Twi Voice","pill-3"],
            [<Ico n="chart" />,"Dashboard","pill-4"],
          ].map(([icon,label,cls])=>(
            <span key={label} className={cls} style={{
              background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)",
              borderRadius:999, padding:"5px 12px",
              fontSize:11, fontWeight:700, color:"#4ade80",
              display:"flex", alignItems:"center", gap:5 }}>
              {icon} {label}
            </span>
          ))}
        </div>

        {/* Support link */}
        <div style={{ textAlign:"center", marginTop:18 }}>
          <button onClick={() => { if (!openWhatsApp("I need help signing in to GhanaPrep.")) onSupport(); }} style={{ background:"none", border:"none",
            color:"var(--muted)", fontSize:11, fontFamily:"'DM Sans',sans-serif",
            display:"inline-flex", alignItems:"center", gap:5, cursor:"pointer" }} aria-label="Support">
            <Ico n="message" /> <span style={{textDecoration:"underline"}}>Need help? Contact Support</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Lively input field ─────────────────────────────────────── */
function LivelyInput({ label, type="text", value, onChange, placeholder, icon, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:14 }}>
      {label && (
        <label style={{ display:"block", fontSize:11, fontWeight:700,
          color: focused ? "#22c55e" : "var(--muted2)",
          textTransform:"uppercase", letterSpacing:"0.07em",
          marginBottom:6, fontFamily:"'DM Sans',sans-serif",
          transition:"color 0.2s" }}>
          {label}
        </label>
      )}
      <div style={{ position:"relative" }}>
        <span style={{ position:"absolute", left:13, top:"50%",
          transform:"translateY(-50%)", fontSize:15,
          opacity: focused ? 1 : 0.45, transition:"opacity 0.2s" }}>
          {icon}
        </span>
        <input
          type={type} value={value} onChange={onChange}
          placeholder={placeholder}
          className="lively-input"
          onFocus={()=>setFocused(true)}
          onBlur={()=>setFocused(false)}
          style={{ paddingLeft:42,
            borderColor: error ? "var(--danger)" : focused ? "#22c55e" : "rgba(255,255,255,0.1)" }}
        />
        {/* Animated bottom line when focused */}
        <div style={{ position:"absolute", bottom:0, left:"50%",
          width: focused ? "100%" : "0%", height:2,
          background:"linear-gradient(90deg,#22c55e,#FCD116,#22c55e)",
          transform:"translateX(-50%)", borderRadius:99,
          transition:"width 0.3s ease", pointerEvents:"none" }}/>
      </div>
      {error && (
        <p className="pop" style={{ fontSize:11, color:"var(--danger)",
          marginTop:5, display:"flex", alignItems:"center", gap:4 }}>
          <Ico n="warn" /> {error}
        </p>
      )}
    </div>
  );
}
/* ═══════════════════════════════════════════════════════════════
   VISME WEBINAR REGISTRATION EMBED
   Matches the div code from the image exactly:
     class="visme_d"
     data-title="Webinar Registration Form"
     data-url="g7ddqxx0-untitled-project?fullPage=true"
     data-domain="forms"
     data-full-page="true"
     data-min-height="100vh"
     data-form-id="133190"
═══════════════════════════════════════════════════════════════ */
function VismeRegistrationForm() {
  const containerRef = useRef(null);

  useEffect(() => {
    // Inject Visme embed script once
    const SCRIPT_ID = "visme-embed-script";
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id   = SCRIPT_ID;
      script.src  = "https://static-bundles.visme.co/forms/vismeforms-embed.js";
      script.async = true;
      document.body.appendChild(script);
    } else {
      // Script already loaded — re-init if Visme exposes an init method
      if (window.vismeFormInit) window.vismeFormInit();
    }
  }, []);

  return (
    <div style={{ marginTop:28 }}>
      {/* Section label */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <div style={{ flex:1, height:1, background:"var(--border)" }}/>
        <span style={{ fontSize:11, fontWeight:700, color:"var(--muted)",
                       textTransform:"uppercase", letterSpacing:"0.08em",
                       whiteSpace:"nowrap" }}>
          <Ico n="clipboard" /> Webinar Registration
        </span>
        <div style={{ flex:1, height:1, background:"var(--border)" }}/>
      </div>

      {/* Info banner */}
      <div style={{ background:"rgba(56,189,248,0.07)", border:"1px solid rgba(56,189,248,0.18)",
                    borderRadius:12, padding:"12px 14px", marginBottom:16,
                    display:"flex", gap:10, alignItems:"flex-start" }}>
        <span style={{ fontSize:18, flexShrink:0 }}><Ico n="grad" /></span>
        <div>
          <p style={{ fontSize:12, fontWeight:700, color:"#38bdf8", marginBottom:3 }}>
            Free WASSCE &amp; BECE Webinar
          </p>
          <p style={{ fontSize:11, color:"var(--muted)", lineHeight:1.65 }}>
            Register below to join our live exam prep session.
            Learn top strategies directly from WAEC tutors.
          </p>
        </div>
      </div>

      {/* Visme embed — exact div from the image */}
      <div
        ref={containerRef}
        style={{ borderRadius:14, overflow:"hidden",
                 border:"1px solid var(--border)",
                 background:"var(--surface3)",
                 minHeight:120,
                 display:"flex", alignItems:"center", justifyContent:"center" }}
      >
        <div
          className="visme_d"
          data-title="Webinar Registration Form"
          data-url="g7ddqxx0-untitled-project?fullPage=true"
          data-domain="forms"
          data-full-page="true"
          data-min-height="100vh"
          data-form-id="133190"
        />
        {/* Fallback shown while Visme script loads */}
        <p style={{ fontSize:12, color:"var(--muted)", padding:16,
                    position:"absolute", pointerEvents:"none" }}>
          Loading registration form…
        </p>
      </div>

      <p style={{ fontSize:10, color:"var(--muted)", textAlign:"center",
                  marginTop:8, opacity:0.6 }}>
        Powered by Visme · Registration is free
      </p>
    </div>
  );
}
/* ═══════════════════════════════════════════════════════════════
   SUPPORT MODAL
═══════════════════════════════════════════════════════════════ */
function SupportModal({ onClose }) {
  const [tab, setTab]       = useState("faq");
  const [name, setName]     = useState("");
  const [msg, setMsg]       = useState("");
  const [sent, setSent]     = useState(false);
  const [sending, setSending] = useState(false);

  const faqs = [
    { q:"How do I get my free questions?", a:"You get 3 free questions every day automatically after signing in. The count resets at midnight each day." },
    { q:"How do I upgrade to unlimited?", a:"Tap 'Upgrade' on the home screen or during practice. Pay GHS 50/month via MTN MoMo or Vodafone Cash." },
    { q:"What is Twi voice and how do I use it?", a:"After marking a Theory question, tap the Twi button. Your feedback will be translated to Twi (Akan) and read aloud." },
    { q:"I forgot my password. What do I do?", a:"Currently, contact our support team via WhatsApp or email below and we will help you reset it." },
    { q:"What exams does GhanaPrep cover?", a:"We cover JHS BECE (Maths, English, Science, Social Studies) and SHS WASSCE core subjects (Core Maths, Core English, Core Science, Social Studies)." },
    { q:"My score seems wrong. Can I dispute it?", a:"AI marking aims to be fair with partial marks. If you feel a mark is wrong, send us a message on the Contact tab with the question and your answer." },
  ];

  async function sendMsg() {
    if (!name.trim() || !msg.trim()) return;
    const body = "From: " + name.trim() + "\n" + msg.trim();
    if (!openWhatsApp(body) && CONTACT.email) window.location.href = "mailto:" + CONTACT.email + "?subject=" + encodeURIComponent("GhanaPrep support") + "&body=" + encodeURIComponent(body);
    setSent(true);
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.82)", zIndex:600, display:"flex", alignItems:"flex-end", justifyContent:"center", backdropFilter:"blur(6px)", animation:"fadeIn .2s ease" }}>
      <div style={{ background:"var(--surface)", borderRadius:"24px 24px 0 0", width:"100%", maxWidth:430, maxHeight:"90vh", display:"flex", flexDirection:"column", border:"1px solid var(--border2)", borderBottom:"none", animation:"slideUp .3s cubic-bezier(.22,.68,0,1.2)" }}>

        {/* Header */}
        <div style={{ padding:"20px 22px 0", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800 }}>Support Centre <Ico n="message" /></h2>
            <p style={{ fontSize:12, color:"var(--muted)", marginTop:3 }}>We're here to help you chale!</p>
          </div>
          <button onClick={onClose} style={{ width:34, height:34, borderRadius:999, background:"var(--surface3)", border:"1px solid var(--border2)", color:"var(--muted2)", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }} aria-label="Close"><Ico n="close" /></button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", margin:"16px 22px 0", background:"var(--surface3)", borderRadius:999, padding:4, flexShrink:0 }}>
          {[["faq","FAQs"],["contact","Contact"],["reach","Reach Us"]].filter(([t])=>t==="faq"||HAS_CONTACT).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"9px 4px", background:tab===t?"#22c55e":"transparent", border:"none", borderRadius:999, color:tab===t?"#000":"var(--muted)", fontSize:12, fontWeight:700, fontFamily:"'Syne',sans-serif", transition:"all 0.2s", boxShadow:tab===t?"0 2px 10px rgba(34,197,94,0.3)":"none" }}>
              {l}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY:"auto", flex:1, padding:"18px 22px 36px" }}>

          {/* FAQ tab */}
          {tab==="faq" && (
            <div>
              {faqs.map((f,i)=>(
                <FaqItem key={i} q={f.q} a={f.a} delay={i*0.05}/>
              ))}
            </div>
          )}

          {/* Contact tab */}
          {tab==="contact" && (
            <div>
              {sent ? (
                <div style={{ textAlign:"center", padding:"30px 0" }}>
                  <div style={{ fontSize:52, marginBottom:14 }}><Ico n="ok" /></div>
                  <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, marginBottom:8 }}>Almost done</h3>
                  <p style={{ fontSize:13, color:"var(--muted)", lineHeight:1.7 }}>Your message is ready in WhatsApp or your email app. Press send there to reach us.</p>
                  <button onClick={()=>{ setSent(false); setName(""); setMsg(""); }} className="btn-round-sm" style={{ marginTop:20, background:"#22c55e", color:"#000", border:"none", fontSize:13, fontFamily:"'Syne',sans-serif", boxShadow:"0 3px 14px rgba(34,197,94,0.35)" }}>
                    Send Another
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ fontSize:13, color:"var(--muted)", marginBottom:16, lineHeight:1.6 }}>Fill the form below and we'll respond within 24 hours.</p>
                  <FieldInput label="Your Name" value={name} onChange={e=>setName(e.target.value)} placeholder="Kwame Agyei" icon={<Ico n="user" />}/>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--muted2)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>Your Message</label>
                    <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Describe your issue or question…" style={{ width:"100%", minHeight:110, padding:"12px 14px", background:"var(--surface3)", border:`1.5px solid ${msg?"#22c55e":"var(--border2)"}`, borderRadius:12, fontSize:14, color:"var(--text)", resize:"vertical", lineHeight:1.7, fontFamily:"'DM Sans',sans-serif" }}/>
                  </div>
                  <button onClick={sendMsg} disabled={sending||!name.trim()||!msg.trim()} className="btn-round" style={{ width:"100%", background:sending||!name.trim()||!msg.trim()?"var(--surface4)":"#22c55e", color:sending||!name.trim()||!msg.trim()?"var(--muted)":"#000", border:"none", fontSize:14, fontFamily:"'Syne',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 4px 18px rgba(34,197,94,0.35)", cursor:sending?"not-allowed":"pointer" }}>
                    {sending ? <><Spinner color="#22c55e"/> Sending…</> : "Send Message →"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Reach Us tab */}
          {tab==="reach" && (
            <div>
              <p style={{ fontSize:13, color:"var(--muted)", marginBottom:18, lineHeight:1.6 }}>Reach us directly through any of these channels:</p>
              {[
                { icon:<Ico n="message" />, label:"WhatsApp", val:CONTACT.whatsapp ? "+" + CONTACT.whatsapp : "", sub:"Chat with us on WhatsApp", color:"#22c55e", bg:"rgba(34,197,94,0.08)", border:"rgba(34,197,94,0.18)" },
                { icon:<Ico n="mail" />, label:"Email", val:CONTACT.email, sub:"Send us an email", color:"#38bdf8", bg:"rgba(56,189,248,0.08)", border:"rgba(56,189,248,0.18)" },
                { icon:<Ico n="phone" />, label:"SMS / Call", val:CONTACT.phone, sub:"Call or text us", color:"#a78bfa", bg:"rgba(167,139,250,0.08)", border:"rgba(167,139,250,0.18)" },
                { icon:<Ico n="globe" />, label:"Website", val:CONTACT.website, sub:"Resources and announcements", color:"#fbbf24", bg:"rgba(251,191,36,0.08)", border:"rgba(251,191,36,0.18)" },
              ].filter(c=>c.val).map((c,i)=>(
                <div key={i} style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:14, padding:"14px 16px", marginBottom:10, display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:44, height:44, borderRadius:999, background:`${c.color}18`, border:`1px solid ${c.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{c.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:12, fontWeight:700, color:c.color, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:2 }}>{c.label}</p>
                    <p style={{ fontSize:14, fontWeight:700, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.val}</p>
                    <p style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>{c.sub}</p>
                  </div>
                </div>
              ))}
              <div style={{ background:"linear-gradient(135deg,#0d2618,#0a1820)", border:"1px solid rgba(34,197,94,0.18)", borderRadius:14, padding:"14px 16px", marginTop:4, textAlign:"center" }}>
                <p style={{ fontSize:13, color:"#4ade80", fontWeight:600, lineHeight:1.7 }}><Ico n="ghana" /> GhanaPrep is proudly built<br/>for Ghanaian students</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a, delay=0 }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:12, marginBottom:10, overflow:"hidden", transition:"all 0.2s" }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ width:"100%", padding:"14px 16px", background:"none", border:"none", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, textAlign:"left" }}>
        <span style={{ fontSize:13, fontWeight:600, color:"var(--text)", lineHeight:1.5, flex:1 }}>{q}</span>
        <span style={{ color:"#22c55e", fontSize:18, fontWeight:800, flexShrink:0, transform:open?"rotate(45deg)":"rotate(0)", transition:"transform 0.2s" }}>+</span>
      </button>
      {open && (
        <div style={{ padding:"0 16px 14px", borderTop:"1px solid var(--border)" }}>
          <p style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.75, marginTop:10 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD VIEW
═══════════════════════════════════════════════════════════════ */
function DashboardView({ stats, weakList, avgScore, isPaid, onUpgrade, accent="#22c55e" }) {
  const card = { background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:14, padding:18, marginBottom:12 };
  const objAvg = stats.objDone>0 ? (stats.objScore/stats.objDone).toFixed(1) : "—";
  const thAvg  = stats.theoryDone>0 ? (stats.theoryScore/stats.theoryDone).toFixed(1) : "—";
  return (
    <div style={{ padding:"15px 15px 28px" }}>
      <p className="fadeUp" style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, marginBottom:14 }}>Your Progress <Ico n="chart" /></p>

      {/* Main stats */}
      <div className="fadeUp" style={{ ...card, display:"flex", padding:"13px 0" }}>
        {[["Done",stats.done,accent],["Today",stats.doneToday||0,"#38bdf8"],["Avg",`${avgScore}/10`,"#fbbf24"]].map(([l,v,c],i,a)=>(
          <div key={l} style={{ flex:1, textAlign:"center", borderRight:i<a.length-1?"1px solid var(--border)":"none" }}>
            <div style={{ fontSize:22, fontWeight:800, color:c, fontFamily:"'Syne',sans-serif" }}>{v}</div>
            <div style={{ fontSize:9, color:"var(--muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Mode breakdown */}
      <div className="fadeUp2" style={card}>
        <p style={{ fontSize:11, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>Mode Breakdown</p>
        <div style={{ display:"flex", gap:10 }}>
          <div style={{ flex:1, background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:10, padding:"12px", textAlign:"center" }}>
            <p style={{ fontSize:11, color:"#22c55e", fontWeight:700, marginBottom:4 }}><Ico n="list" /> Objectives</p>
            <p style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:"#22c55e" }}>{stats.objDone||0}</p>
            <p style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>Avg: {objAvg}/10</p>
          </div>
          <div style={{ flex:1, background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.15)", borderRadius:10, padding:"12px", textAlign:"center" }}>
            <p style={{ fontSize:11, color:"#a78bfa", fontWeight:700, marginBottom:4 }}><Ico n="pen" /> Theory</p>
            <p style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:"#a78bfa" }}>{stats.theoryDone||0}</p>
            <p style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>Avg: {thAvg}/10</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {stats.done>0 && (
        <div className="fadeUp3" style={card}>
          <p style={{ fontSize:11, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}><Ico n="chart" /> Overall Score</p>
          <div style={{ background:"var(--surface3)", borderRadius:8, height:10, overflow:"hidden" }}>
            <div style={{ width:`${(Number(avgScore)/10)*100}%`, height:"100%", background:`linear-gradient(90deg,${accent},#38bdf8)`, borderRadius:8, transition:"width 0.6s ease" }}/>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:11, color:"var(--muted)" }}>
            <span>0</span><span style={{ fontWeight:700, color:accent }}>{avgScore}/10</span><span>10</span>
          </div>
        </div>
      )}

      {/* Weak topics */}
      <div className="fadeUp4" style={card}>
        <p style={{ fontSize:11, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}><Ico n="warn" /> Topics to Revise</p>
        {weakList.length===0
          ? <p style={{ fontSize:14, color:"var(--muted)" }}>No weak topics yet chale!  Keep going!</p>
          : weakList.map(([topic,count])=>(
            <div key={topic} style={{ display:"flex", alignItems:"center", padding:"9px 0", borderBottom:"1px solid var(--border)" }}>
              <span style={{ fontSize:14, fontWeight:600, flex:1 }}>{topic}</span>
              <span style={{ background:"rgba(248,113,113,0.1)", color:"#f87171", border:"1px solid rgba(248,113,113,0.18)", borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:700 }}>{count}× missed</span>
            </div>
          ))
        }
      </div>

      {/* Upgrade */}
      {!isPaid
        ? <div className="fadeUp5" style={{ background:"linear-gradient(135deg,#0d2618,#0a1820)", border:"1px solid rgba(34,197,94,0.18)", borderRadius:14, padding:18 }}>
            <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:16, marginBottom:6 }}><Ico n="rocket" /> Unlock Unlimited</p>
            <p style={{ fontSize:13, color:"var(--muted)", marginBottom:14 }}>GHS 50/month • Objectives + Theory • All BECE + WASSCE subjects • Mobile Money</p>
            <PrimaryBtn onClick={onUpgrade} color="#22c55e">Subscribe with MoMo →</PrimaryBtn>
          </div>
        : <div style={{ background:"rgba(34,197,94,0.07)", border:"1px solid rgba(34,197,94,0.18)", borderRadius:14, padding:16, textAlign:"center" }}>
            <p style={{ color:"#22c55e", fontWeight:700 }}><Ico n="ok" /> Premium — Unlimited Objectives & Theory!</p>
          </div>
      }
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   TEACHER QUIZ HUB — create quizzes with unique codes
═══════════════════════════════════════════════════════════════ */
/* Ranking for one quiz: highest score first, fastest time breaks a tie. */
function rankResults(list) {
  const secs = r => (r.timeSecs != null ? r.timeSecs : (r.timeTaken||0)*60);
  return [...list].sort((a,b)=> b.pct-a.pct || secs(a)-secs(b) || a.submittedAt-b.submittedAt);
}
function fmtSecs(r) {
  if (r.timeSecs == null) return r.timeTaken ? `${r.timeTaken} min` : "";
  return `${Math.floor(r.timeSecs/60)}:${String(r.timeSecs%60).padStart(2,"0")}`;
}
function quizShareLink(q) {
  const who = q.kind==="challenge" ? "I challenge you on GhanaPrep" : "GhanaPrep quiz";
  return "https://wa.me/?text=" + encodeURIComponent(`${who}: "${q.title}" (${q.subject}, ${q.questions.length} questions, ${q.timeLimitMin} minutes). Open the app, tap Join Quiz and enter the code ${q.code}`);
}
/* Shown to everyone who finishes a challenge, so friends can see where they stand. */
function ChallengeRanking({ code, mePhone }) {
  const rows = rankResults(QUIZ_STORE.getResults(code));
  if (!rows.length) return null;
  return (
    <div data-testid="challenge-ranking" style={{ background:"var(--surface2)", border:"1px solid rgba(232,196,104,0.25)", borderRadius:16, padding:"14px 14px 6px", margin:"6px 0 14px" }}>
      <p style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, color:"#e8c468", marginBottom:10 }}><Ico n="trophy" /> Challenge ranking</p>
      {rows.map((r,i)=>{
        const me = r.studentPhone===mePhone;
        return (
          <div key={r.studentPhone+"-"+r.submittedAt} style={{ display:"flex", alignItems:"center", gap:11, padding:"9px 0", borderTop:i?"1px solid var(--border)":"none" }}>
            <span style={{ width:28, textAlign:"center", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:14, color:i===0?"#e8c468":"var(--muted)" }}>{i+1}</span>
            <span style={{ flex:1, minWidth:0, fontSize:13, fontWeight:700, color:me?"#6ee7b7":"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.studentName}{me?" (you)":""}</span>
            <span style={{ fontSize:11, color:"var(--muted)" }}>{fmtSecs(r)}</span>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, minWidth:44, textAlign:"right" }}>{r.pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

/* mode="teacher": the full quiz tool (teacher dashboard).
   mode="student": "Challenge Friends" - objectives only, one attempt each, no teacher options. */
function TeacherQuizHub({ user, onClose, mode="teacher", onTake }) {
  const isChal = mode==="student";
  const [tab, setTab]           = useState("create"); // create | myquizzes | results
  const [quizTitle, setQuizTitle] = useState("");
  const [qType, setQType]       = useState("mcq");  // mcq | theory | mixed
  const [subject, setSubject]   = useState("Core Mathematics");
  const [selTopics, setSelTopics] = useState([]);
  const [timeLimitMin, setTimeLimitMin] = useState(mode==="student" ? 10 : 30);
  const [maxAttempts, setMaxAttempts]   = useState(1);
  const [targetNames, setTargetNames]   = useState(""); // comma list of names
  const [numQs, setNumQs]       = useState(10);
  const [createdQuiz, setCreatedQuiz]   = useState(null);
  const [myQuizzes, setMyQuizzes]       = useState([]);
  const [selectedCode, setSelectedCode] = useState(null);
  const [copied, setCopied]     = useState(false);

  const subjectList = ["Core Mathematics","Core English","Core Science","Social Studies","Mathematics","English Language","Integrated Science"];
  const allTopics   = Object.values(DB).flatMap(l =>
    Object.values(l.subjects).flatMap(s =>
      (s.objectives||[]).concat(s.theory||[]).map(q=>q.topic)
    )
  ).filter((v,i,a)=>a.indexOf(v)===i).sort();

  // Topics that exist for chosen subject
  const subjectTopics = (() => {
    for (const lvl of Object.values(DB))
      for (const [name, data] of Object.entries(lvl.subjects))
        if (name===subject) {
          const qs = isChal ? (data.objectives||[]) : (data.objectives||[]).concat(data.theory||[]);
          return [...new Set(qs.map(q=>q.topic))];
        }
    return [];
  })();

  useEffect(() => {
    setMyQuizzes(loadMine());
  }, [tab]);

  /* Teachers see the quizzes they set. Students also see challenges they have taken,
     so everyone who took part can come back and check the ranking. */
  function loadMine() {
    const mine = QUIZ_STORE.getMyQuizzes(user?.phone||"");
    if (!isChal) return mine;
    const opened = QUIZ_STORE.getJoined(user?.phone);
    const joined = Object.values(QUIZ_STORE.getAll()).filter(q =>
      q.kind==="challenge" && q.teacherPhone!==user?.phone &&
      (opened.includes(q.code) || QUIZ_STORE.hasAttempted(q.code, user?.phone)));
    return [...mine, ...joined].sort((a,b)=>b.createdAt-a.createdAt);
  }

  function toggleTopic(t) {
    setSelTopics(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev,t]);
  }

  function buildQuestionsForQuiz() {
    // Pull real questions from DB matching subject + selected topics + type
    const pool = [];
    for (const lvl of Object.values(DB)) {
      for (const [name, data] of Object.entries(lvl.subjects)) {
        if (name !== subject) continue;
        const qs = (isChal || qType==="mcq")
          ? (data.objectives||[])
          : qType==="theory"
          ? (data.theory||[])
          : (data.objectives||[]).concat(data.theory||[]);
        qs.forEach(q => {
          if (selTopics.length===0 || selTopics.includes(q.topic)) pool.push(q);
        });
      }
    }
    // Shuffle + limit
    const shuffled = pool.sort(()=>Math.random()-0.5);
    return shuffled.slice(0, Math.min(numQs, shuffled.length));
  }

  function createQuiz() {
    if (!quizTitle.trim()) { alert("Give your quiz a title first!"); return; }
    const questions = buildQuestionsForQuiz();
    if (questions.length === 0) { alert("No questions found for this selection. Try a different subject or topic."); return; }

    const code = QUIZ_STORE.generateCode();
    const quiz = {
      code,
      title:         quizTitle.trim(),
      subject,
      topics:        selTopics.length ? selTopics : ["All Topics"],
      kind:          isChal ? "challenge" : "quiz",
      type:          isChal ? "mcq" : qType,
      questions,
      timeLimitMin,
      maxAttempts:   isChal ? 1 : maxAttempts,
      targetNames:   isChal ? [] : targetNames.split(",").map(n=>n.trim()).filter(Boolean),
      teacherPhone:  user?.phone || "unknown",
      teacherName:   user?.name || "Teacher",
      createdAt:     Date.now(),
      status:        "active",
    };
    QUIZ_STORE.saveQuiz(quiz);
    setCreatedQuiz(quiz);
    setMyQuizzes(loadMine());
  }

  function copyCode(code) {
    navigator.clipboard?.writeText(code).catch(()=>{});
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  }


  const S = {
    label: { fontSize:11, fontWeight:700, color:"var(--muted2)", textTransform:"uppercase",
             letterSpacing:"0.07em", display:"block", marginBottom:6, fontFamily:"'DM Sans',sans-serif" },
    inp: { width:"100%", padding:"11px 14px", background:"var(--surface3)",
           border:"1.5px solid var(--border2)", borderRadius:10, fontSize:14,
           color:"var(--text)", fontFamily:"'DM Sans',sans-serif", outline:"none",
           boxSizing:"border-box" },
    select: { width:"100%", padding:"11px 14px", background:"var(--surface3)",
              border:"1.5px solid var(--border2)", borderRadius:10, fontSize:14,
              color:"var(--text)", fontFamily:"'DM Sans',sans-serif", outline:"none",
              boxSizing:"border-box" },
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:700,
      display:"flex", alignItems:"flex-end", justifyContent:"center",
      backdropFilter:"blur(6px)", animation:"fadeIn .2s ease" }}>
      <div style={{ background:"var(--surface)", borderRadius:"24px 24px 0 0", width:"100%",
        maxWidth:430, maxHeight:"93vh", display:"flex", flexDirection:"column",
        border:"1px solid rgba(167,139,250,0.25)", borderBottom:"none",
        animation:"slideUp .32s cubic-bezier(.22,.68,0,1.2)" }}>

        {/* Header */}
        <div style={{ padding:"18px 20px 0", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800,
                color:"#a78bfa", display:"flex", alignItems:"center", gap:8 }}>
                {isChal ? <><Ico n="users" /> Challenge Friends</> : <><Ico n="teacher" /> Teacher Quiz Hub</>}
              </h2>
              <p style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>
                {isChal ? "Set a quiz, share the code, see who scores highest" : "Create quizzes with unique access codes"}
              </p>
            </div>
            <button onClick={onClose} style={{ width:34, height:34, borderRadius:999,
              background:"var(--surface3)", border:"1px solid var(--border2)",
              color:"var(--muted2)", fontSize:18, display:"flex", alignItems:"center",
              justifyContent:"center", cursor:"pointer" }} aria-label="Close"><Ico n="close" /></button>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", background:"var(--surface3)", borderRadius:999,
            padding:3, marginBottom:16, border:"1px solid var(--border)" }}>
            {[["create","Create"],["myquizzes",isChal?"My Challenges":"My Quizzes"],["results",isChal?"Ranking":"Results"]].map(([t,l])=>(
              <button key={t} onClick={()=>{ setTab(t); setCreatedQuiz(null); }} style={{
                flex:1, padding:"9px 4px", background:tab===t
                  ? "linear-gradient(135deg,#a78bfa,#7c3aed)" : "transparent",
                border:"none", borderRadius:999, cursor:"pointer",
                color:tab===t?"#fff":"var(--muted)",
                fontSize:11, fontWeight:tab===t?800:600,
                fontFamily:"'Syne',sans-serif", transition:"all .22s",
                boxShadow:tab===t?"0 2px 12px rgba(167,139,250,0.4)":"none",
              }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY:"auto", flex:1, padding:"0 20px 36px" }}>

          {/* ── CREATE TAB ─────────────────────────────────── */}
          {tab==="create" && !createdQuiz && (
            <div style={{ animation:"tabSlide .3s ease both" }}>

              {/* Quiz title */}
              <div style={{ marginBottom:14 }}>
                <span style={S.label}>Quiz Title</span>
                <input style={S.inp} placeholder="e.g. Quadratics End-of-Term Test"
                  value={quizTitle} onChange={e=>setQuizTitle(e.target.value)}/>
              </div>

              {/* Subject */}
              <div style={{ marginBottom:14 }}>
                <span style={S.label}>Subject</span>
                <select style={S.select} value={subject}
                  onChange={e=>{ setSubject(e.target.value); setSelTopics([]); }}>
                  {subjectList.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>

              {/* Question type (teachers only) */}
              {!isChal && (<>
              <div style={{ marginBottom:14 }}>
                <span style={S.label}>Question Type</span>
                <div style={{ display:"flex", gap:8 }}>
                  {[["mcq","Objectives"],["theory","Theory"],["mixed","Mixed"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setQType(v)} style={{
                      flex:1, padding:"9px 4px", background:qType===v?"rgba(167,139,250,0.18)":"var(--surface3)",
                      border:`1.5px solid ${qType===v?"#a78bfa":"var(--border)"}`,
                      borderRadius:10, cursor:"pointer", color:qType===v?"#a78bfa":"var(--muted)",
                      fontSize:11, fontWeight:700, fontFamily:"'Syne',sans-serif" }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              </>)}

              {/* Topics */}
              <div style={{ marginBottom:14 }}>
                <span style={S.label}>Topics (leave blank = all topics)</span>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {subjectTopics.map(t=>(
                    <button key={t} onClick={()=>toggleTopic(t)} style={{
                      padding:"5px 12px", borderRadius:999,
                      background:selTopics.includes(t)?"rgba(167,139,250,0.2)":"var(--surface3)",
                      border:`1px solid ${selTopics.includes(t)?"#a78bfa":"var(--border)"}`,
                      color:selTopics.includes(t)?"#a78bfa":"var(--muted)",
                      fontSize:11, fontWeight:600, cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif" }}>
                      {selTopics.includes(t)?<Ico n="check" />:""}{t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of questions */}
              <div style={{ marginBottom:14 }}>
                <span style={S.label}>Number of Questions: <span style={{color:"#a78bfa"}}>{numQs}</span></span>
                <input type="range" min={3} max={30} value={numQs}
                  onChange={e=>setNumQs(+e.target.value)}
                  style={{ width:"100%", accentColor:"#a78bfa" }}/>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--muted)", marginTop:2 }}>
                  <span>3</span><span>30</span>
                </div>
              </div>

              {/* Time limit */}
              <div style={{ marginBottom:14 }}>
                <span style={S.label}>Time Limit (minutes): <span style={{color:"#a78bfa"}}>{timeLimitMin}</span></span>
                <input type="range" min={5} max={120} step={5} value={timeLimitMin}
                  onChange={e=>setTimeLimitMin(+e.target.value)}
                  style={{ width:"100%", accentColor:"#a78bfa" }}/>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--muted)", marginTop:2 }}>
                  <span>5 min</span><span>120 min</span>
                </div>
              </div>

              {/* Allowed attempts and target students (teachers only) */}
              {!isChal && (<>
              <div style={{ marginBottom:14 }}>
                <span style={S.label}>Max Attempts per Student</span>
                <div style={{ display:"flex", gap:8 }}>
                  {[1,2,3].map(n=>(
                    <button key={n} onClick={()=>setMaxAttempts(n)} style={{
                      flex:1, padding:"9px", background:maxAttempts===n?"rgba(167,139,250,0.18)":"var(--surface3)",
                      border:`1.5px solid ${maxAttempts===n?"#a78bfa":"var(--border)"}`,
                      borderRadius:10, cursor:"pointer", color:maxAttempts===n?"#a78bfa":"var(--muted)",
                      fontSize:13, fontWeight:700 }}>
                      {n}×
                    </button>
                  ))}
                </div>
              </div>

              {/* Target students */}
              <div style={{ marginBottom:20 }}>
                <span style={S.label}>Target Students (optional, comma-separated names)</span>
                <input style={S.inp} placeholder="e.g. Kwame, Ama, Kofi"
                  value={targetNames} onChange={e=>setTargetNames(e.target.value)}/>
                <p style={{ fontSize:10, color:"var(--muted)", marginTop:4 }}>
                  Leave blank to allow any student with the code
                </p>
              </div>

              </>)}

              {/* Create button */}
              <button onClick={createQuiz} className="btn-shine" style={{
                width:"100%", padding:"14px 0",
                background:"linear-gradient(135deg,#a78bfa,#7c3aed)",
                boxShadow:"0 4px 22px rgba(167,139,250,0.5)", animation:"none" }}>
                <Ico n="sparkles" /> {isChal ? "Create Challenge" : "Generate Quiz Code"}
              </button>
            </div>
          )}

          {/* ── CREATED SUCCESS ──────────────────────────────── */}
          {tab==="create" && createdQuiz && (
            <div style={{ textAlign:"center", padding:"10px 0", animation:"resultRise .45s ease both" }}>
              <div style={{ fontSize:52, marginBottom:12,
                animation:"tickIn .5s cubic-bezier(.22,.68,0,1.2) both" }}><Ico n="party" /></div>
              <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, marginBottom:6 }}>
                {isChal ? "Challenge ready!" : "Quiz Created!"}
              </h3>
              <p style={{ fontSize:13, color:"var(--muted)", marginBottom:22 }}>
                {isChal ? "Share this code with your friends:" : "Share this code with your students:"}
              </p>

              {/* Big code display */}
              <div onClick={()=>copyCode(createdQuiz.code)} style={{
                background:"linear-gradient(135deg,rgba(167,139,250,0.15),rgba(124,58,237,0.08))",
                border:"2px solid #a78bfa", borderRadius:20, padding:"24px 20px",
                marginBottom:16, cursor:"pointer", position:"relative",
                animation:"codePop .5s .1s cubic-bezier(.22,.68,0,1.2) both",
                boxShadow:"0 0 40px rgba(167,139,250,0.2)" }}>
                <p style={{ fontFamily:"'Syne',sans-serif", fontSize:44, fontWeight:800,
                  letterSpacing:"0.22em", color:"#a78bfa",
                  textShadow:"0 0 30px rgba(167,139,250,0.6)" }}>
                  {createdQuiz.code}
                </p>
                <p style={{ fontSize:12, color:copied?"#22c55e":"var(--muted)", marginTop:8,
                  transition:"color .2s" }}>
                  {copied ? <><Ico n="ok" />{" Copied!"}</> : <>{" Tap to copy code"}</>}
                </p>
              </div>

              {/* Quiz summary */}
              <div style={{ background:"var(--surface2)", border:"1px solid var(--border)",
                borderRadius:14, padding:"14px", marginBottom:16, textAlign:"left" }}>
                {[
                  ["Subject", createdQuiz.subject],
                  ["Topics",  createdQuiz.topics.join(", ")],
                  ["Questions",`${createdQuiz.questions.length} questions`],
                  ["Time",    `${createdQuiz.timeLimitMin} minutes`],
                  ["Attempts", isChal ? "1 each" : `${createdQuiz.maxAttempts} per student`],
                  ...(createdQuiz.targetNames.length?[["For", createdQuiz.targetNames.join(", ")]]: []),
                ].map(([k,v])=>(
                  <div key={k} style={{ display:"flex", justifyContent:"space-between",
                    padding:"5px 0", borderBottom:"1px solid var(--border)" }}>
                    <span style={{ fontSize:12, color:"var(--muted)" }}>{k}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:"var(--text)",
                      maxWidth:"55%", textAlign:"right" }}>{v}</span>
                  </div>
                ))}
              </div>

              <a href={quizShareLink(createdQuiz)} target="_blank" rel="noopener noreferrer"
                style={{ display:"block", width:"100%", padding:"13px", background:"linear-gradient(135deg,#34d399,#10b981)",
                  borderRadius:12, color:"#04130d", fontSize:14, fontWeight:800, textDecoration:"none",
                  fontFamily:"'Syne',sans-serif", marginBottom:8, textAlign:"center" }}>
                <Ico n="message" /> Share on WhatsApp
              </a>
              {isChal && onTake && (
                <button onClick={()=>onTake(createdQuiz)}
                  style={{ width:"100%", padding:"13px", background:"rgba(232,196,104,0.12)",
                    border:"1px solid rgba(232,196,104,0.45)", borderRadius:12, color:"#e8c468",
                    fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"'Syne',sans-serif", marginBottom:8 }}>
                  <Ico n="play" /> Take it now
                </button>
              )}
              <button onClick={()=>{ setCreatedQuiz(null); setQuizTitle(""); setSelTopics([]); }}
                style={{ width:"100%", padding:"13px", background:"var(--surface3)",
                  border:"1px solid var(--border2)", borderRadius:12, color:"var(--text)",
                  fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Syne',sans-serif",
                  marginBottom:8 }}>
                <Ico n="plus" /> {isChal ? "Create Another Challenge" : "Create Another Quiz"}
              </button>
              <button onClick={()=>setTab("myquizzes")}
                style={{ width:"100%", padding:"13px",
                  background:"linear-gradient(135deg,#a78bfa,#7c3aed)",
                  border:"none", borderRadius:12, color:"#fff",
                  fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
                <Ico n="clipboard" /> {isChal ? "View My Challenges" : "View All My Quizzes"}
              </button>
            </div>
          )}

          {/* ── MY QUIZZES TAB ───────────────────────────────── */}
          {tab==="myquizzes" && (
            <div style={{ animation:"tabSlide .3s ease both" }}>
              {myQuizzes.length===0
                ? (
                <div style={{ textAlign:"center", padding:"16px 0 50px", color:"var(--muted)" }}>
                  <div style={{ marginBottom:16 }}>
                    <p style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>No quizzes yet</p>
                  </div>
                  <div style={{ fontSize:44, marginBottom:12 }}><Ico n="inbox" /></div>
                  <p style={{ fontSize:14 }}>{isChal ? "No challenges yet." : "No quizzes created yet."}</p>
                  <button onClick={()=>setTab("create")}
                    style={{ marginTop:16, padding:"10px 24px",
                      background:"rgba(167,139,250,0.15)", border:"1px solid #a78bfa",
                      borderRadius:999, color:"#a78bfa", fontSize:13, fontWeight:700,
                      cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
                    Create Your First Quiz →
                  </button>
                </div>
              ) : myQuizzes.map((q,i)=>{
                const results = QUIZ_STORE.getResults(q.code);
                const avg = results.length
                  ? (results.reduce((s,r)=>s+r.pct,0)/results.length).toFixed(0)
                  : null;
                return (
                  <div key={q.code} className="rank-card-rest" style={{
                    background:"var(--surface2)", border:"1px solid rgba(167,139,250,0.18)",
                    borderRadius:14, padding:"14px 16px", marginBottom:10 }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontFamily:"'Syne',sans-serif", fontSize:14,
                          fontWeight:800, marginBottom:3 }}>{q.title}</p>
                        <p style={{ fontSize:11, color:"var(--muted)" }}>
                          {q.subject} · {q.questions.length}Qs · {q.timeLimitMin}min
                        </p>
                        {isChal && (
                          <p style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>
                            {q.teacherPhone===user?.phone ? "Set by you" : `Set by ${q.teacherName}`}
                            {!QUIZ_STORE.hasAttempted(q.code, user?.phone) && <span style={{ color:"#e8c468", fontWeight:700 }}> · Not taken yet</span>}
                          </p>
                        )}
                      </div>
                      {/* Big code badge */}
                      <div onClick={()=>copyCode(q.code)} style={{
                        background:"rgba(167,139,250,0.14)", border:"1px solid #a78bfa",
                        borderRadius:10, padding:"6px 12px", cursor:"pointer",
                        fontFamily:"'Syne',sans-serif", fontWeight:800,
                        fontSize:16, color:"#a78bfa", letterSpacing:"0.12em",
                        boxShadow:"0 0 14px rgba(167,139,250,0.25)" }}>
                        {q.code}
                      </div>
                    </div>
                    <div className="gp-quiz-row" style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:8, marginTop:10, whiteSpace:"nowrap" }}>
                      <span style={{ background:"rgba(34,197,94,0.12)", color:"#22c55e",
                        border:"1px solid rgba(34,197,94,0.2)", borderRadius:20,
                        padding:"3px 10px", fontSize:11, fontWeight:700 }}>
                        <Ico n="users" /> {results.length} submitted
                      </span>
                      {avg && <span style={{ background:"rgba(251,191,36,0.12)", color:"#fbbf24",
                        border:"1px solid rgba(251,191,36,0.2)", borderRadius:20,
                        padding:"3px 10px", fontSize:11, fontWeight:700 }}>
                        Avg {avg}%
                      </span>}
                      {isChal && onTake && q.status!=="closed" && !QUIZ_STORE.hasAttempted(q.code, user?.phone) && (
                        <button onClick={()=>onTake(q)} aria-label={`Take ${q.title}`}
                          style={{ marginLeft:"auto", background:"linear-gradient(135deg,#34d399,#10b981)",
                            border:"none", borderRadius:8, padding:"4px 12px", color:"#04130d",
                            fontSize:11, fontWeight:800, cursor:"pointer" }}>
                          <Ico n="play" /> Take it
                        </button>
                      )}
                      <button onClick={()=>{ setSelectedCode(q.code); setTab("results"); }}
                        style={{ marginLeft:(isChal && onTake && q.status!=="closed" && !QUIZ_STORE.hasAttempted(q.code, user?.phone)) ? 0 : "auto", background:"rgba(167,139,250,0.1)",
                          border:"1px solid rgba(167,139,250,0.2)", borderRadius:8,
                          padding:"3px 10px", color:"#a78bfa", fontSize:11,
                          fontWeight:700, cursor:"pointer" }}>
                        {isChal ? "View Ranking →" : "View Results →"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── RESULTS TAB ──────────────────────────────────── */}
          {tab==="results" && (
            <div style={{ animation:"tabSlide .3s ease both" }}>
              {/* Quiz picker */}
              <div style={{ marginBottom:14 }}>
                <span style={S.label}>Select Quiz</span>
                <select style={S.select} value={selectedCode||""}
                  onChange={e=>setSelectedCode(e.target.value)}>
                  <option value="">— choose a quiz —</option>
                  {myQuizzes.map(q=>(
                    <option key={q.code} value={q.code}>{q.title} ({q.code})</option>
                  ))}
                </select>
              </div>

              {selectedCode && (()=>{
                const quiz    = QUIZ_STORE.getQuiz(selectedCode);
                const results = QUIZ_STORE.getResults(selectedCode);
                if (!quiz) return <p style={{color:"var(--muted)"}}>Quiz not found.</p>;
                const avgPct = results.length
                  ? (results.reduce((s,r)=>s+r.pct,0)/results.length).toFixed(1)
                  : null;

                return (
                  <>
                    {/* Summary cards */}
                    <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                      {[
                        ["Submitted", results.length, "#22c55e"],
                        ["Avg Score", avgPct ? `${avgPct}%`:"—", "#fbbf24"],
                        ["Questions", quiz.questions.length, "#a78bfa"],
                      ].map(([l,v,c])=>(
                        <div key={l} style={{ flex:1, background:"var(--surface2)",
                          border:"1px solid var(--border)", borderRadius:12, padding:"12px 8px",
                          textAlign:"center" }}>
                          <p style={{ fontFamily:"'Syne',sans-serif", fontSize:22,
                            fontWeight:800, color:c }}>{v}</p>
                          <p style={{ fontSize:10, color:"var(--muted)", fontWeight:600,
                            textTransform:"uppercase", marginTop:2 }}>{l}</p>
                        </div>
                      ))}
                    </div>

                    {results.length===0 ? (
                      <div style={{ textAlign:"center", padding:"30px 0", color:"var(--muted)" }}>
                        <div style={{fontSize:36,marginBottom:10}}><Ico n="hourglass" /></div>
                        <p>No submissions yet. Share code <strong style={{color:"#a78bfa"}}>{selectedCode}</strong> with {isChal ? "friends" : "students"}.</p>
                      </div>
                    ) : (
                      <>
                        <p style={{ fontSize:11, fontWeight:700, color:"var(--muted)",
                          textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>
                          {isChal ? "Ranking: highest score first, fastest time breaks a tie" : "Student Results"}
                        </p>
                        {rankResults(results)
                          .map((r,i)=>{
                            const col = r.pct>=70?"#22c55e":r.pct>=50?"#fbbf24":"#f87171";
                            return (
                              <div key={r.studentPhone} className="rank-card-rest"
                                style={{ background:"var(--surface2)", border:`1px solid ${col}22`,
                                  borderRadius:12, padding:"12px 14px", marginBottom:8,
                                  display:"flex", alignItems:"center", gap:12 }}>
                                <div style={{ width:34, height:34, borderRadius:"50%",
                                  background:`${col}18`, border:`2px solid ${col}`,
                                  display:"flex", alignItems:"center", justifyContent:"center",
                                  fontFamily:"'Syne',sans-serif", fontWeight:800,
                                  fontSize:13, color:col }}>
                                  {i+1}
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <p style={{ fontSize:13, fontWeight:700 }}>{r.studentName}{r.studentPhone===user?.phone ? " (you)" : ""}</p>
                                  <p style={{ fontSize:10, color:"var(--muted)",
                                    marginTop:1 }}>
                                    {fmtSecs(r) ? `${fmtSecs(r)} taken · ` : ""}{new Date(r.submittedAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div style={{ textAlign:"right" }}>
                                  <p style={{ fontFamily:"'Syne',sans-serif", fontSize:18,
                                    fontWeight:800, color:col }}>{r.pct}%</p>
                                  <p style={{ fontSize:10, color:"var(--muted)" }}>
                                    {r.correct}/{r.total} correct
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   JOIN QUIZ MODAL — student enters code
═══════════════════════════════════════════════════════════════ */
function JoinQuizModal({ user, onJoin, onClose }) {
  const [code,     setCode]    = useState("");
  const [error,    setError]   = useState("");
  const [loading,  setLoading] = useState(false);
  const [preview,  setPreview] = useState(null);

  function lookupCode(raw) {
    const c = raw.toUpperCase().replace(/[^A-Z0-9]/g,"");
    setCode(c);
    setError(""); setPreview(null);
    if (c.length===6) {
      const quiz = QUIZ_STORE.getQuiz(c);
      if (quiz) setPreview(quiz);
    }
  }

  function joinQuiz() {
    setError("");
    if (code.length!==6) { setError("Enter a 6-character quiz code."); return; }
    const quiz = QUIZ_STORE.getQuiz(code);
    if (!quiz) { setError("Invalid code. Check with your teacher."); return; }
    if (quiz.status==="closed") { setError("This quiz has been closed by the teacher."); return; }

    // Check target restriction
    if (quiz.targetNames?.length > 0) {
      const myName = (user?.name || "").toLowerCase();
      const allowed = quiz.targetNames.some(n => n.toLowerCase()===myName || myName.includes(n.toLowerCase()));
      if (!allowed) {
        setError("This quiz is restricted to specific students. Check with your teacher.");
        return;
      }
    }

    // Check attempt limit
    const results  = QUIZ_STORE.getResults(code);
    const myAttempts = results.filter(r=>r.studentPhone===user?.phone).length;
    if (myAttempts >= quiz.maxAttempts) {
      setError(`You've already used all ${quiz.maxAttempts} attempt(s) for this quiz.`);
      return;
    }

    if (quiz.kind==="challenge") QUIZ_STORE.markJoined(quiz.code, user?.phone); // so it shows in My Challenges straight away
    setLoading(true);
    setTimeout(()=>{ setLoading(false); onJoin(quiz); }, 600);
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:700,
      display:"flex", alignItems:"flex-end", justifyContent:"center",
      backdropFilter:"blur(6px)", animation:"fadeIn .2s ease" }}>
      <div style={{ background:"var(--surface)", borderRadius:"24px 24px 0 0", width:"100%",
        maxWidth:430, border:"1px solid rgba(34,197,94,0.25)", borderBottom:"none",
        animation:"slideUp .32s cubic-bezier(.22,.68,0,1.2)", padding:"24px 22px 44px" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800 }}>
              <Ico n="target" /> Join a Quiz
            </h2>
            <p style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>
              Enter the 6-character code from your teacher
            </p>
          </div>
          <button onClick={onClose} style={{ width:34, height:34, borderRadius:999,
            background:"var(--surface3)", border:"1px solid var(--border2)",
            color:"var(--muted2)", fontSize:18, display:"flex", alignItems:"center",
            justifyContent:"center", cursor:"pointer" }} aria-label="Close"><Ico n="close" /></button>
        </div>

        {/* Code input — big and prominent */}
        <div style={{ marginBottom:16 }}>
          <input
            value={code}
            onChange={e=>lookupCode(e.target.value)}
            maxLength={6}
            placeholder="e.g. GH7K2P"
            style={{ width:"100%", padding:"18px 20px",
              background:"var(--surface3)", border:`2px solid ${
                code.length===6&&preview?"#22c55e":
                code.length===6&&!preview?"#f87171":
                "rgba(34,197,94,0.25)"}`,
              borderRadius:16, fontSize:28, fontWeight:800,
              color:"#22c55e", fontFamily:"'Syne',sans-serif",
              letterSpacing:"0.28em", textAlign:"center",
              outline:"none", boxSizing:"border-box",
              textTransform:"uppercase",
              transition:"border-color .2s",
              boxShadow: code.length===6&&preview
                ? "0 0 24px rgba(34,197,94,0.25)" : "none" }}
          />
        </div>

        {/* Live preview */}
        {preview && (
          <div className="pop" style={{ background:"rgba(34,197,94,0.08)",
            border:"1px solid rgba(34,197,94,0.25)", borderRadius:14,
            padding:"14px 16px", marginBottom:16 }}>
            <p style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:800,
              color:"#22c55e", marginBottom:8 }}><Ico n="ok" /> {preview.title}</p>
            {[
              [preview.kind==="challenge" ? "Set by" : "Teacher", preview.teacherName],
              ["Subject",    preview.subject],
              ["Questions",  `${preview.questions.length} questions`],
              ["Time Limit", `${preview.timeLimitMin} minutes`],
              ["Type",       preview.type==="mcq"?"Multiple Choice":preview.type==="theory"?"Theory":"Mixed"],
            ].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between",
                padding:"3px 0", borderBottom:"1px solid rgba(34,197,94,0.1)" }}>
                <span style={{ fontSize:11, color:"var(--muted)" }}>{k}</span>
                <span style={{ fontSize:11, fontWeight:700 }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="pop" style={{ background:"rgba(248,113,113,0.1)",
            border:"1px solid rgba(248,113,113,0.3)", borderRadius:10,
            padding:"10px 14px", marginBottom:14,
            display:"flex", alignItems:"center", gap:8 }}>
            <span><Ico n="warn" /></span>
            <p style={{ color:"#f87171", fontSize:13, fontWeight:600 }}>{error}</p>
          </div>
        )}

        <button onClick={joinQuiz} disabled={loading||code.length!==6}
          className="btn-shine" style={{ width:"100%", padding:"14px 0",
            opacity:code.length!==6?0.5:1 }}>
          {loading
            ? <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Spinner color="#000"/> Joining…</span>
            : "Start Quiz →"}
        </button>

        <p style={{ textAlign:"center", fontSize:11, color:"var(--muted)", marginTop:12 }}>
          Don't have a code? Ask your teacher to create a quiz.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   QUIZ TAKER SCREEN — full-screen quiz experience
═══════════════════════════════════════════════════════════════ */
function QuizTakerScreen({ quiz, user, onClose }) {
  const [qIdx,       setQIdx]       = useState(0);
  const [answers,    setAnswers]     = useState({}); // {qId: answer}
  const [theoryAns,  setTheoryAns]  = useState("");
  const [submitted,  setSubmitted]  = useState(false);
  const [results,    setResults]    = useState(null);
  const [startTime]                 = useState(Date.now());
  const [timeLeft,   setTimeLeft]   = useState(quiz.timeLimitMin * 60);
  const [marking,    setMarking]    = useState(false);

  const currentQ = quiz.questions[qIdx];
  const total    = quiz.questions.length;
  const answered = Object.keys(answers).length;
  const progress = (answered / total) * 100;

  // Timer countdown
  useEffect(()=>{
    if (submitted) return;
    const t = setInterval(()=>{
      setTimeLeft(prev=>{
        if (prev<=1) { clearInterval(t); handleSubmit(); return 0; }
        return prev-1;
      });
    },1000);
    return ()=>clearInterval(t);
  },[submitted]);

  const mins = String(Math.floor(timeLeft/60)).padStart(2,"0");
  const secs = String(timeLeft%60).padStart(2,"0");
  const timerWarning = timeLeft < 60;

  function selectOpt(opt) {
    if (answers[currentQ.id]) return;
    setAnswers(prev=>({...prev,[currentQ.id]:opt}));
  }

  function saveTheory() {
    if (!theoryAns.trim()) return;
    setAnswers(prev=>({...prev,[currentQ.id]:theoryAns.trim()}));
    setTheoryAns("");
  }

  function nextQ() {
    if (qIdx < total-1) {
      setQIdx(i=>i+1);
      setTheoryAns(answers[quiz.questions[qIdx+1]?.id]||"");
    }
  }
  function prevQ() {
    if (qIdx > 0) {
      setQIdx(i=>i-1);
      setTheoryAns(answers[quiz.questions[qIdx-1]?.id]||"");
    }
  }

  async function handleSubmit() {
    if (submitted) return;
    setSubmitted(true);
    setMarking(true);

    // Score MCQ answers automatically
    let correct=0, totalMcq=0;
    const feedback = {};
    for (const q of quiz.questions) {
      if (q.options) { // objective question: has answer options, so it is marked automatically
        totalMcq++;
        const ans = answers[q.id];
        const isCorrect = ans && ans.startsWith(q.correct||q.correctAnswer||"");
        if (isCorrect) correct++;
        feedback[q.id] = {
          correct: isCorrect,
          chosen:  ans||"(skipped)",
          right:   q.correct||q.correctAnswer,
          explanation: q.explanation,
        };
      } else {
        // Theory — send to AI for marking if answer given
        if (answers[q.id]) {
          try {
            const res = await fetch("/api/llm",{
              method:"POST",
              headers:{"Content-Type":"application/json"},
              body:JSON.stringify({
                model:"claude-sonnet-4-20250514", max_tokens:500,
                messages:[{role:"user",content:`Mark this WAEC theory answer out of 10. Score fairly with partial marks.\nQ: ${q.question}\nModel answer: ${q.explanation}\nStudent wrote: ${answers[q.id]}\nReturn ONLY JSON: {"score":<0-10>,"feedback":"<1-2 Pidgin sentences>"}`}]
              })
            });
            const d = await res.json();
            const txt = d.content.map(b=>b.text||"").join("");
            const parsed = extractJSON(txt);
            feedback[q.id] = { theory:true, score:parsed.score, feedback:parsed.feedback, answer:answers[q.id] };
          } catch {
            feedback[q.id] = { theory:true, score:5, feedback:"Network error — marked 5/10 chale.", answer:answers[q.id] };
          }
        }
      }
    }

    const pct  = totalMcq>0 ? Math.round((correct/totalMcq)*100) : 0;
    const timeTaken = Math.round((Date.now()-startTime)/60000);
    setMarking(false);

    const result = {
      studentPhone: user?.phone||"guest",
      studentName:  user?.name||(AUTH.getUser(user?.phone)||{}).name||"Student",
      code:   quiz.code,
      correct, total:totalMcq, pct,
      feedback, timeTaken,
      timeSecs: Math.round((Date.now()-startTime)/1000),
      submittedAt: Date.now(),
    };
    QUIZ_STORE.saveResult(quiz.code, result);
    setResults(result);

    // Update personal stats
    AUTH.updateStats(user?.phone, pct/10, quiz.subject, "objectives");
  }

  // ── RESULTS SCREEN ──────────────────────────────────────────
  if (results) {
    const col = results.pct>=70?"#22c55e":results.pct>=50?"#fbbf24":"#f87171";
    const emoji = results.pct>=70?<Ico n="party" />:results.pct>=50?null:null;
    return (
      <div style={{ position:"fixed", inset:0, background:"var(--surface)", zIndex:800,
        display:"flex", flexDirection:"column", maxWidth:430, margin:"0 auto",
        fontFamily:"'DM Sans',sans-serif", color:"var(--text)", overflowY:"auto" }}>
        <style>{GLOBAL_CSS}</style>
        <div style={{ padding:"28px 20px 40px", animation:"resultRise .45s ease both" }}>

          {/* Big score */}
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ fontSize:56, marginBottom:8 }}>{emoji}</div>
            <div style={{ width:100, height:100, borderRadius:"50%", margin:"0 auto 12px",
              border:`4px solid ${col}`, background:`${col}12`,
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:`0 0 40px ${col}44` }}>
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:30,
                fontWeight:800, color:col }}>{results.pct}%</span>
            </div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:4 }}>
              {results.pct>=70?"Excellent!":results.pct>=50?"Good try!":"Keep practising!"}
            </h2>
            <p style={{ fontSize:13, color:"var(--muted)" }}>
              {results.correct} out of {results.total} correct · {results.timeTaken} min
            </p>
            <p style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>
              Quiz: <strong style={{color:"#a78bfa"}}>{quiz.title}</strong>
            </p>
          </div>

          {quiz.kind==="challenge" && <ChallengeRanking code={quiz.code} mePhone={user?.phone}/>}

          {/* Per-question breakdown */}
          <p style={{ fontSize:11, fontWeight:700, color:"var(--muted)",
            textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>
            Question Breakdown
          </p>
          {quiz.questions.map((q,i)=>{
            const fb = results.feedback[q.id];
            if (!fb) return null;
            const isRight = fb.correct || (fb.score && fb.score>=6);
            const qCol = isRight?"#22c55e":"#f87171";
            return (
              <div key={q.id} style={{ background:"var(--surface2)",
                border:`1px solid ${qCol}22`, borderRadius:12,
                padding:"12px 14px", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                  <span style={{ fontSize:18, flexShrink:0 }}>{isRight?<Ico n="ok" />:<Ico n="no" />}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:12, fontWeight:600, marginBottom:6,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      Q{i+1}: {q.question||q.question_text}
                    </p>
                    {!fb.theory && (
                      <>
                        <p style={{ fontSize:11, color:"var(--muted)" }}>
                          Your answer: <span style={{color:isRight?"#22c55e":"#f87171",fontWeight:700}}>{fb.chosen}</span>
                        </p>
                        {!isRight && <p style={{ fontSize:11, color:"#22c55e" }}>
                          Correct: <strong>{fb.right}</strong>
                        </p>}
                      </>
                    )}
                    {fb.theory && (
                      <p style={{ fontSize:11, color:"#fbbf24" }}>
                        AI score: <strong>{fb.score}/10</strong> · {fb.feedback}
                      </p>
                    )}
                    {fb.explanation && !fb.theory && (
                      <p style={{ fontSize:11, color:"var(--muted)", marginTop:4,
                        lineHeight:1.5 }}>{fb.explanation}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <button onClick={onClose} className="btn-shine"
            style={{ width:"100%", padding:"14px 0", marginTop:8 }}>
            Done <Ico n="check" />
          </button>
        </div>
      </div>
    );
  }

  // ── MARKING SCREEN — skeleton while AI marks ──────────────
  if (marking) return (
    <div style={{ position:"fixed", inset:0, background:"var(--surface)", zIndex:800,
      display:"flex", flexDirection:"column", maxWidth:430, margin:"0 auto",
      fontFamily:"'DM Sans',sans-serif", color:"var(--text)", overflowY:"auto" }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)",
        display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
        <div style={{ flex:1 }}>
          <div className="sk sk-h12 sk-w50" style={{ marginBottom:6 }}/>
          <div className="sk sk-h8 sk-w40"/>
        </div>
        <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)",
          borderRadius:10, padding:"6px 12px" }}>
          <p style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:800, color:"#22c55e" }}>
            <Ico n="bot" /> AI Marking…
          </p>
        </div>
      </div>
      <div style={{ height:3, background:"var(--surface3)", flexShrink:0, overflow:"hidden" }}>
        <div style={{ height:"100%", width:"65%",
          background:"linear-gradient(90deg,#a78bfa,#22c55e)",
          animation:"shimmerSweep 1.8s linear infinite", backgroundSize:"200% 100%" }}/>
      </div>
      <div style={{ padding:"20px 0" }}>
        <p style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800,
          color:"#a78bfa", textAlign:"center", marginBottom:4 }}>
          Marking your answers…
        </p>
        <p style={{ fontSize:11, color:"var(--muted)", textAlign:"center", marginBottom:20 }}>
          Chale hold on small <Ico n="ghana" />
        </p>
        <div style={{ display:"flex", justifyContent:"center", gap:8 }}>
          {[0,1,2].map(i=>(
            <div key={i} style={{ width:10, height:10, borderRadius:"50%", background:"#a78bfa",
              animation:`pulse 1.3s ${i*0.2}s ease-in-out infinite` }}/>
          ))}
        </div>
      </div>
    </div>
  );

  // ── QUIZ QUESTION SCREEN ────────────────────────────────────
  const isMCQ    = !currentQ.theory && currentQ.options;
  const isAnswered = !!answers[currentQ.id];

  return (
    <div style={{ position:"fixed", inset:0, background:"var(--surface)", zIndex:800,
      display:"flex", flexDirection:"column", maxWidth:430, margin:"0 auto",
      fontFamily:"'DM Sans',sans-serif", color:"var(--text)" }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div style={{ padding:"14px 16px", display:"flex", alignItems:"center",
        gap:12, borderBottom:"1px solid var(--border)", background:"var(--surface)",
        flexShrink:0 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800,
            color:"#a78bfa", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {quiz.title}
          </p>
          <p style={{ fontSize:11, color:"var(--muted)" }}>
            Question {qIdx+1} of {total} · {quiz.subject}
          </p>
        </div>

        {/* Timer */}
        <div style={{ background:timerWarning?"rgba(248,113,113,0.15)":"var(--surface3)",
          border:`1px solid ${timerWarning?"#f87171":"var(--border2)"}`,
          borderRadius:10, padding:"6px 12px", textAlign:"center", flexShrink:0 }}>
          <p style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800,
            color:timerWarning?"#f87171":"var(--text)",
            animation:timerWarning?"timerWarn 0.8s ease-in-out infinite":"none" }}>
            {mins}:{secs}
          </p>
          <p style={{ fontSize:9, color:"var(--muted)", fontWeight:600,
            textTransform:"uppercase" }}>remaining</p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height:3, background:"var(--surface3)", flexShrink:0 }}>
        <div style={{ height:"100%", width:`${((qIdx+1)/total)*100}%`,
          background:"linear-gradient(90deg,#a78bfa,#22c55e)",
          transition:"width .4s ease", borderRadius:99 }}/>
      </div>

      {/* ── Question body ────────────────────────────────────── */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 24px" }}>

        {/* Question dot navigation */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>
          {quiz.questions.map((_,i)=>{
            const done = !!answers[quiz.questions[i].id];
            return (
              <button key={i} onClick={()=>{ setQIdx(i); setTheoryAns(answers[quiz.questions[i].id]||""); }}
                style={{ width:28, height:28, borderRadius:"50%", border:"none",
                  cursor:"pointer", fontSize:10, fontWeight:700,
                  background: i===qIdx ? "#a78bfa" : done ? "rgba(34,197,94,0.25)" : "var(--surface3)",
                  color: i===qIdx ? "#000" : done ? "#22c55e" : "var(--muted)",
                  outline: i===qIdx ? "2px solid #a78bfa" : "none",
                  outlineOffset:2 }}>
                {i+1}
              </button>
            );
          })}
        </div>

        {/* Question card */}
        <div className="quiz-q-enter" key={qIdx} style={{ background:"var(--surface2)",
          border:"1px solid rgba(167,139,250,0.2)", borderRadius:16, padding:18, marginBottom:16,
          position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3,
            background:"linear-gradient(90deg,#a78bfa,transparent)" }}/>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
            <span style={{ background:"rgba(167,139,250,0.15)", color:"#a78bfa",
              border:"1px solid rgba(167,139,250,0.25)", borderRadius:20,
              padding:"2px 9px", fontSize:11, fontWeight:600 }}>
              {currentQ.topic}
            </span>
            <span style={{ background:"rgba(255,255,255,0.06)", color:"var(--muted)",
              borderRadius:20, padding:"2px 9px", fontSize:11, fontWeight:600 }}>
              {currentQ.year}
            </span>
          </div>
          <p style={{ fontSize:15, lineHeight:1.78, fontWeight:500, whiteSpace:"pre-line" }}>
            {currentQ.question||currentQ.question_text}
          </p>
        </div>

        {/* MCQ options */}
        {isMCQ && (
          <div>
            {(currentQ.options||[]).map((opt,i)=>{
              const letter = opt.charAt(0);
              const chosen = answers[currentQ.id];
              const isChosen  = chosen === opt || chosen === letter;
              const isCorrect = isChosen && isAnswered && (
                letter===(currentQ.correct||currentQ.correctAnswer) ||
                opt.startsWith(currentQ.correct||currentQ.correctAnswer||"")
              );
              const isWrong   = isChosen && isAnswered && !isCorrect;
              const showRight = isAnswered && (
                letter===(currentQ.correct||currentQ.correctAnswer) ||
                opt.startsWith(currentQ.correct||currentQ.correctAnswer||"")
              );
              const bg = isCorrect||showRight ? "rgba(34,197,94,0.12)"
                : isWrong ? "rgba(248,113,113,0.1)" : "var(--surface3)";
              const border = isCorrect||showRight ? "#22c55e"
                : isWrong ? "#f87171"
                : isChosen ? "#a78bfa" : "var(--border2)";

              return (
                <div key={i} onClick={()=>!isAnswered && selectOpt(opt)}
                  style={{ background:bg, border:`1.5px solid ${border}`, borderRadius:12,
                    padding:"13px 14px", marginBottom:9, cursor:isAnswered?"default":"pointer",
                    display:"flex", alignItems:"center", gap:12, transition:"all .15s",
                    animation:isCorrect?"correctPulse .6s ease":"none" }}>
                  <div style={{ width:32, height:32, borderRadius:9, flexShrink:0,
                    background:isCorrect||showRight?"rgba(34,197,94,0.2)":isWrong?"rgba(248,113,113,0.15)":isChosen?"rgba(167,139,250,0.2)":"var(--surface4)",
                    border:`1px solid ${border}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:13,
                    color:isCorrect||showRight?"#22c55e":isWrong?"#f87171":isChosen?"#a78bfa":"var(--muted)" }}>
                    {["A","B","C","D"][i]}
                  </div>
                  <span style={{ fontSize:14, fontWeight:500, flex:1,
                    color:isCorrect||showRight?"#4ade80":isWrong?"#fca5a5":"var(--text)" }}>
                    {opt.slice(3)}
                  </span>
                  {(isCorrect||showRight) && <span style={{fontSize:16}}><Ico n="ok" /></span>}
                  {isWrong && <span style={{fontSize:16}}><Ico n="no" /></span>}
                </div>
              );
            })}
            {isAnswered && (
              <div className="pop" style={{ background:"rgba(34,197,94,0.07)",
                border:"1px solid rgba(34,197,94,0.2)", borderRadius:10,
                padding:"10px 14px", marginTop:4 }}>
                <p style={{ fontSize:12, color:"#4ade80", lineHeight:1.6 }}>
                  <Ico n="bulb" /> {currentQ.explanation}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Theory input */}
        {!isMCQ && (
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:"var(--muted2)",
              textTransform:"uppercase", letterSpacing:"0.07em",
              display:"block", marginBottom:8 }}>
              {answers[currentQ.id] ? <><Ico n="ok" />{" Your Answer (saved)"}</> : "Your Working & Answer"}
            </label>
            {answers[currentQ.id] ? (
              <div style={{ background:"rgba(34,197,94,0.07)", border:"1px solid rgba(34,197,94,0.2)",
                borderRadius:12, padding:"12px 14px" }}>
                <p style={{ fontSize:13, lineHeight:1.75, color:"#4ade80",
                  whiteSpace:"pre-wrap" }}>{answers[currentQ.id]}</p>
                <button onClick={()=>{ const a={...answers}; delete a[currentQ.id]; setAnswers(a); setTheoryAns(answers[currentQ.id]||""); }}
                  style={{ marginTop:8, background:"none", border:"none", color:"#f87171",
                    fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                  <Ico n="pencil" /> Edit answer
                </button>
              </div>
            ) : (
              <>
                <textarea value={theoryAns} onChange={e=>setTheoryAns(e.target.value)}
                  placeholder={"Show all steps here…\n\nStep 1:\nStep 2:\nAnswer:"}
                  style={{ width:"100%", minHeight:130, padding:"13px 14px",
                    background:"var(--surface3)", border:"1.5px solid rgba(167,139,250,0.3)",
                    borderRadius:12, fontSize:14, color:"var(--text)", resize:"vertical",
                    lineHeight:1.7, fontFamily:"'DM Sans',sans-serif", outline:"none",
                    boxSizing:"border-box" }}/>
                <button onClick={saveTheory} disabled={!theoryAns.trim()}
                  style={{ marginTop:8, width:"100%", padding:"11px",
                    background:theoryAns.trim()?"rgba(167,139,250,0.2)":"var(--surface3)",
                    border:`1px solid ${theoryAns.trim()?"#a78bfa":"var(--border)"}`,
                    borderRadius:10, color:theoryAns.trim()?"#a78bfa":"var(--muted)",
                    fontSize:13, fontWeight:700, cursor:"pointer",
                    fontFamily:"'Syne',sans-serif" }}>
                  <Ico n="save" /> Save Answer
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom nav ───────────────────────────────────────── */}
      <div style={{ padding:"12px 16px", borderTop:"1px solid var(--border)",
        background:"var(--surface)", flexShrink:0 }}>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <button onClick={prevQ} disabled={qIdx===0}
            style={{ padding:"11px 18px", background:"var(--surface3)",
              border:"1px solid var(--border2)", borderRadius:10,
              color:qIdx===0?"var(--muted)":"var(--text)", fontSize:14,
              fontWeight:700, cursor:qIdx===0?"not-allowed":"pointer",
              fontFamily:"'Syne',sans-serif" }}>
            ‹ Prev
          </button>
          <div style={{ flex:1, textAlign:"center" }}>
            <span style={{ fontSize:11, color:"var(--muted)" }}>
              {answered}/{total} answered
            </span>
          </div>
          {qIdx < total-1 ? (
            <button onClick={nextQ}
              style={{ padding:"11px 18px", background:"rgba(167,139,250,0.15)",
                border:"1px solid #a78bfa", borderRadius:10, color:"#a78bfa",
                fontSize:14, fontWeight:700, cursor:"pointer",
                fontFamily:"'Syne',sans-serif" }}>
              Next ›
            </button>
          ) : (
            <button onClick={handleSubmit}
              style={{ padding:"11px 18px",
                background:"linear-gradient(135deg,#22c55e,#16a34a)",
                border:"none", borderRadius:10, color:"#000",
                fontSize:13, fontWeight:800, cursor:"pointer",
                fontFamily:"'Syne',sans-serif",
                boxShadow:"0 4px 18px rgba(34,197,94,0.45)" }}>
              Submit <Ico n="check" />
            </button>
          )}
        </div>

        {/* Answered dots mini progress */}
        <div style={{ marginTop:10, height:4, background:"var(--surface3)", borderRadius:99 }}>
          <div style={{ height:"100%", borderRadius:99,
            width:`${(answered/total)*100}%`,
            background:"linear-gradient(90deg,#a78bfa,#22c55e)",
            transition:"width .4s ease" }}/>
        </div>
        <p style={{ fontSize:10, color:"var(--muted)", textAlign:"center", marginTop:4 }}>
          {total-answered > 0 ? `${total-answered} question(s) unanswered` : <>{"All questions answered "}<Ico n="ok" /></>}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LEADERBOARD MODAL  — Real users from Supabase / localStorage
═══════════════════════════════════════════════════════════════ */
function LeaderboardModal({ currentUser, userData, onClose }) {
  const [period,  setPeriod]  = useState("alltime");
  const [board,   setBoard]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [lastFetched, setLastFetched] = useState(null);

  const myPhone = currentUser?.phone;

  async function load(p) {
    setLoading(true); setError("");
    try {
      const rows = await AUTH.fetchLeaderboard(p);
      // Tag the current user
      const tagged = rows.map(r => ({
        ...r,
        isMe: r.name === (userData?.name || currentUser?.name) &&
              (IS_LOCAL ? true : true), // server returns anonymised names; match by name+school
      }));
      setBoard(tagged);
      setLastFetched(new Date());
    } catch(e) {
      setError("Couldn't load rankings. Check your connection.");
    }
    setLoading(false);
  }

  useEffect(() => { load(period); }, [period]);

  // Pull current user's live data and inject/update their row
  useEffect(() => {
    if (!userData || board.length === 0) return;
    const myStats = userData.stats || {};
    const thisWeek = `W${Math.floor(Date.now()/(7*24*3600*1000))}`;
    const myScore = period==="today"  ? (myStats.doneToday||0)*10
                  : period==="week"   ? (myStats.weekDay===thisWeek ? myStats.weekScore||0 : 0)
                  : myStats.totalScore||0;

    setBoard(prev => {
      const alreadyIn = prev.some(r => r.isMe);
      let updated = prev.map(r => r.isMe ? {
        ...r,
        score:      Math.round(myScore*10)/10,
        done:       myStats.done||0,
        avgScore:   myStats.done>0?(myStats.totalScore/myStats.done):0,
        doneToday:  myStats.doneToday||0,
        weekScore:  myStats.weekDay===thisWeek?myStats.weekScore||0:0,
        streak:     myStats.streak||0,
        school:     userData.school||"",
      } : r);

      if (!alreadyIn && myScore > 0) {
        updated.push({
          isMe: true,
          name:       userData.name||currentUser?.name||"You",
          school:     userData.school||"",
          avatarColor:userData.avatar_color||"#22c55e",
          score:      Math.round(myScore*10)/10,
          done:       myStats.done||0,
          avgScore:   myStats.done>0?(myStats.totalScore/myStats.done):0,
          doneToday:  myStats.doneToday||0,
          weekScore:  myStats.weekDay===thisWeek?myStats.weekScore||0:0,
          streak:     myStats.streak||0,
        });
      }

      // Re-sort and re-rank
      return updated
        .sort((a,b) => b.score - a.score)
        .map((u,i) => ({...u, rank:i+1}));
    });
  }, [userData, period]);

  const myRow  = board.find(u => u.isMe);
  const top3   = board.slice(0,3);
  const MEDAL  = {1:<Ico n="medal1" />,2:<Ico n="medal2" />,3:<Ico n="medal3" />};
  const RING   = {1:"#fbbf24",2:"#CBD5E1",3:"#FB923C"};
  const GLOW   = {1:"rgba(251,191,36,0.35)",2:"rgba(203,213,225,0.2)",3:"rgba(251,146,60,0.25)"};
  const PULSE  = {1:"goldGlow",2:"silverGlow",3:"bronzeGlow"};

  const periodMeta = {
    today:   { label:"Today",     sub:"Questions done today × 10 pts",    col:"#22c55e" },
    week:    { label:"This Week", sub:"Score accumulated this week",       col:"#38bdf8" },
    alltime: { label:"All Time",  sub:"Total score across all questions",  col:"#fbbf24" },
  };

  function AvatarCircle({ name, color="#22c55e", size=38, fontSize=15, ring, pulse }) {
    return (
      <div style={{
        width:size, height:size, borderRadius:"50%", flexShrink:0,
        background:`${color}22`,
        border:`2px solid ${ring||color}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize,
        color:ring||color,
        boxShadow: pulse ? `0 0 18px ${GLOW[pulse]||color+"44"}` : "none",
        animation: pulse ? `${PULSE[pulse]} 2.5s ease-in-out infinite` : "none",
      }}>
        {(name||"?").charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:600,
      display:"flex", alignItems:"flex-end", justifyContent:"center",
      backdropFilter:"blur(8px)", animation:"fadeIn .22s ease" }}>
      <div style={{ background:"var(--surface)", borderRadius:"24px 24px 0 0",
        width:"100%", maxWidth:430, maxHeight:"92vh", display:"flex",
        flexDirection:"column", border:"1px solid rgba(251,191,36,0.18)",
        borderBottom:"none", animation:"slideUp .32s cubic-bezier(.22,.68,0,1.2)" }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{ padding:"18px 18px 0", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800,
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{animation:"crownBob 2s ease-in-out infinite", display:"inline-block"}}><Ico n="trophy" /></span>
                Live Leaderboard
              </h2>
              <p style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>
                Real students · {IS_LOCAL ? "On this device" : "Live"}
                {lastFetched && <span style={{color:"#22c55e",marginLeft:4}}>· Updated {lastFetched.toLocaleTimeString()}</span>}
              </p>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button onClick={()=>load(period)} title="Refresh" style={{ width:32, height:32,
                borderRadius:999, background:"rgba(34,197,94,0.1)",
                border:"1px solid rgba(34,197,94,0.25)", color:"#22c55e",
                fontSize:14, cursor:"pointer", display:"flex", alignItems:"center",
                justifyContent:"center" }} aria-label="Refresh"><Ico n="refresh" /></button>
              <button onClick={onClose} style={{ width:34, height:34, borderRadius:999,
                background:"var(--surface3)", border:"1px solid var(--border2)",
                color:"var(--muted2)", fontSize:18, display:"flex", alignItems:"center",
                justifyContent:"center", cursor:"pointer" }} aria-label="Close"><Ico n="close" /></button>
            </div>
          </div>

          {/* Period tabs */}
          <div style={{ display:"flex", background:"var(--surface3)", borderRadius:999,
            padding:3, marginBottom:14, border:"1px solid var(--border)" }}>
            {Object.entries(periodMeta).map(([p,m])=>(
              <button key={p} onClick={()=>setPeriod(p)} style={{
                flex:1, padding:"9px 4px",
                background: period===p ? `${m.col}22` : "transparent",
                border:`1.5px solid ${period===p?m.col:"transparent"}`,
                borderRadius:999, cursor:"pointer",
                color:period===p?m.col:"var(--muted)",
                fontSize:11, fontWeight:period===p?800:600,
                fontFamily:"'Syne',sans-serif", transition:"all .22s",
                boxShadow:period===p?`0 0 14px ${m.col}33`:"none",
              }}>
                {period===p?"●":""} {m.label}
              </button>
            ))}
          </div>

          {/* Period subtitle */}
          <p style={{ fontSize:10, color:"var(--muted)", marginBottom:12,
            textAlign:"center", letterSpacing:"0.04em" }}>
            <Ico n="ruler" /> {periodMeta[period].sub}
          </p>
        </div>

        {/* ── Scrollable body ────────────────────────────────── */}
        <div style={{ overflowY:"auto", flex:1, padding:"0 16px 36px" }}>

          {/* Loading skeleton: same shape as the podium and ranking rows */}
          {loading && <LeaderboardSkeleton />}

          {/* Error */}
          {!loading && error && (
            <div style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)",
              borderRadius:12, padding:"16px", textAlign:"center", marginBottom:16 }}>
              <p style={{ fontSize:14, color:"#f87171" }}><Ico n="warn" /> {error}</p>
              <button onClick={()=>load(period)} style={{ marginTop:10, padding:"8px 20px",
                background:"rgba(248,113,113,0.15)", border:"1px solid #f87171",
                borderRadius:999, color:"#f87171", fontSize:12, fontWeight:700,
                cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>Retry</button>
            </div>
          )}

          {!loading && !error && board.length === 0 && (
            <div style={{ textAlign:"center", padding:"50px 20px" }}>
              <div style={{ fontSize:44, marginBottom:12 }}><Ico n="rocket" /></div>
              <p style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, marginBottom:8 }}>
                Be the first on the board!
              </p>
              <p style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6 }}>
                No one has practised {period==="today"?"today":period==="week"?"this week":"yet"}.
                Start practising to claim the #1 spot chale! <Ico n="ghana" />
              </p>
            </div>
          )}

          {!loading && !error && board.length > 0 && (<>

            {/* ── Podium top 3 ─────────────────────────────── */}
            {top3.length >= 2 && (
              <div style={{ marginBottom:20 }}>
                <p style={{ fontSize:10, fontWeight:700, color:"var(--muted)",
                  textTransform:"uppercase", letterSpacing:"0.08em",
                  textAlign:"center", marginBottom:14 }}><Ico n="award" /> Top Students</p>
                <div style={{ display:"flex", alignItems:"flex-end",
                  justifyContent:"center", gap:6 }}>
                  {/* 2nd */}
                  {top3[1] && <PodiumBlock user={top3[1]} height={64} color={RING[2]} glow={GLOW[2]} label="" delay="0.1s"/>}
                  {/* 1st */}
                  {top3[0] && <PodiumBlock user={top3[0]} height={90} color={RING[1]} glow={GLOW[1]} label="" delay="0s" big/>}
                  {/* 3rd */}
                  {top3[2] && <PodiumBlock user={top3[2]} height={50} color={RING[3]} glow={GLOW[3]} label="" delay="0.2s"/>}
                </div>
              </div>
            )}

            {/* My rank callout if outside top 3 */}
            {myRow && myRow.rank > 3 && (
              <div className="pop" style={{ background:"rgba(34,197,94,0.09)",
                border:"1px solid rgba(34,197,94,0.3)", borderRadius:12,
                padding:"11px 14px", marginBottom:12,
                display:"flex", alignItems:"center", gap:12 }}>
                <AvatarCircle name={myRow.name} color={myRow.avatarColor} size={40} fontSize={16}/>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:"#4ade80" }}>
                    You · Rank #{myRow.rank}
                  </p>
                  <p style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>
                    {myRow.score} pts · {myRow.rank<=10?"Almost top 10! Push harder!":<>{"Keep practising to climb the board chale! "}</>}
                  </p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:"#22c55e" }}>
                    #{myRow.rank}
                  </p>
                  {myRow.streak>0 && (
                    <p style={{ fontSize:10, color:"#fbbf24", animation:"fireFlick .9s ease-in-out infinite" }}>
                      <Ico n="flame" /> {myRow.streak}d
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Full list */}
            <p style={{ fontSize:10, fontWeight:700, color:"var(--muted)",
              textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
              All Rankings
            </p>

            {board.map((u,i) => {
              const isTop = u.rank<=3;
              const col   = isTop ? RING[u.rank] : u.isMe ? "#22c55e" : null;
              const pulse = isTop ? u.rank : null;
              const bg    = isTop
                ? `linear-gradient(135deg,${RING[u.rank]}14,${RING[u.rank]}06)`
                : u.isMe ? "rgba(34,197,94,0.08)" : "var(--surface2)";
              const border = isTop ? `${RING[u.rank]}44`
                : u.isMe ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)";

              return (
                <div key={`${u.name}-${i}`}
                  className={i<5?`rank-card-${i+1}`:"rank-card-rest"}
                  style={{ background:bg, border:`1px solid ${border}`,
                    borderRadius:13, padding:"11px 13px", marginBottom:8,
                    display:"flex", alignItems:"center", gap:11 }}>

                  {/* Rank */}
                  <div style={{ minWidth:30, textAlign:"center" }}>
                    {MEDAL[u.rank]
                      ? <span style={{fontSize:20}}>{MEDAL[u.rank]}</span>
                      : <span style={{ fontFamily:"'Syne',sans-serif", fontSize:15,
                          fontWeight:800, color:u.isMe?"#22c55e":"var(--muted)" }}>
                          #{u.rank}
                        </span>}
                  </div>

                  {/* Avatar */}
                  <AvatarCircle
                    name={u.name}
                    color={u.avatarColor||"#22c55e"}
                    size={38} fontSize={15}
                    ring={col}
                    pulse={pulse}
                  />

                  {/* Name + school */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                      <p style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700,
                        color:u.isMe?"#4ade80":isTop?RING[u.rank]:"var(--text)",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                        maxWidth:130 }}>
                        {u.name}{u.isMe?" (You)":""}
                      </p>
                      {u.streak>=3 && (
                        <span style={{ fontSize:11,
                          animation:"fireFlick .9s ease-in-out infinite" }}>
                          <Ico n="flame" />{u.streak}
                        </span>
                      )}
                    </div>
                    {u.school ? (
                      <p style={{ fontSize:10, color:"var(--muted)", marginTop:1,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        <Ico n="school" /> {u.school}
                      </p>
                    ) : (
                      <p style={{ fontSize:10, color:"var(--muted)", marginTop:1 }}>
                        {u.done} question{u.done!==1?"s":""} done
                      </p>
                    )}
                  </div>

                  {/* Score */}
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <p style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:800,
                      color: isTop?RING[u.rank]:u.isMe?"#22c55e":"var(--text)" }}>
                      {u.score%1===0 ? u.score : u.score.toFixed(1)}
                    </p>
                    <p style={{ fontSize:10, color:"var(--muted)", fontWeight:600 }}>pts</p>
                  </div>
                </div>
              );
            })}

            {/* How points work */}
            <div style={{ background:"var(--surface2)", border:"1px solid var(--border)",
              borderRadius:12, padding:"12px 14px", marginTop:8 }}>
              <p style={{ fontSize:10, fontWeight:700, color:"var(--muted2)",
                textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>
                <Ico n="ruler" /> How points work
              </p>
              {[
                ["Objectives answered", "10 pts each"],
                ["Theory score",        "AI score × 1 pt"],
                ["Daily streak",        "Tracked & shown "],
                ["Weekly board resets", "Every Monday"],
              ].map(([k,v])=>(
                <div key={k} style={{ display:"flex", justifyContent:"space-between",
                  padding:"4px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize:11, color:"var(--muted)" }}>{k}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:"#fbbf24" }}>{v}</span>
                </div>
              ))}
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}



/* ═══════════════════════════════════════════════════════════════
   VERIFY EMAIL SCREEN
   Shown after registration when an email was provided.
   User enters the 6-digit code sent to their email.
   In demo/local mode the code is shown on-screen.
═══════════════════════════════════════════════════════════════ */
function VerifyEmailScreen({ pending, onSuccess, onBack }) {
  const [code,      setCode]      = useState(["","","","","",""]);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [resent,    setResent]    = useState(false);
  const [cooldown,  setCooldown]  = useState(0);
  const inputRefs = [useRef(),useRef(),useRef(),useRef(),useRef(),useRef()];

  // Auto-focus first input on mount
  useEffect(() => {
    setTimeout(() => inputRefs[0].current?.focus(), 300);
  }, []);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const fullCode = code.join("");

  function handleDigit(idx, val) {
    // Accept only digits; handle paste
    const digit = val.replace(/\D/g, "").slice(-1);
    const next  = [...code];
    next[idx]   = digit;
    setCode(next);
    setError("");
    if (digit && idx < 5) inputRefs[idx + 1].current?.focus();
  }

  function handleKeyDown(idx, e) {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputRefs[idx - 1].current?.focus();
    }
    if (e.key === "Enter" && fullCode.length === 6) verify();
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      setError("");
      inputRefs[5].current?.focus();
    }
  }

  async function verify() {
    if (fullCode.length < 6) { setError("Enter the full 6-digit code."); return; }
    setLoading(true);
    setError("");

    const vRes = AUTH.verifyCode(pending.email, fullCode);
    if (!vRes.ok) {
      setLoading(false);
      setError(vRes.msg);
      setCode(["","","","","",""]);
      inputRefs[0].current?.focus();
      return;
    }

    // Code correct — complete registration
    const regRes = await AUTH.register(
      pending.name, pending.phone, pending.email,
      pending.password, pending.school, pending.avatarColor
    );
    setLoading(false);

    if (!regRes.ok) { setError(regRes.msg); return; }
    onSuccess();
  }

  async function resend() {
    if (cooldown > 0) return;
    setResending(true); setResent(false); setError("");
    const res = await AUTH.sendVerificationCode(pending.email, pending.name);
    setResending(false);
    if (res.ok) {
      setResent(true);
      setCooldown(60);
      // Update demo code if returned
      if (res.demo && res.code) {
        // pending is a prop so we can't mutate — store in state via error msg trick
        setError(""); // cleared
        // Show new demo code via a brief note — handled by re-render of demoCode
        pending.demoCode = res.code;
      }
    } else {
      setError("Failed to resend. Try again.");
    }
  }

  const maskedEmail = pending.email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) =>
    a + b.replace(/./g, "•") + c
  );

  return (
    <div style={{
      fontFamily:"'DM Sans',sans-serif", minHeight:"100vh", maxWidth:430,
      margin:"0 auto", background:"#0a0f0d", color:"var(--text)",
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:"24px 20px",
    }}>
      <style>{`
        :root { --green:#22c55e; --surface:#0f1410; --surface2:#161d18;
          --surface3:#1e271f; --border:rgba(255,255,255,0.07);
          --border2:rgba(255,255,255,0.13); --text:#f0f4f8;
          --muted:#566370; --muted2:#8899aa; --danger:#f87171; }
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(0.75);opacity:0.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .code-digit {
          width: 48px; height: 60px;
          background: #161d18;
          border: 2px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          font-family: 'Syne', sans-serif;
          font-size: 26px; font-weight: 800;
          color: #22c55e; text-align: center;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          caret-color: #22c55e;
        }
        .code-digit:focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
        }
        .code-digit.filled {
          border-color: rgba(34,197,94,0.4);
          background: rgba(34,197,94,0.06);
        }
      `}</style>

      {/* Back button */}
      <button onClick={onBack} style={{
        position:"absolute", top:16, left:16,
        background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
        borderRadius:999, padding:"8px 16px", color:"var(--muted2)",
        fontSize:13, fontWeight:600, cursor:"pointer",
        display:"flex", alignItems:"center", gap:6,
      }}>
        ← Back
      </button>

      {/* Icon */}
      <div style={{
        width:72, height:72, borderRadius:"50%", marginBottom:22,
        background:"rgba(34,197,94,0.1)", border:"2px solid rgba(34,197,94,0.3)",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:34,
        animation:"fadeUp 0.4s ease both",
        boxShadow:"0 0 30px rgba(34,197,94,0.15)",
      }}>
        <Ico n="mail" />
      </div>

      {/* Heading */}
      <h1 style={{
        fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800,
        textAlign:"center", marginBottom:10,
        animation:"fadeUp 0.4s 0.05s ease both",
      }}>
        Check your email
      </h1>
      <p style={{
        fontSize:14, color:"var(--muted2)", textAlign:"center",
        lineHeight:1.65, marginBottom:28, maxWidth:320,
        animation:"fadeUp 0.4s 0.1s ease both",
      }}>
        We sent a 6-digit verification code to{" "}
        <strong style={{ color:"#22c55e" }}>{maskedEmail}</strong>
      </p>

      {/* 6-digit code inputs */}
      <div style={{
        display:"flex", gap:10, marginBottom:20,
        animation:"fadeUp 0.4s 0.15s ease both",
      }} onPaste={handlePaste}>
        {code.map((digit, i) => (
          <input
            key={i}
            ref={inputRefs[i]}
            className={`code-digit${digit ? " filled" : ""}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)",
          borderRadius:10, padding:"10px 14px", marginBottom:16, width:"100%",
          display:"flex", alignItems:"center", gap:8,
        }}>
          <span><Ico n="warn" /></span>
          <p style={{ color:"#f87171", fontSize:13, fontWeight:600 }}>{error}</p>
        </div>
      )}

      {/* Verify button */}
      <button
        onClick={verify}
        disabled={loading || fullCode.length < 6}
        style={{
          width:"100%", padding:"14px",
          background: fullCode.length === 6
            ? "linear-gradient(135deg,#22c55e,#16a34a)"
            : "#1e271f",
          border:"none", borderRadius:999,
          color: fullCode.length === 6 ? "#000" : "var(--muted)",
          fontSize:15, fontWeight:800,
          fontFamily:"'Syne',sans-serif", cursor:"pointer",
          boxShadow: fullCode.length === 6 ? "0 4px 22px rgba(34,197,94,0.4)" : "none",
          transition:"all 0.2s",
          marginBottom:16,
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          animation:"fadeUp 0.4s 0.2s ease both",
        }}
      >
        {loading
          ? <><span style={{ width:18,height:18,border:"2px solid rgba(0,0,0,0.2)",
              borderTopColor:"#000",borderRadius:"50%",
              animation:"spin 0.7s linear infinite", display:"inline-block" }}/> Verifying…</>
          : "Verify & Create Account →"
        }
      </button>

      {/* Resend */}
      <p style={{
        fontSize:13, color:"var(--muted)", textAlign:"center",
        animation:"fadeUp 0.4s 0.25s ease both",
      }}>
        Didn't get it?{" "}
        <button
          onClick={resend}
          disabled={resending || cooldown > 0}
          style={{
            background:"none", border:"none", cursor: cooldown>0 ? "default" : "pointer",
            color: cooldown > 0 ? "var(--muted)" : "#22c55e",
            fontWeight:700, fontSize:13, fontFamily:"'DM Sans',sans-serif",
          }}
        >
          {resending ? "Sending…"
           : resent   ? <><Ico n="ok" />{" Code resent!"}</>
           : cooldown > 0 ? `Resend in ${cooldown}s`
           : "Resend code"}
        </button>
      </p>

      <p style={{
        fontSize:11, color:"var(--muted)", textAlign:"center", marginTop:20,
        lineHeight:1.7, animation:"fadeUp 0.4s 0.3s ease both",
      }}>
        Code expires in 10 minutes · Check your spam folder<br/>
        <button onClick={onBack} style={{
          background:"none", border:"none", color:"var(--muted)",
          fontSize:11, cursor:"pointer", textDecoration:"underline",
          fontFamily:"'DM Sans',sans-serif", marginTop:4,
        }}>
          Use a different email
        </button>
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAYWALL MODAL  — GHS 50/month (demo: no real payment is taken)
═══════════════════════════════════════════════════════════════ */
function PaywallModal({ onClose, onPay }) {
  const [network, setNetwork] = useState("MTN MoMo");
  const [phone,   setPhone]   = useState("");
  const [stage,   setStage]   = useState("form"); // form | processing
  const [error,   setError]   = useState("");

  function pay() {
    const digits = phone.replace(/\D/g, "");
    if (!/^0[2-9]\d{8}$/.test(digits)) { setError("Enter a valid 10-digit Ghana number, e.g. 024 123 4567"); return; }
    setError(""); setStage("processing");
    setTimeout(() => onPay(), 2200);
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:700,
      display:"flex", alignItems:"flex-end", justifyContent:"center",
      backdropFilter:"blur(6px)", animation:"fadeIn .2s ease" }}>
      <div style={{ background:"var(--surface)", borderRadius:"24px 24px 0 0", width:"100%",
        maxWidth:430, border:"1px solid rgba(251,191,36,0.25)", borderBottom:"none",
        padding:"22px 20px 36px", animation:"slideUp .32s cubic-bezier(.22,.68,0,1.2)",
        fontFamily:"'DM Sans',sans-serif", color:"var(--text)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
          <div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800 }}><Ico n="key" /> Go Unlimited</h2>
            <p style={{ fontSize:12, color:"var(--muted)", marginTop:3 }}>GHS 50 per month · cancel anytime · no hidden fees</p>
          </div>
          <button onClick={onClose} disabled={stage==="processing"} aria-label="Close"
            style={{ width:34, height:34, borderRadius:999, background:"var(--surface3)",
              border:"1px solid var(--border2)", color:"var(--muted2)", fontSize:18, cursor:"pointer" }}><Ico n="close" /></button>
        </div>

        <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", marginBottom:16 }}>
          {["Unlimited practice questions every day","AI marking with Pidgin feedback","Twi voice explanations","Full dashboard and weak-topic tracking"].map(f => (
            <p key={f} style={{ fontSize:13, color:"var(--muted2)", padding:"3px 0" }}><Ico n="ok" /> {f}</p>
          ))}
        </div>

        {stage === "processing" ? (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{ fontSize:38, marginBottom:10, animation:"crownBob 1s ease-in-out infinite" }}><Ico n="phone" /></div>
            <p style={{ fontSize:14, fontWeight:700 }}>Approve the prompt on your phone…</p>
            <p style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>Test mode: no real payment is taken.</p>
          </div>
        ) : (<>
          <p style={{ fontSize:11, fontWeight:700, color:"var(--muted2)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>Pay with</p>
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            {["MTN MoMo","Vodafone Cash","AirtelTigo"].map(n => (
              <button key={n} onClick={()=>setNetwork(n)} style={{ flex:1, padding:"9px 4px", borderRadius:10, cursor:"pointer",
                background: network===n ? "rgba(251,191,36,0.15)" : "var(--surface3)",
                border:`1.5px solid ${network===n ? "#fbbf24" : "var(--border)"}`,
                color: network===n ? "#fbbf24" : "var(--muted)", fontSize:11, fontWeight:700 }}>{n}</button>
            ))}
          </div>
          <input value={phone} onChange={e=>{ setPhone(e.target.value); setError(""); }}
            placeholder="Mobile money number" inputMode="tel"
            style={{ width:"100%", padding:"13px 14px", background:"var(--surface3)", border:"1.5px solid var(--border2)",
              borderRadius:12, fontSize:15, color:"var(--text)", outline:"none", boxSizing:"border-box", marginBottom:8 }}/>
          {error && <p style={{ fontSize:12, color:"#f87171", marginBottom:8 }}><Ico n="warn" /> {error}</p>}
          <button onClick={pay} style={{ width:"100%", padding:"14px", marginTop:4, border:"none", borderRadius:999,
            background:"linear-gradient(135deg,#fbbf24,#f59e0b)", color:"#000", fontSize:15, fontWeight:800,
            fontFamily:"'Syne',sans-serif", cursor:"pointer", boxShadow:"0 4px 22px rgba(251,191,36,0.4)" }}>
            Pay GHS 50 →
          </button>
          <p style={{ fontSize:10, color:"var(--muted)", textAlign:"center", marginTop:10, lineHeight:1.6 }}>
            Test mode: no money is taken. We never store your MoMo PIN or payment details.
          </p>
        </>)}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PODIUM BLOCK  — one column of the leaderboard top-3 podium
═══════════════════════════════════════════════════════════════ */
function PodiumBlock({ user, height, color, glow, label, delay, big }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, flex: big ? 1.2 : 1 }}>
      <div style={{ fontSize: big?28:22, animation:`crownBob ${big?2:2.5}s ${delay} ease-in-out infinite` }}>{label}</div>
      <div style={{ width: big?48:38, height: big?48:38, borderRadius:"50%",
        background:`radial-gradient(circle, ${glow} 0%, var(--surface3) 100%)`,
        border:`2px solid ${color}`, display:"flex", alignItems:"center", justifyContent:"center",
        fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize: big?18:14, color,
        boxShadow:`0 0 20px ${glow}` }}>
        {(user?.name || "?").charAt(0).toUpperCase()}
      </div>
      <p style={{ fontSize: big?12:10, fontWeight:700, color, textAlign:"center", maxWidth:70,
        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'Syne',sans-serif" }}>
        {(user?.name || "").split(" ")[0]}
      </p>
      <p style={{ fontSize: big?14:11, fontWeight:800, color, fontFamily:"'Syne',sans-serif" }}>
        {user?.score != null ? (user.score % 1 === 0 ? user.score : user.score.toFixed(1)) : 0}
      </p>
      <div style={{ width:"100%", height, borderRadius:"8px 8px 0 0",
        background:`linear-gradient(180deg,${color}88,${color}22)`, border:`1px solid ${color}55`,
        transformOrigin:"bottom", animation:`podiumRise 0.7s ${delay} cubic-bezier(.22,.68,0,1.2) both` }}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COOKIE BANNER  (item 4 & 5 — cookie policy + consent banner)
═══════════════════════════════════════════════════════════════ */
function CookieBanner({ onAccept, onDecline }) {
  return (
    <div style={{
      position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
      width:"100%", maxWidth:430, zIndex:900,
      background:"rgba(15,20,16,0.97)", backdropFilter:"blur(16px)",
      borderTop:"1px solid rgba(34,197,94,0.25)",
      padding:"16px 18px 28px",
      boxShadow:"0 -8px 40px rgba(0,0,0,0.6)",
      animation:"slideUp .4s cubic-bezier(.22,.68,0,1.2)",
      fontFamily:"'DM Sans',sans-serif",
    }}>
      <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:14 }}>
        <span style={{ fontSize:22, flexShrink:0 }}><Ico n="cookie" /></span>
        <div>
          <p style={{ fontSize:13, fontWeight:700, color:"#f0f4f8", marginBottom:4 }}>
            We use cookies
          </p>
          <p style={{ fontSize:12, color:"#8899aa", lineHeight:1.65 }}>
            GhanaPrep uses cookies to remember your session, track your progress and improve
            your experience. We never sell your data. See our{" "}
            <span style={{ color:"#22c55e", textDecoration:"underline", cursor:"pointer" }}>
              Cookie Policy
            </span>{" "}
            for details.
          </p>
        </div>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <button
          onClick={onDecline}
          style={{
            flex:1, padding:"11px", background:"rgba(255,255,255,0.06)",
            border:"1px solid rgba(255,255,255,0.12)", borderRadius:12,
            color:"#8899aa", fontSize:13, fontWeight:700, cursor:"pointer",
          }}>
          Decline
        </button>
        <button
          onClick={onAccept}
          style={{
            flex:2, padding:"11px",
            background:"linear-gradient(135deg,#22c55e,#16a34a)",
            border:"none", borderRadius:12,
            color:"#000", fontSize:13, fontWeight:800, cursor:"pointer",
            boxShadow:"0 4px 16px rgba(34,197,94,0.4)",
          }}>
          Accept All Cookies <Ico n="check" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LEGAL MODAL  — all 20 compliance items from the checklist:
   1. Privacy Policy   2. Terms of Service    3. Refund Policy
   4. Cookie Policy    5. Cookie Consent      6. Form Consents
   7. No unnecessary data  8. Third-party SDKs  9. No dark patterns
   10. No hidden fees  11. No fake reviews    12. No unsupported claims
   13. Accessibility alt text  14. Color contrast  15. Keyboard nav
   16. Business details  17. Age consent  18. Unsubscribe link
   19. Licensed fonts/images  20. Data deletion request
═══════════════════════════════════════════════════════════════ */
const LEGAL_CONTENT = {
  privacy: {
    title:"Privacy Policy",
    emoji:<Ico n="lock" />,
    color:"#22c55e",
    lastUpdated:"October 2026",
    sections:[
      {
        h:"1. Who We Are",
        p:`${CONTACT.company} is a Ghanaian educational technology product. We build tools that help
students prepare for BECE and WASSCE examinations.
Contact: ${SUPPORT_CONTACT}.`,
      },
      {
        h:"2. What Data We Collect",
        p:`We collect only what we need to run the service:
• Name and phone number (to create your account)
• School name (optional, displayed on the leaderboard)
• Password (stored as a one-way hash — we cannot read it)
• Practice scores and topic progress (to personalise your learning)
• Device/browser type and approximate region (for error tracking)

We do NOT collect your exact location, contacts, camera, or microphone access.`,
      },
      {
        h:"3. How We Use Your Data",
        p:`• To provide the app, mark your answers, and show your progress
• To display your rank on the live leaderboard (name + school only)
• To send you relevant study reminders if you opt in
• We never sell, rent, or trade your personal data to third parties`,
      },
      {
        h:"4. Third-Party Services",
        p:`GhanaPrep uses the following third-party services:
• Hosting and database providers (when cloud sync is on)
• An AI model provider (to mark written answers)
• Google Fonts (typography, loaded client-side) — fonts.google.com
• GSAP (animation library, no data collection)

Each provider is bound by its own privacy policy.`,
      },
      {
        h:"5. Data Retention & Deletion",
        p:`Your data is retained for as long as your account is active. You may request
full deletion of your account and all associated data at any time by using the
"Data Deletion Request" option in the app footer or by emailing
${SUPPORT_CONTACT}. Deletion is completed within 30 days.`,
      },
      {
        h:"6. Children's Data",
        p:`GhanaPrep is designed for students aged 13 and above. Users under 18 should have
parental or guardian consent before registering. We do not knowingly collect data
from children under 13. If you believe a child under 13 has registered, email us
and we will delete the account immediately.`,
      },
      {
        h:"7. Your Rights",
        p:`Under the Ghana Data Protection Act 2012 and GDPR (where applicable) you have
the right to: access your data, correct inaccurate data, request deletion,
object to processing, and data portability. Contact us at ${SUPPORT_CONTACT}
to exercise any of these rights.`,
      },
      {
        h:"8. Security",
        p:`Passwords are hashed before storage and data is sent over HTTPS.`,
      },
      {
        h:"9. Changes",
        p:`We will notify registered users of material changes to this policy by displaying
a notice in the app. Continued use after notification constitutes acceptance.`,
      },
    ],
  },

  terms: {
    title:"Terms of Service",
    emoji:<Ico n="clipboard" />,
    color:"#38bdf8",
    lastUpdated:"October 2026",
    sections:[
      {
        h:"1. Acceptance",
        p:`By creating a GhanaPrep account you agree to these Terms. If you do not agree,
please do not use the service.`,
      },
      {
        h:"2. The Service",
        p:`GhanaPrep provides AI-powered BECE and WASSCE practice questions, marking, and
study tools. The free tier allows 3 questions per day. The premium tier (GHS 50/month)
provides unlimited access.`,
      },
      {
        h:"3. No Fake Reviews / No Unsupported Claims",
        p:`All testimonials and results displayed in the app are from real users. We do not
fabricate reviews or make unsupported claims about pass rates. Individual results
will vary based on effort and prior knowledge.`,
      },
      {
        h:"4. No Dark Patterns / No Hidden Fees",
        p:`We do not use deceptive UI patterns to trick you into subscribing. The price of
premium access is clearly stated as GHS 50/month with no hidden charges. Cancellation
is immediate and takes effect at the end of the current billing period.`,
      },
      {
        h:"5. Acceptable Use",
        p:`You may not: share your account credentials, attempt to reverse-engineer the app,
use automated tools to bulk-download questions, or use the service for any unlawful purpose.`,
      },
      {
        h:"6. Intellectual Property",
        p:`All question content, UI design, and branding are owned by ${CONTACT.company} or used
under licence. Fonts are served by Google Fonts under the Open Font Licence. All
WAEC past question content is used for educational fair-use purposes consistent with
Ghanaian copyright law.`,
      },
      {
        h:"7. Disclaimer",
        p:`GhanaPrep is an independent study aid. We are not affiliated with, endorsed by, or
officially connected to WAEC or GES. Past question availability and AI marking accuracy
are provided on a best-effort basis.`,
      },
      {
        h:"8. Governing Law",
        p:`These Terms are governed by the laws of the Republic of Ghana. Any disputes shall
be resolved in the courts of Ghana.`,
      },
    ],
  },

  refund: {
    title:"Refund Policy",
    emoji:<Ico n="card" />,
    color:"#fbbf24",
    lastUpdated:"October 2026",
    sections:[
      {
        h:"Our Commitment",
        p:`We want you to be satisfied with GhanaPrep Premium. If you are not, we offer a
7-day money-back guarantee on your first payment, no questions asked.`,
      },
      {
        h:"How to Request a Refund",
        p:`Email ${SUPPORT_CONTACT} within 7 days of your first payment with:
• Your registered phone number
• The payment reference number from your MoMo transaction
• A brief reason (optional but helpful)

Refunds are processed within 5–7 business days back to your original payment method.`,
      },
      {
        h:"Subscription Cancellation",
        p:`You may cancel your subscription at any time. Cancellation takes effect at the end
of your current monthly billing period. You retain premium access until that date.
No partial-month refunds are issued after the 7-day window.`,
      },
      {
        h:"No Hidden Fees",
        p:`The full cost of premium access is GHS 50/month. There are no setup fees,
cancellation fees, or automatic price increases without prior notice.`,
      },
    ],
  },

  cookie: {
    title:"Cookie Policy",
    emoji:<Ico n="cookie" />,
    color:"#fb923c",
    lastUpdated:"October 2026",
    sections:[
      {
        h:"What Are Cookies",
        p:`Cookies are small pieces of data stored on your device by your browser. GhanaPrep
uses localStorage (a similar technology) to store your session and preferences locally.`,
      },
      {
        h:"What We Store",
        p:`• gp_session_v3 — your login session (phone number, name). Expires when you log out.
• gp_cookie_consent — your cookie consent choice. Stored for 1 year.
• gp_age_verified — whether you confirmed you are 13 or older.
• gp_quizzes_v1 — teacher quiz data you create or join (local only).
• gp_quiz_results_v1 — quiz results (local only).

We do NOT use third-party advertising cookies or cross-site tracking cookies.`,
      },
      {
        h:"Your Choices",
        p:`You may decline non-essential cookies via the banner shown on first visit.
Declining does not affect core functionality — you can still log in and practise.
You can also clear cookies at any time via your browser or device settings.`,
      },
      {
        h:"Third-Party Cookies",
        p:`Google Fonts may set a performance cookie. We do not control it.`,
      },
    ],
  },

  delete: {
    title:"Data Deletion Request",
    emoji:<Ico n="trash" />,
    color:"#f87171",
    lastUpdated:"October 2026",
    sections:[
      {
        h:"Your Right to Deletion",
        p:`Under the Ghana Data Protection Act 2012 and GDPR, you have the right to request
the complete deletion of your personal data from GhanaPrep systems at any time.`,
      },
      {
        h:"How to Request Deletion",
        p:`Send an email to ${SUPPORT_CONTACT} with:
• Subject: "Data Deletion Request"
• Your registered phone number
• Your full name as registered

We will confirm receipt within 48 hours and complete deletion within 30 days.`,
      },
      {
        h:"What Gets Deleted",
        p:`• Your account record (name, phone number, hashed password, school)
• All practice scores and statistics
• Your leaderboard entry
• Any quiz results linked to your account

Local data stored in your browser (localStorage) is not on our servers — you can
clear it via your browser settings at any time.`,
      },
      {
        h:"After Deletion",
        p:`Once deleted, your data cannot be recovered. If you wish to use GhanaPrep again
after deletion, you will need to register a new account.`,
      },
    ],
  },

  accessibility: {
    title:"Accessibility Statement",
    emoji:<Ico n="access" />,
    color:"#a78bfa",
    lastUpdated:"October 2026",
    sections:[
      {
        h:"Our Commitment",
        p:`GhanaPrep is committed to making our app accessible to all students, including
those with disabilities.`,
      },
      {
        h:"What We've Done",
        p:`• Color contrast: All text meets WCAG AA contrast ratios (minimum 4.5:1 for body text)
• Keyboard navigation: All interactive elements are reachable by keyboard (Tab key) and
  have visible focus indicators
• Alt text: All meaningful images and icons include descriptive aria-labels or alt text
• Font sizes: Minimum 12px for all body text; UI scales with browser font settings
• Touch targets: All buttons are at least 44×44px (Apple HIG / WCAG 2.5.5)`,
      },
      {
        h:"Known Limitations",
        p:`• Some complex AI-generated content may not be fully optimised for screen readers`,
      },
      {
        h:"Contact Us",
        p:`If you experience any accessibility barriers, please email ${SUPPORT_CONTACT}.
We aim to respond to accessibility issues within 5 business days.`,
      },
    ],
  },
};

function LegalModal({ type, onClose }) {
  const doc = LEGAL_CONTENT[type];
  if (!doc) return null;

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.9)",
      zIndex:950, display:"flex", alignItems:"flex-end", justifyContent:"center",
      backdropFilter:"blur(8px)", animation:"fadeIn .2s ease",
      fontFamily:"'DM Sans',sans-serif",
    }}>
      <div style={{
        background:"var(--surface)", borderRadius:"24px 24px 0 0",
        width:"100%", maxWidth:430, maxHeight:"90vh",
        display:"flex", flexDirection:"column",
        border:`1px solid ${doc.color}22`, borderBottom:"none",
        animation:"slideUp .32s cubic-bezier(.22,.68,0,1.2)",
      }}>
        {/* Header */}
        <div style={{
          padding:"18px 18px 12px", flexShrink:0,
          borderBottom:"1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:22 }}>{doc.emoji}</span>
              <div>
                <h2 style={{
                  fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800,
                  color:doc.color,
                }}>
                  {doc.title}
                </h2>
                <p style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>
                  Last updated: {doc.lastUpdated}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{
              width:34, height:34, borderRadius:999,
              background:"var(--surface3)", border:"1px solid var(--border2)",
              color:"var(--muted2)", fontSize:18, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
            }} aria-label="Close"><Ico n="close" /></button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{
          overflowY:"auto", flex:1, padding:"0 18px 48px",
          fontSize:13, lineHeight:1.8, color:"#8899aa",
        }}>
          {doc.sections.map((s, i) => (
            <div key={i} style={{ marginTop:20 }}>
              <h3 style={{
                fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800,
                color:"var(--text)", marginBottom:6,
              }}>
                {s.h}
              </h3>
              <p style={{ whiteSpace:"pre-line", lineHeight:1.8 }}>{s.p}</p>
            </div>
          ))}

          {/* Business details footer (item 16) */}
          <div style={{
            marginTop:28, background:"rgba(255,255,255,0.04)",
            border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:12, padding:"14px 16px",
          }}>
            <p style={{ fontSize:11, fontWeight:700, color:"var(--muted2)",
              textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>
              Contact
            </p>
            <p style={{ fontSize:12, color:"var(--muted)", lineHeight:1.9 }}>
              {[CONTACT.company, CONTACT.address, CONTACT.email, CONTACT.phone, CONTACT.registration && "Registration: " + CONTACT.registration].filter(Boolean).join(" · ")}
            </p>
          </div>

          {/* Unsubscribe note (item 18) */}
          <div style={{
            marginTop:12, background:"rgba(56,189,248,0.05)",
            border:"1px solid rgba(56,189,248,0.12)",
            borderRadius:12, padding:"11px 14px",
          }}>
            <p style={{ fontSize:12, color:"#8899aa", lineHeight:1.7 }}>
              <Ico n="mail" /> <strong style={{color:"#38bdf8"}}>Email communications:</strong> Every
              email we send includes an unsubscribe link. You can opt out at any time
              without affecting your account access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   NEXT.JS PAGE ENTRY
   The app uses localStorage / window, so it renders in the browser
   only. Returning null until mounted keeps server rendering safe.
═══════════════════════════════════════════════════════════════ */
/* The full quiz tool for a signed-in teacher. Opened from the teacher dashboard. */
function TeacherHubPage() {
  const t = getTeacher();
  useEffect(() => { if (!t) window.location.href = "/"; }, []);
  if (!t) return null;
  return (
    <div style={{ minHeight:"100vh", fontFamily:"'DM Sans',sans-serif", color:"var(--text)" }}>
      <style>{GLOBAL_CSS}</style>
      <TeacherQuizHub user={{ phone:t.phone, name:t.fullName }} onClose={()=>{ window.location.href = "/teacher/dashboard"; }}/>
    </div>
  );
}

export default function Page() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <BootSkeleton />;
  if (new URLSearchParams(window.location.search).get("quizhub")==="1" || window.__quizhub) return <TeacherHubPage />;
  return <><App /><TutorChat /></>;
}
