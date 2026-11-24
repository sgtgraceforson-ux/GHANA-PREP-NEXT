"use client";
// Plays once, right after a correct email verification code:
//  1. the six code digits jump out of their boxes and ride a merry-go-round around the GhanaPrep
//     crest (red, gold and green like the flag, bobbing like carousel horses, fairground lights chasing)
//  2. the ride speeds up and the digits spiral into the crest
//  3. a green tick draws itself, a shockwave ripples out and Ghana-coloured confetti bursts
//  4. "Verification successful" pops in letter by letter, then the app opens (tap to skip)
// People who turn on "reduce motion" get a calm version without the ride or confetti.
import { Fragment, useEffect, useRef, useState } from "react";

const T_GATHER = 650;          // digits jump from the row onto the carousel
const T_ORBIT = 2100;          // carousel speeds up until here
const T_SPIRAL = 2550;         // digits spiral into the crest; then the celebration
const T_END = T_SPIRAL + 2350; // then the app opens
const CONFETTI = ["#CE1126", "#FCD116", "#13a05a", "#e8c468", "#f5f7f6"];

const CSS = `
.vc{position:fixed;inset:0;z-index:2000;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;
  background:radial-gradient(60% 42% at 50% 40%,rgba(232,196,104,.17),transparent 70%),radial-gradient(90% 55% at 50% 105%,rgba(22,163,74,.24),transparent 70%),#06100b;
  color:#f3f6f4;font-family:'Plus Jakarta Sans','DM Sans',system-ui,sans-serif;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}
.vc.done{cursor:pointer}
.vc-stage{position:relative;width:340px;max-width:100vw;height:300px;flex:none}
.vc-center{position:absolute;left:50%;top:46%;width:0;height:0}
.vc-track{position:absolute;left:0;top:0;border-radius:50%;z-index:40;border:2px solid rgba(232,196,104,.28);
  box-shadow:0 0 22px rgba(232,196,104,.18),inset 0 0 18px rgba(232,196,104,.12);background:radial-gradient(closest-side,rgba(232,196,104,.07),transparent);transition:opacity .45s ease}
.vc-bulb{position:absolute;left:0;top:0;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;opacity:.28;animation:vcChase 1.1s linear infinite;transition:opacity .45s ease}
.vc-bulb.c0{background:#ff4d5e;box-shadow:0 0 10px #ff4d5e}
.vc-bulb.c1{background:#FCD116;box-shadow:0 0 10px #FCD116}
.vc-bulb.c2{background:#34d399;box-shadow:0 0 10px #34d399}
@keyframes vcChase{0%,100%{opacity:.22;transform:scale(.75)}12%{opacity:1;transform:scale(1.3)}30%{opacity:.4;transform:scale(.9)}}
.vc.done .vc-track,.vc.done .vc-bulb{opacity:0 !important;animation:none}
.vc-crest{position:absolute;left:0;top:0;width:150px;height:174px;margin:-87px 0 0 -75px;z-index:100;opacity:0;transform:scale(.55);
  transition:opacity .55s ease,transform .7s cubic-bezier(.2,.9,.25,1.3);filter:drop-shadow(0 0 26px rgba(232,196,104,.42))}
.vc-crest.in{opacity:1;transform:scale(1)}
.vc-crest img{display:block;width:100%;height:auto}
.vc.done .vc-crest{animation:vcPop .75s cubic-bezier(.2,.9,.25,1.3);filter:drop-shadow(0 0 34px rgba(74,222,128,.45))}
@keyframes vcPop{0%{transform:scale(1)}35%{transform:scale(1.16)}100%{transform:scale(1)}}
.vc-check{position:absolute;right:-6px;bottom:8px;width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(145deg,#4ade80,#16a34a);box-shadow:0 0 0 5px #06100b,0 10px 26px -6px rgba(34,197,94,.85);transform:scale(0)}
.vc.done .vc-check{animation:vcIn .55s .1s cubic-bezier(.2,.9,.25,1.6) forwards}
@keyframes vcIn{to{transform:scale(1)}}
.vc-check path{stroke-dasharray:40;stroke-dashoffset:40}
.vc.done .vc-check path{animation:vcDraw .42s .42s ease-out forwards}
@keyframes vcDraw{to{stroke-dashoffset:0}}
/* drawn at full size and scaled UP from small, so the ring stays thin as it grows */
.vc-wave{position:absolute;left:0;top:0;width:420px;height:420px;margin:-210px 0 0 -210px;border-radius:50%;border:2.5px solid #4ade80;
  box-shadow:0 0 18px rgba(74,222,128,.45),inset 0 0 18px rgba(74,222,128,.25);opacity:0;transform:scale(.06);z-index:90}
.vc-wave.two{border-color:#FCD116;box-shadow:0 0 18px rgba(252,209,22,.4),inset 0 0 18px rgba(252,209,22,.2)}
.vc.done .vc-wave{animation:vcWave 1.1s cubic-bezier(.15,.7,.3,1) forwards}
.vc.done .vc-wave.two{animation-delay:.17s}
@keyframes vcWave{0%{opacity:1;transform:scale(.06)}70%{opacity:.5}100%{opacity:0;transform:scale(1)}}
.vc-tile{position:absolute;left:0;top:0;width:44px;height:54px;margin:-27px 0 0 -22px;border-radius:12px;display:flex;align-items:center;justify-content:center;
  font-family:'Sora','Syne',sans-serif;letter-spacing:-.022em;font-weight:800;font-size:26px;will-change:transform,opacity;
  box-shadow:0 10px 18px -8px rgba(0,0,0,.75),inset 0 1px 0 rgba(255,255,255,.45),inset 0 -3px 0 rgba(0,0,0,.18)}
.vc-tile::before{content:"";position:absolute;left:50%;bottom:100%;width:3px;height:38px;margin-left:-1.5px;border-radius:2px;
  background:linear-gradient(180deg,rgba(232,196,104,0),#e8c468 70%)}
.vc-tile.c0{background:linear-gradient(180deg,#ff6474,#CE1126);color:#fff}
.vc-tile.c1{background:linear-gradient(180deg,#fff0a0,#FCD116);color:#1a1303}
.vc-tile.c2{background:linear-gradient(180deg,#38d68f,#0a7a44);color:#fff}
.vc-confetti{position:absolute;left:0;top:0;width:0;height:0;z-index:160;pointer-events:none}
.vc-piece{position:absolute;left:0;top:0;will-change:transform,opacity}
.vc-piece.rect{width:7px;height:12px;margin:-6px 0 0 -3.5px;border-radius:1.5px}
.vc-piece.dot{width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%}
.vc-piece.star{width:13px;height:13px;margin:-6.5px 0 0 -6.5px;clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)}
.vc-text{min-height:150px;text-align:center;padding:0 22px;width:100%;max-width:430px}
.vc-kicker{font-size:12px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:#e8c468;margin:0}
.vc-wait{font-size:14px;color:#a9b8b1;margin:10px 0 0;animation:vcBlink 1.1s ease-in-out infinite}
@keyframes vcBlink{50%{opacity:.45}}
.vc-title{font-family:'Sora','Syne',sans-serif;letter-spacing:-.022em;font-weight:800;font-size:clamp(25px,7.4vw,32px);line-height:1.18;margin:10px 0 0}
.vc-word{display:inline-block;white-space:nowrap}
.vc-title .vc-l{display:inline-block;opacity:0;transform:translateY(16px) scale(.5) rotate(-8deg)}
.vc.done .vc-title .vc-l{animation:vcLetter .55s cubic-bezier(.2,.9,.25,1.45) forwards}
@keyframes vcLetter{to{opacity:1;transform:none}}
.vc-title .vc-l.g{background:linear-gradient(90deg,#fbe7a6,#e8c468);-webkit-background-clip:text;background-clip:text;color:transparent}
.vc-sub{font-size:15px;line-height:1.5;color:#c3d0ca;margin:12px 0 0;opacity:0}
.vc.done .vc-sub{animation:vcFade .5s .85s ease forwards}
@keyframes vcFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.vc-bar{width:190px;height:5px;border-radius:5px;background:rgba(255,255,255,.1);margin:22px auto 0;overflow:hidden;opacity:0}
.vc.done .vc-bar{animation:vcFade .35s 1s ease forwards}
.vc-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#CE1126,#FCD116,#13a05a)}
.vc.done .vc-bar i{animation:vcFill 1.3s 1.05s linear forwards}
@keyframes vcFill{to{width:100%}}
.vc-skip{font-size:12px;color:#71827a;margin:10px 0 0;opacity:0}
.vc.done .vc-skip{animation:vcFade .35s 1.2s ease forwards}
@media (prefers-reduced-motion: reduce){
  .vc-tile,.vc-track,.vc-bulb,.vc-wave,.vc-confetti{display:none}
  .vc-crest{opacity:1;transform:none;transition:none}
  .vc.done .vc-crest{animation:none}
  .vc-check{transform:scale(1)} .vc.done .vc-check{animation:none}
  .vc-check path{stroke-dashoffset:0} .vc.done .vc-check path{animation:none}
  .vc-title .vc-l,.vc-sub,.vc-bar,.vc-skip{opacity:1;transform:none} .vc.done .vc-title .vc-l,.vc.done .vc-sub,.vc.done .vc-bar,.vc.done .vc-skip{animation:none}
  .vc-bar i{width:100%} .vc.done .vc-bar i{animation:none} .vc-wait{animation:none}
}`;

type Piece = { el: HTMLElement; x: number; y: number; vx: number; vy: number; r: number; vr: number; f: number; born: number; dead?: boolean };

export function VerifyCelebration({ code, name, onDone }: { code: string; name?: string; onDone: () => void }) {
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  const crestRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const confettiRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const finished = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const finish = () => { if (finished.current) return; finished.current = true; onDoneRef.current(); };

  const digits = String(code || "").replace(/\D/g, "").slice(0, 6).padEnd(6, "•").split("");
  const first = String(name || "").trim().split(/\s+/)[0] || "";
  const vw = typeof window === "undefined" ? 400 : window.innerWidth;
  const R = Math.max(92, Math.min(128, vw / 2 - 44)), RY = 30;            // carousel size
  const PR = R + 26, PRY = RY + 14, PY = 34;                               // platform (lights) ellipse
  const bulbs = Array.from({ length: 26 }, (_, k) => {
    const a = (k / 26) * Math.PI * 2;
    return { x: PR * Math.sin(a), y: PY + PRY * Math.cos(a), z: Math.round(100 + Math.cos(a) * 45), delay: -(k / 26) * 1.1 };
  });
  const title = ["Verification", "successful"];

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) {
      setDone(true);
      const t = window.setTimeout(finish, 2400);
      return () => window.clearTimeout(t);
    }
    const N = digits.length;
    const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const REV = 2.25;                                                     // turns while speeding up
    const wEnd = (2 * Math.PI * REV * 2) / (T_ORBIT - T_GATHER);          // turning speed when it stops speeding up
    const pieces: Piece[] = [];
    const t0 = performance.now();
    let last = t0, raf = 0, burst = false;

    const spawn = (ox: number, oy: number, count: number, baseAngle: number, spread: number, speed: [number, number], now: number) => {
      const box = confettiRef.current;
      if (!box) return;
      for (let k = 0; k < count; k++) {
        const el = document.createElement("i");
        const shape = Math.random() < 0.16 ? "star" : Math.random() < 0.35 ? "dot" : "rect";
        el.className = "vc-piece " + shape;
        el.style.background = shape === "star" ? "#FCD116" : CONFETTI[(Math.random() * CONFETTI.length) | 0];
        box.appendChild(el);
        const ang = baseAngle + (Math.random() - 0.5) * spread;
        const sp = speed[0] + Math.random() * (speed[1] - speed[0]);
        pieces.push({ el, x: ox, y: oy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: Math.random() * 360, vr: (Math.random() - 0.5) * 18, f: 4 + Math.random() * 9, born: now });
      }
    };

    const frame = (now: number) => {
      const t = now - t0;
      const dt = Math.min(now - last, 40) / 16.667;
      last = now;
      if (t > 160) crestRef.current?.classList.add("in");
      if (floatRef.current) floatRef.current.style.transform = `translateY(${(Math.sin(t / 430) * 4).toFixed(2)}px)`;

      // the ride: gather -> speed up -> spiral in
      let phi = 0, rk = 1, fade = 1, shrink = 1;
      if (t > T_GATHER && t <= T_ORBIT) {
        const u = (t - T_GATHER) / (T_ORBIT - T_GATHER);
        phi = 2 * Math.PI * REV * u * u;
      } else if (t > T_ORBIT) {
        const v = Math.min(1, (t - T_ORBIT) / (T_SPIRAL - T_ORBIT));
        phi = 2 * Math.PI * REV + wEnd * (Math.min(t, T_SPIRAL) - T_ORBIT) + 2 * Math.PI * 0.7 * v * v;
        rk = 1 - Math.pow(v, 1.8);
        fade = 1 - Math.pow(v, 1.5);
        shrink = 1 - 0.75 * v;
      }
      const e = easeIO(Math.min(1, t / T_GATHER));
      const bobAmp = 12 * Math.min(1, Math.max(0, (t - T_GATHER * 0.7) / 450)) * rk;
      for (let i = 0; i < N; i++) {
        const el = tiles.current[i];
        if (!el) continue;
        const a = (i - (N - 1) / 2) * ((2 * Math.PI) / N) + phi;         // left digits start on the left
        const z = Math.cos(a), depth = (z + 1) / 2;
        const xr = R * Math.sin(a) * rk, yr = RY * z * rk;
        const sRing = 0.7 + 0.42 * depth;
        let x: number, y: number, s: number, o: number;
        if (t < T_GATHER) {                                               // hop from the row onto the ride
          const xRow = (i - (N - 1) / 2) * 52;
          x = xRow + (xr - xRow) * e;
          y = yr * e - Math.sin(Math.PI * e) * 52;
          s = 1 + (sRing - 1) * e;
          o = Math.min(1, t / 120);
        } else {                                                          // ride, bobbing like a carousel horse
          const bob = bobAmp * (0.5 + 0.5 * Math.sin(t / 155 + i * 1.7));
          x = xr; y = yr - bob; s = sRing * shrink; o = (0.55 + 0.45 * depth) * fade;
        }
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(3)})`;
        el.style.opacity = o.toFixed(3);
        el.style.zIndex = String(Math.round(100 + z * 50 * e));
      }

      // the celebration
      if (!burst && t >= T_SPIRAL) {
        burst = true;
        setDone(true);
        try { navigator.vibrate?.([18, 60, 32]); } catch {}
        spawn(0, -10, 70, -Math.PI / 2, Math.PI * 1.25, [7, 15], now);    // from the crest
        const c = confettiRef.current?.getBoundingClientRect();
        if (c) {                                                          // and from both bottom corners
          const bottom = window.innerHeight - c.top;
          spawn(-c.left, bottom, 34, -Math.PI / 2 + 0.5, 0.55, [14, 21], now);
          spawn(window.innerWidth - c.left, bottom, 34, -Math.PI / 2 - 0.5, 0.55, [14, 21], now);
        }
      }
      for (const p of pieces) {
        if (p.dead) continue;
        const age = now - p.born;
        p.vy += 0.3 * dt;
        p.vx *= Math.pow(0.986, dt);
        p.vy *= Math.pow(0.993, dt);
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        p.el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) rotate(${p.r.toFixed(0)}deg) scaleY(${Math.cos((age / 1000) * p.f).toFixed(2)})`;
        if (age > 1700) p.el.style.opacity = String(Math.max(0, 1 - (age - 1700) / 650));
        if (age > 2400) { p.el.remove(); p.dead = true; }
      }

      if (t >= T_END) { finish(); return; }
      if (!finished.current) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); pieces.forEach((p) => p.el.remove()); };
    // runs once for this celebration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let n = 0;
  return (
    <div className={"vc" + (done ? " done" : "")} onClick={() => done && finish()} role="status" aria-live="polite">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="vc-stage" aria-hidden="true">
        <div className="vc-center">
          <div className="vc-track" style={{ width: PR * 2, height: PRY * 2, marginLeft: -PR, marginTop: PY - PRY }} />
          {bulbs.map((b, k) => (
            <span key={k} className={`vc-bulb c${k % 3}`} style={{ transform: `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px)`, zIndex: b.z, animationDelay: `${b.delay.toFixed(2)}s` }} />
          ))}
          <div className="vc-wave" />
          <div className="vc-wave two" />
          <div ref={crestRef} className="vc-crest">
            <div ref={floatRef}><img src="/logo.webp" alt="" width={150} height={174} /></div>
            <div className="vc-check">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </div>
          </div>
          {digits.map((d, i) => (
            <div key={i} ref={(el) => { tiles.current[i] = el; }} className={`vc-tile c${i % 3}`} style={{ opacity: 0 }}>{d}</div>
          ))}
          <div ref={confettiRef} className="vc-confetti" />
        </div>
      </div>

      <div className="vc-text">
        {!done ? (
          <>
            <p className="vc-kicker">Code accepted</p>
            <p className="vc-wait">Unlocking GhanaPrep for you…</p>
          </>
        ) : (
          <>
            <p className="vc-kicker">Email confirmed</p>
            <h1 className="vc-title" aria-label="Verification successful">
              {title.map((word, w) => (
                <Fragment key={w}>
                  {w > 0 ? " " : null}{/* outside the word, so a narrow screen can wrap here and never mid-word */}
                  <span className="vc-word">
                    {word.split("").map((ch, i) => {
                      const delay = 0.22 + n++ * 0.035;
                      return <span key={i} className={"vc-l" + (w === 1 ? " g" : "")} style={{ animationDelay: `${delay.toFixed(3)}s` }} aria-hidden="true">{ch}</span>;
                    })}
                  </span>
                </Fragment>
              ))}
            </h1>
            <p className="vc-sub">Welcome to GhanaPrep{first ? `, ${first}` : ""}! Your account is ready.</p>
            <div className="vc-bar"><i /></div>
            <p className="vc-skip">Tap anywhere to continue</p>
          </>
        )}
      </div>
    </div>
  );
}
