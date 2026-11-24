"use client";
// Winners' podium for the leaderboard: 2nd (silver, left), 1st (gold, centre, tallest), 3rd (bronze, right).
// Each student stands on their step; the steps rise in, a crown drops onto 1st place and the points
// count up. Empty steps (fewer than 3 students) invite the student to take the spot.
// People who turn on "reduce motion" see it all in place, without movement.
import { useEffect, useState } from "react";
import { Crown } from "lucide-react";

export type PodiumEntry = { name: string; school?: string; score: number; avatarColor?: string; isMe?: boolean };

const CSS = `
.pd{margin:2px 0 18px}
.pd-stage{position:relative;padding-top:30px;overflow:hidden;border-radius:18px;
  background:radial-gradient(65% 55% at 50% 28%,rgba(252,209,22,.14),transparent 70%),linear-gradient(180deg,rgba(255,255,255,.02),transparent 60%)}
.pd-rays{position:absolute;left:50%;top:-118px;width:380px;height:380px;margin-left:-190px;border-radius:50%;pointer-events:none;
  background:repeating-conic-gradient(from 0deg,rgba(252,209,22,.13) 0deg 8deg,transparent 8deg 18deg);
  -webkit-mask:radial-gradient(closest-side,#000 22%,transparent 100%);mask:radial-gradient(closest-side,#000 22%,transparent 100%);
  animation:pdSpin 34s linear infinite}
@keyframes pdSpin{to{transform:rotate(360deg)}}
.pd-spark{position:absolute;width:11px;height:11px;background:#FCD116;pointer-events:none;opacity:0;
  clip-path:polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%);animation:pdTwinkle 2.2s ease-in-out infinite}
@keyframes pdTwinkle{0%,100%{opacity:0;transform:scale(.4) rotate(0)}45%{opacity:1;transform:scale(1) rotate(45deg)}}
.pd-cols{position:relative;display:flex;align-items:flex-end;justify-content:center;padding:0 6px}
.pd-col{display:flex;flex-direction:column;align-items:center;min-width:0}
.pd-col.r1{flex:1.2;z-index:2}
.pd-col.r2,.pd-col.r3{flex:1;z-index:1}
.pd-col.r1{--ring:#fbbf24;--metal:linear-gradient(145deg,#fff1b0,#e3b23c);--top:linear-gradient(180deg,#fff6d1,#f5d778);--front:linear-gradient(180deg,#f2cd5c 0%,#d9a520 46%,#a8770f 100%)}
.pd-col.r2{--ring:#d7dde5;--metal:linear-gradient(145deg,#ffffff,#b9c2cd);--top:linear-gradient(180deg,#ffffff,#dfe4ea);--front:linear-gradient(180deg,#dde2e8 0%,#aab4c0 50%,#7d8796 100%)}
.pd-col.r3{--ring:#e0915a;--metal:linear-gradient(145deg,#ffd2a8,#cd7f32);--top:linear-gradient(180deg,#ffdcbc,#eaa56b);--front:linear-gradient(180deg,#e9a66a 0%,#c47432 50%,#8f5220 100%)}
.pd-person{display:flex;flex-direction:column;align-items:center;width:100%;padding:0 4px 9px;opacity:0;transform:translateY(-16px) scale(.85);
  animation:pdIn .5s cubic-bezier(.2,.9,.25,1.35) forwards}
.r3 .pd-person{animation-delay:.45s}.r2 .pd-person{animation-delay:.6s}.r1 .pd-person{animation-delay:.85s}
@keyframes pdIn{to{opacity:1;transform:none}}
.pd-crown{color:#FCD116;margin-bottom:-3px;filter:drop-shadow(0 3px 8px rgba(252,209,22,.6));
  animation:pdCrownDrop .6s 1.05s cubic-bezier(.2,.9,.25,1.45) both,pdBob 2.4s 1.7s ease-in-out infinite}
.pd-crown svg{display:block;width:30px;height:30px;fill:rgba(252,209,22,.35)}
@keyframes pdCrownDrop{0%{opacity:0;transform:translateY(-30px) rotate(-14deg)}100%{opacity:1;transform:none}}
@keyframes pdBob{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-4px) rotate(4deg)}}
.pd-avatar{position:relative;width:58px;height:58px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-family:'Sora','Syne',sans-serif;letter-spacing:-.022em;font-weight:800;font-size:22px;color:var(--av,#34d399);border:3px solid var(--ring);
  background:#13201a;background:radial-gradient(circle at 35% 30%,color-mix(in srgb,var(--av,#34d399) 32%,#1a2620),#0d1612);
  box-shadow:0 0 0 3px rgba(0,0,0,.35),0 8px 20px -6px rgba(0,0,0,.75)}
.r1 .pd-avatar{width:76px;height:76px;font-size:30px;box-shadow:0 0 0 3px rgba(0,0,0,.35),0 0 26px rgba(252,209,22,.55),0 10px 24px -6px rgba(0,0,0,.75);
  animation:pdGlow 2.6s 1.5s ease-in-out infinite}
@keyframes pdGlow{50%{box-shadow:0 0 0 3px rgba(0,0,0,.35),0 0 42px rgba(252,209,22,.9),0 10px 24px -6px rgba(0,0,0,.75)}}
.pd-avatar.empty{border-style:dashed;border-color:rgba(255,255,255,.28);color:#71827a;background:rgba(255,255,255,.04)}
.pd-medal{position:absolute;left:50%;bottom:-10px;width:22px;height:22px;margin-left:-11px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-family:'Sora','Syne',sans-serif;letter-spacing:-.022em;font-size:12px;font-weight:800;color:#1a1303;background:var(--metal);border:2px solid #0d1612;box-shadow:0 2px 6px rgba(0,0,0,.5)}
.r1 .pd-medal{width:26px;height:26px;margin-left:-13px;bottom:-12px;font-size:14px}
.pd-name{margin:15px 0 0;max-width:100%;font-family:'Sora','Syne',sans-serif;letter-spacing:-.022em;font-weight:800;font-size:13px;color:#f3f6f4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.r1 .pd-name{font-size:15px}
.pd-school{margin:2px 0 0;max-width:100%;min-height:13px;font-size:10.5px;color:#8fa199;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pd-you{margin-top:3px;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#03130c;background:#4ade80}
.pd-block{width:100%;transform:scaleY(0);transform-origin:bottom;animation:pdRise .65s cubic-bezier(.2,.9,.25,1.25) forwards}
.r3 .pd-block{animation-delay:.05s}.r2 .pd-block{animation-delay:.2s}.r1 .pd-block{animation-delay:.38s}
@keyframes pdRise{to{transform:scaleY(1)}}
.pd-top{height:12px;background:var(--top);clip-path:polygon(7% 0,93% 0,100% 100%,0 100%)}
.pd-front{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;gap:5px;padding-top:9px;background:var(--front);
  border-left:1px solid rgba(255,255,255,.2);border-right:1px solid rgba(0,0,0,.25);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -16px 26px -14px rgba(0,0,0,.4)}
.pd-front::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(115deg,transparent 32%,rgba(255,255,255,.32) 46%,transparent 60%);background-size:260% 100%;
  animation:pdShine 4s 1.6s ease-in-out infinite;background-position:160% 0}
@keyframes pdShine{0%{background-position:160% 0}55%,100%{background-position:-60% 0}}
.r1 .pd-front{height:130px}.r2 .pd-front{height:96px}.r3 .pd-front{height:74px}
.pd-num{font-family:'Sora','Syne',sans-serif;letter-spacing:-.022em;font-weight:800;line-height:1;color:rgba(255,255,255,.96);text-shadow:0 2px 0 rgba(0,0,0,.22),0 0 18px rgba(255,255,255,.3)}
.r1 .pd-num{font-size:54px}.r2 .pd-num{font-size:42px}.r3 .pd-num{font-size:33px}
.pd-pts{padding:3px 9px;border-radius:999px;font-size:11.5px;font-weight:800;color:#fff;background:rgba(0,0,0,.26);white-space:nowrap}
.r3 .pd-pts{padding:2px 7px;font-size:10.5px}
.pd-base{height:7px;margin:0 6px;border-radius:0 0 6px 6px;background:linear-gradient(90deg,#CE1126 0 33.3%,#FCD116 33.3% 66.6%,#006B3F 66.6%)}
.pd-floor{height:18px;margin:-2px 18px 0;background:radial-gradient(closest-side,rgba(0,0,0,.6),transparent)}
@media (prefers-reduced-motion: reduce){
  .pd-rays,.pd-front::after,.r1 .pd-avatar,.pd-spark{animation:none}
  .pd-spark{display:none}
  .pd-person,.pd-crown{opacity:1;transform:none;animation:none}
  .pd-block{transform:none;animation:none}
}`;

const ORDINAL = { 1: "First", 2: "Second", 3: "Third" } as Record<number, string>;
const fmt = (v: number, whole: boolean) => (whole ? String(Math.round(v)) : (Math.round(v * 10) / 10).toFixed(1));
const shortName = (name: string) => {
  const parts = String(name || "").trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0] || "Student";
};

/** Counts from 0 up to `to` once the step has risen. */
function CountUp({ to, delay }: { to: number; delay: number }) {
  const whole = Number.isInteger(to);
  const [v, setV] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) { setV(to); return; }
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - start) / 900));
      setV(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, delay]);
  return <>{fmt(v, whole)}</>;
}

function Step({ rank, u }: { rank: 1 | 2 | 3; u?: PodiumEntry }) {
  const label = u ? `${ORDINAL[rank]} place: ${u.name}${u.isMe ? " (you)" : ""}, ${fmt(u.score, Number.isInteger(u.score))} points` : `${ORDINAL[rank]} place: still open`;
  return (
    <div className={`pd-col r${rank}`} role="listitem" aria-label={label}>
      <div className="pd-person" aria-hidden="true">
        {rank === 1 && <div className="pd-crown"><Crown /></div>}
        <div className={"pd-avatar" + (u ? "" : " empty")} style={u ? ({ "--av": u.avatarColor || "#34d399" } as React.CSSProperties) : undefined}>
          {u ? (u.name || "?").charAt(0).toUpperCase() : "?"}
          <span className="pd-medal">{rank}</span>
        </div>
        <p className="pd-name">{u ? shortName(u.name) : "Your spot?"}</p>
        {u?.isMe ? <span className="pd-you">You</span> : <p className="pd-school">{u ? u.school || "" : "Keep practising"}</p>}
      </div>
      <div className="pd-block" aria-hidden="true">
        <div className="pd-top" />
        <div className="pd-front">
          <span className="pd-num">{rank}</span>
          {u && <span className="pd-pts"><CountUp to={u.score} delay={rank === 1 ? 900 : rank === 2 ? 650 : 500} /> pts</span>}
        </div>
      </div>
    </div>
  );
}

/** rows: the top three, best first. */
export function Podium({ rows }: { rows: PodiumEntry[] }) {
  return (
    <div className="pd">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pd-stage">
        <div className="pd-rays" aria-hidden="true" />
        {[[34, 12, 0], [64, 7, 0.7], [27, 34, 1.3], [72, 30, 0.35], [50, 1, 1.75]].map(([x, y, d], i) => (
          <span key={i} className="pd-spark" aria-hidden="true" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${1.6 + d}s` }} />
        ))}
        <div className="pd-cols" role="list" aria-label="Top three students">
          <Step rank={2} u={rows[1]} />
          <Step rank={1} u={rows[0]} />
          <Step rank={3} u={rows[2]} />
        </div>
        <div className="pd-base" aria-hidden="true" />
        <div className="pd-floor" aria-hidden="true" />
      </div>
    </div>
  );
}
