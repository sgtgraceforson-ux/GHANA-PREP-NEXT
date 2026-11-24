"use client";
// GhanaPrep Premium: plan choice, then Mobile Money payment.
// NOTE: payment is still in TEST MODE: no money is taken (see the README / security notes).
// To change prices or plans, edit PLANS below; every price shown in the app comes from here.
import { useEffect, useState } from "react";
import { Crown, Check, Infinity as InfinityIcon, Sparkles, Languages, ListOrdered, BookOpen, BarChart3, X, ShieldCheck, Smartphone, Loader2, PartyPopper } from "lucide-react";

export type Plan = { id: string; name: string; price: number; period: string; length: string; months: number; note: string; badge?: string };
export const PLANS: Plan[] = [
  { id: "week", name: "Weekly", price: 15, period: "week", length: "7 days", months: 0, note: "Try Premium for a week" },
  { id: "month", name: "Monthly", price: 50, period: "month", length: "1 month", months: 1, note: "Pay as you go, cancel anytime", badge: "Most popular" },
  { id: "term", name: "Termly", price: 130, period: "3 months", length: "3 months", months: 3, note: "One school term" },
  { id: "year", name: "Yearly", price: 450, period: "year", length: "12 months", months: 12, note: "All the way to your exam", badge: "Best value" },
];
const MONTHLY = PLANS.find((p) => p.id === "month")!.price;
/** Short price line for buttons and cards elsewhere in the app, e.g. "From GHS 15 a week". */
export const PRICE_FROM = (() => { const p = [...PLANS].sort((a, b) => a.price - b.price)[0]; return `From GHS ${p.price} a ${p.period}`; })();

const perMonth = (p: Plan) => (p.months > 1 ? p.price / p.months : null);
const saving = (p: Plan) => (p.months > 1 ? MONTHLY * p.months - p.price : 0);
const ghs = (n: number) => "GHS " + (Number.isInteger(n) ? n : n.toFixed(2));

const NETWORKS = [
  { id: "mtn", name: "MTN MoMo", color: "#ffcc00", ink: "#1a1500" },
  { id: "telecel", name: "Telecel Cash", color: "#e30613", ink: "#fff" },
  { id: "at", name: "AT Money", color: "#0f75bc", ink: "#fff" },
];

const BENEFITS = [
  // Only what Premium really adds today: the free plan is limited to 3 questions a day.
  { Icon: InfinityIcon, text: "Unlimited practice questions every day" },
  { Icon: Sparkles, text: "AI marking of every theory answer" },
  { Icon: ListOrdered, text: "Step-by-step explanations without limits" },
  { Icon: Languages, text: "Twi voice explanations" },
  { Icon: BarChart3, text: "Full progress dashboard and weak topics" },
  { Icon: BookOpen, text: "All BECE and WASSCE subjects" },
];

const CSS = `
.pw-back{position:fixed;inset:0;z-index:700;background:rgba(2,6,4,.82);backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .2s ease}
.pw{position:relative;width:100%;max-width:430px;max-height:94vh;overflow-y:auto;border-radius:26px 26px 0 0;background:#0b110e;color:#f3f6f4;font-family:'DM Sans',system-ui,sans-serif;border:1px solid rgba(232,196,104,.28);border-bottom:none;animation:slideUp .34s cubic-bezier(.22,.68,0,1.2);overscroll-behavior:contain}
.pw *{box-sizing:border-box}
.pw-hero{position:relative;overflow:hidden;padding:26px 22px 22px;text-align:center;background:radial-gradient(120% 90% at 50% 0%,rgba(232,196,104,.26),transparent 62%),linear-gradient(180deg,#13201a,#0b110e)}
.pw-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,235,170,.10) 50%,transparent 65%);background-size:250% 100%;animation:pwShine 4.5s linear infinite;pointer-events:none}
@keyframes pwShine{from{background-position:150% 0}to{background-position:-100% 0}}
.pw-close{position:absolute;top:14px;right:14px;z-index:2;width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.35);color:#cbd5d1;display:flex;align-items:center;justify-content:center;cursor:pointer}
.pw-crown{width:64px;height:64px;margin:0 auto 12px;border-radius:20px;display:flex;align-items:center;justify-content:center;color:#1a1303;background:linear-gradient(145deg,#fbe7a6,#d9ae4a 55%,#a97b1f);box-shadow:0 10px 30px -6px rgba(232,196,104,.65),inset 0 1px 0 rgba(255,255,255,.6)}
.pw-kicker{font-size:11px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:#e8c468}
.pw-title{font-family:'Syne','DM Sans',sans-serif;font-weight:800;font-size:25px;line-height:1.15;margin-top:6px}
.pw-title em{font-style:normal;background:linear-gradient(90deg,#fbe7a6,#e8c468,#c9962f);-webkit-background-clip:text;background-clip:text;color:transparent}
.pw-sub{font-size:13px;color:#a9b8b1;margin-top:8px;line-height:1.5}
.pw-body{padding:18px 18px 28px}
.pw-benefits{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px}
.pw-benefit{display:flex;gap:8px;align-items:flex-start;padding:10px;border-radius:12px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);font-size:12px;line-height:1.35;color:#d5ded9}
.pw-benefit svg{flex:none;width:16px;height:16px;color:#e8c468;margin-top:1px}
.pw-label{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#8fa199;margin:0 0 10px}
.pw-plans{display:flex;flex-direction:column;gap:10px}
.pw-plan{position:relative;display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:14px;border-radius:16px;cursor:pointer;color:inherit;font-family:inherit;background:rgba(255,255,255,.03);border:1.5px solid rgba(255,255,255,.1);transition:border-color .15s,background .15s,transform .15s}
.pw-plan:hover{border-color:rgba(232,196,104,.45)}
.pw-plan[aria-checked="true"]{background:linear-gradient(135deg,rgba(232,196,104,.14),rgba(232,196,104,.04));border-color:#e8c468;box-shadow:0 8px 26px -14px rgba(232,196,104,.8)}
.pw-radio{flex:none;width:22px;height:22px;border-radius:50%;border:2px solid rgba(255,255,255,.28);display:flex;align-items:center;justify-content:center}
.pw-plan[aria-checked="true"] .pw-radio{border-color:#e8c468;background:#e8c468;color:#1a1303}
.pw-radio svg{width:13px;height:13px;opacity:0}
.pw-plan[aria-checked="true"] .pw-radio svg{opacity:1}
.pw-pname{font-weight:800;font-size:15px}
.pw-pnote{font-size:12px;color:#8fa199;margin-top:2px}
.pw-save{display:inline-block;margin-top:5px;font-size:11px;font-weight:800;color:#4ade80;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.3);border-radius:999px;padding:2px 8px}
.pw-price{margin-left:auto;text-align:right;flex:none}
.pw-amount{font-family:'Syne','DM Sans',sans-serif;font-weight:800;font-size:20px;white-space:nowrap}
.pw-per{font-size:11.5px;color:#8fa199;white-space:nowrap}
.pw-badge{position:absolute;top:-9px;right:14px;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:3px 9px;border-radius:999px;color:#1a1303;background:linear-gradient(90deg,#fbe7a6,#e8c468)}
.pw-badge.green{background:linear-gradient(90deg,#86efac,#22c55e);color:#03130c}
.pw-cta{width:100%;margin-top:18px;padding:15px;border:none;border-radius:999px;cursor:pointer;font-family:'Syne','DM Sans',sans-serif;font-weight:800;font-size:15.5px;color:#1a1303;background:linear-gradient(180deg,#fbe7a6,#e1b64f 60%,#c9962f);box-shadow:0 14px 30px -12px rgba(232,196,104,.9),inset 0 1px 0 rgba(255,255,255,.55);display:flex;align-items:center;justify-content:center;gap:8px}
.pw-cta:disabled{opacity:.6;cursor:default}
.pw-fine{font-size:11px;color:#71827a;text-align:center;line-height:1.6;margin-top:12px}
.pw-trust{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;margin-top:12px;font-size:11.5px;color:#8fa199}
.pw-trust span{display:inline-flex;align-items:center;gap:5px}
.pw-trust svg{width:14px;height:14px;color:#4ade80}
.pw-summary{display:flex;justify-content:space-between;align-items:center;padding:14px;border-radius:14px;background:rgba(232,196,104,.08);border:1px solid rgba(232,196,104,.3);margin-bottom:16px}
.pw-link{background:none;border:none;color:#e8c468;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;padding:0}
.pw-nets{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
.pw-net{padding:12px 6px;border-radius:12px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:800;border:2px solid transparent;opacity:.55;transition:opacity .15s,transform .15s}
.pw-net[aria-checked="true"]{opacity:1;border-color:#fff;transform:translateY(-1px)}
.pw-input{width:100%;padding:14px;border-radius:12px;font-size:16px;font-family:inherit;color:#f3f6f4;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.14);outline:none}
.pw-input:focus{border-color:#e8c468}
.pw-err{font-size:12.5px;color:#f87171;margin-top:8px}
.pw-center{text-align:center;padding:28px 10px 8px}
.pw-spin{animation:spin 1s linear infinite;color:#e8c468}
@media (prefers-reduced-motion: reduce){.pw-hero::after,.pw-spin{animation:none}}
`;

export function PremiumSheet({ onClose, onPaid }: { onClose: () => void; onPaid: (plan: Plan) => void }) {
  const [planId, setPlanId] = useState("month");
  const [step, setStep] = useState<"plans" | "pay" | "processing" | "done">("plans");
  const [network, setNetwork] = useState("mtn");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const plan = PLANS.find((p) => p.id === planId)!;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && step !== "processing") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, onClose]);

  function pay() {
    const digits = phone.replace(/\D/g, "");
    if (!/^0[2-9]\d{8}$/.test(digits)) { setError("Enter a valid 10-digit Ghana number, e.g. 024 123 4567"); return; }
    setError(""); setStep("processing");
    setTimeout(() => setStep("done"), 2200); // TEST MODE: no real payment request is sent
  }

  return (
    <div className="pw-back" onClick={() => step !== "processing" && onClose()}>
      {/* fixed stylesheet (no user input); set as raw text so server and browser render it identically */}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pw" role="dialog" aria-modal="true" aria-label="GhanaPrep Premium" onClick={(e) => e.stopPropagation()}>
        {step !== "processing" && <button className="pw-close" onClick={onClose} aria-label="Close"><X size={18} /></button>}

        <div className="pw-hero">
          <div className="pw-crown" aria-hidden="true"><Crown size={32} strokeWidth={2.2} /></div>
          <p className="pw-kicker">GhanaPrep Premium</p>
          <h2 className="pw-title">{step === "done" ? <>You're <em>Premium</em>!</> : <>Study without <em>limits</em></>}</h2>
          {step !== "done" && <p className="pw-sub">Everything you need to pass your BECE or WASSCE, in one app.</p>}
        </div>

        <div className="pw-body">
          {step === "plans" && (<>
            <div className="pw-benefits">
              {BENEFITS.map(({ Icon, text }) => <div key={text} className="pw-benefit"><Icon aria-hidden="true" />{text}</div>)}
            </div>
            <p className="pw-label">Choose your plan</p>
            <div className="pw-plans" role="radiogroup" aria-label="Choose your plan">
              {PLANS.map((p) => {
                const pm = perMonth(p), save = saving(p);
                return (
                  <button key={p.id} type="button" role="radio" aria-checked={planId === p.id} className="pw-plan" onClick={() => setPlanId(p.id)}>
                    {p.badge && <span className={"pw-badge" + (p.badge === "Best value" ? " green" : "")}>{p.badge}</span>}
                    <span className="pw-radio"><Check strokeWidth={3.5} /></span>
                    <span style={{ minWidth: 0 }}>
                      <span className="pw-pname" style={{ display: "block" }}>{p.name}</span>
                      <span className="pw-pnote" style={{ display: "block" }}>{p.note}</span>
                      {save > 0 && <span className="pw-save">Save {ghs(save)}</span>}
                    </span>
                    <span className="pw-price">
                      <span className="pw-amount" style={{ display: "block" }}>{ghs(p.price)}</span>
                      <span className="pw-per" style={{ display: "block" }}>{pm ? `${ghs(Math.round(pm * 100) / 100)} a month` : `per ${p.period}`}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <button className="pw-cta" onClick={() => setStep("pay")}>Continue with {plan.name} · {ghs(plan.price)}</button>
            <div className="pw-trust">
              <span><ShieldCheck aria-hidden="true" /> No hidden fees</span>
              <span><Smartphone aria-hidden="true" /> Pay with Mobile Money</span>
            </div>
          </>)}

          {step === "pay" && (<>
            <div className="pw-summary">
              <div>
                <p style={{ fontWeight: 800, fontSize: 15 }}>{plan.name} plan</p>
                <p style={{ fontSize: 12.5, color: "#a9b8b1", marginTop: 2 }}>{ghs(plan.price)} for {plan.length}</p>
              </div>
              <button className="pw-link" onClick={() => setStep("plans")}>Change</button>
            </div>
            <p className="pw-label">Pay with</p>
            <div className="pw-nets" role="radiogroup" aria-label="Mobile Money network">
              {NETWORKS.map((n) => (
                <button key={n.id} type="button" role="radio" aria-checked={network === n.id} className="pw-net" onClick={() => setNetwork(n.id)} style={{ background: n.color, color: n.ink }}>{n.name}</button>
              ))}
            </div>
            <label className="pw-label" htmlFor="pw-phone" style={{ display: "block" }}>Mobile Money number</label>
            <input id="pw-phone" className="pw-input" value={phone} inputMode="tel" autoComplete="tel" placeholder="024 123 4567"
              onChange={(e) => { setPhone(e.target.value); setError(""); }} onKeyDown={(e) => e.key === "Enter" && pay()} />
            {error && <p className="pw-err" role="alert">{error}</p>}
            <button className="pw-cta" onClick={pay}>Pay {ghs(plan.price)}</button>
            <p className="pw-fine">You will get a prompt on your phone to approve the payment with your PIN. We never see or store your PIN.<br />Test mode: no money is taken yet.</p>
          </>)}

          {step === "processing" && (
            <div className="pw-center" role="status">
              <Loader2 size={40} className="pw-spin" aria-hidden="true" />
              <p style={{ fontWeight: 800, fontSize: 16, marginTop: 14 }}>Approve the prompt on your phone…</p>
              <p style={{ fontSize: 13, color: "#a9b8b1", marginTop: 6 }}>{NETWORKS.find((n) => n.id === network)!.name} · {ghs(plan.price)}</p>
              <p style={{ fontSize: 11.5, color: "#71827a", marginTop: 10 }}>Test mode: no real payment is taken.</p>
            </div>
          )}

          {step === "done" && (
            <div className="pw-center">
              <PartyPopper size={44} color="#e8c468" aria-hidden="true" />
              <p style={{ fontSize: 14, color: "#d5ded9", marginTop: 12, lineHeight: 1.6 }}>Your <b>{plan.name}</b> plan is active. Unlimited questions, AI marking and explanations are now open. Ayekoo!</p>
              <button className="pw-cta" onClick={() => onPaid(plan)}>Start practising</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
