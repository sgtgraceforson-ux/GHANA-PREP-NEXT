// Skeleton loaders. Each one mirrors the layout of the screen it stands in for,
// so the page does not jump when the real content arrives.
// Plain markup only (no hooks), so they also work in Next.js loading.tsx files.
import type { CSSProperties, ReactNode } from "react";

const CSS = `
.gp-sk{display:block;background:linear-gradient(90deg,rgba(255,255,255,.06) 25%,rgba(255,255,255,.14) 37%,rgba(255,255,255,.06) 63%);background-size:400% 100%;animation:gpSk 1.4s ease infinite}
@keyframes gpSk{0%{background-position:100% 50%}100%{background-position:0 50%}}
@media (prefers-reduced-motion:reduce){.gp-sk{animation:none}}
.gp-skel *{box-sizing:border-box}`;

type Size = number | string;
function B({ w, h, r = 8, style }: { w: Size; h: Size; r?: Size; style?: CSSProperties }) {
  return <span aria-hidden="true" className="gp-sk" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

// Same card and page styles the real teacher and classroom pages use.
const card: CSSProperties = { background: "#161d18", border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: 16 };
const page: CSSProperties = { minHeight: "100vh", background: "#0a0f0d", color: "#f0f4f8", display: "flex", justifyContent: "center", padding: "24px 18px 48px" };
const between: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 };

function Frame({ children, style, label = "Loading" }: { children: ReactNode; style?: CSSProperties; label?: string }) {
  return (
    <div className="gp-skel" role="status" aria-busy="true" aria-label={label} style={style}>
      <style>{CSS}</style>
      {children}
    </div>
  );
}

/* ── Student home (the old app's first screen after sign-in) ── */
export function HomeSkeleton() {
  const soft: CSSProperties = { border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.035)" };
  return (
    <Frame label="Loading your home screen" style={{ minHeight: "100vh", maxWidth: 430, margin: "0 auto" }}>
      {/* top bar: avatar, greeting and name, streak, support, sign out */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 20px 0" }}>
        <B w={44} h={44} r="50%" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}><B w={84} h={11} /><B w={130} h={19} style={{ marginTop: 7 }} /></div>
        <B w={52} h={38} r={12} /><B w={38} h={38} r={12} /><B w={38} h={38} r={12} /><B w={38} h={38} r={12} />
      </div>
      <div style={{ padding: "18px 20px 0" }}>
        {/* continue card with today's progress bar */}
        <div style={{ ...soft, borderRadius: 22, padding: "20px 20px 18px", marginBottom: 14 }}>
          <B w={130} h={11} /><B w="66%" h={22} style={{ marginTop: 10 }} /><B w="84%" h={12} style={{ marginTop: 9 }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}><B w={130} h={11} /><B w={40} h={11} /></div>
          <B w="100%" h={7} r={99} style={{ marginTop: 8 }} />
        </div>
        {/* three stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 22 }}>
          {[0, 1, 2].map((i) => <div key={i} style={{ ...soft, borderRadius: 16, padding: "13px 14px" }}><B w={34} h={20} /><B w={58} h={10} style={{ marginTop: 7 }} /></div>)}
        </div>
        {/* choose your exam */}
        <B w={136} h={15} style={{ marginBottom: 12 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
          {[0, 1].map((i) => <div key={i} style={{ ...soft, borderRadius: 20, padding: "16px 16px 14px" }}><B w={44} h={44} r={14} /><B w="58%" h={19} style={{ marginTop: 15 }} /><B w="86%" h={11} style={{ marginTop: 7 }} /></div>)}
        </div>
        {/* with your class */}
        <B w={120} h={15} style={{ marginBottom: 12 }} />
        <div style={{ ...soft, borderRadius: 20, overflow: "hidden" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 15px", borderTop: i ? "1px solid rgba(255,255,255,.07)" : "none" }}>
              <B w={40} h={40} r={12} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}><B w="42%" h={14} /><B w="78%" h={11} style={{ marginTop: 6 }} /></div>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

/* ── Leaderboard list (inside the leaderboard sheet) ── */
export function LeaderboardSkeleton() {
  const podium = [64, 90, 50];
  return (
    <Frame label="Loading rankings" style={{ paddingTop: 6 }}>
      <B w={96} h={10} style={{ margin: "0 auto 14px" }} />
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 6, marginBottom: 20 }}>
        {podium.map((h, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
            <B w={i === 1 ? 54 : 44} h={i === 1 ? 54 : 44} r="50%" />
            <B w={58} h={10} />
            <B w={86} h={h} r="10px 10px 0 0" />
          </div>
        ))}
      </div>
      <B w={84} h={10} style={{ marginBottom: 8 }} />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{ border: "1px solid rgba(255,255,255,.06)", borderRadius: 13, padding: "11px 13px", marginBottom: 8, display: "flex", alignItems: "center", gap: 11 }}>
          <B w={30} h={16} /><B w={36} h={36} r="50%" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}><B w="55%" h={13} /><B w="36%" h={10} style={{ marginTop: 6 }} /></div>
          <B w={44} h={18} />
        </div>
      ))}
    </Frame>
  );
}

/* ── Teacher dashboard ── */
export function TeacherDashboardSkeleton() {
  return (
    <Frame label="Loading teacher dashboard" style={page}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ ...between, alignItems: "flex-start", marginBottom: 20 }}>
          <div><B w={150} h={12} /><B w={200} h={26} style={{ margin: "8px 0" }} /><B w={170} h={13} /></div>
          <B w={76} h={34} r={10} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
          {[0, 1, 2].map((i) => <div key={i} style={card}><B w="70%" h={11} /><B w={36} h={26} style={{ marginTop: 8 }} /></div>)}
        </div>
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ ...between, marginBottom: 16 }}><B w={130} h={16} /><B w={138} h={36} r={10} /></div>
          <div style={between}><B w={150} h={15} /><B w={96} h={15} /></div>
          <B w={200} h={12} style={{ margin: "10px 0 14px" }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><B w={58} h={32} /><B w={92} h={32} /><B w={146} h={32} /></div>
        </div>
        <div style={card}><B w={110} h={16} /><B w="100%" h={12} style={{ marginTop: 12 }} /><B w="70%" h={12} style={{ marginTop: 7 }} /></div>
      </div>
    </Frame>
  );
}

/* ── Teacher's classroom page (Students tab) ── */
export function ClassroomSkeleton() {
  return (
    <Frame label="Loading classroom" style={page}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <B w={84} h={13} />
        <B w={220} h={26} style={{ margin: "14px 0 7px" }} />
        <B w={270} h={13} />
        <div style={{ display: "flex", gap: 4, background: "#1e271f", borderRadius: 12, padding: 4, margin: "18px 0 16px" }}>
          <B w="33.3%" h={36} r={9} /><B w="33.3%" h={36} r={9} /><B w="33.3%" h={36} r={9} />
        </div>
        <div style={{ ...card, ...between, marginBottom: 12 }}><B w={100} h={13} /><B w={28} h={28} /></div>
        <B w="100%" h={46} r={12} style={{ marginBottom: 10 }} />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ ...card, marginBottom: 8, display: "flex", gap: 12, alignItems: "center" }}>
            <B w={38} h={38} r="50%" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}><B w="45%" h={14} /><B w="34%" h={11} style={{ marginTop: 6 }} /><B w="52%" h={11} style={{ marginTop: 5 }} /></div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/* ── Student: Join a classroom ── */
export function JoinBodySkeleton() {
  return (
    <Frame label="Loading your classrooms">
      <B w="100%" h={64} r={12} />
      <B w="100%" h={48} r={999} style={{ marginTop: 14 }} />
      <B w={170} h={16} style={{ margin: "24px 0 10px" }} />
      {[0, 1].map((i) => (
        <div key={i} style={{ ...card, marginBottom: 10 }}><B w="55%" h={14} /><B w="82%" h={12} style={{ marginTop: 7 }} /><B w={100} h={13} style={{ marginTop: 11 }} /></div>
      ))}
    </Frame>
  );
}
export function JoinSkeleton() {
  return (
    <div style={{ ...page, padding: "28px 18px 48px" }}>
      <div style={{ width: "100%", maxWidth: 430 }}>
        <B w={48} h={13} /><B w={220} h={28} style={{ margin: "16px 0 9px" }} /><B w="92%" h={13} style={{ marginBottom: 22 }} />
        <JoinBodySkeleton />
      </div>
    </div>
  );
}

/* ── Student: a classroom's assignments ── */
export function AssignmentsBodySkeleton() {
  return (
    <Frame label="Loading assignments">
      <B w={220} h={26} style={{ margin: "14px 0 7px" }} />
      <B w={250} h={13} style={{ marginBottom: 16 }} />
      <B w={150} h={16} style={{ marginBottom: 10 }} />
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ ...card, marginBottom: 8 }}>
          <div style={between}><B w="50%" h={14} /><B w={72} h={20} r={999} /></div>
          <B w="44%" h={12} style={{ marginTop: 8 }} />
        </div>
      ))}
    </Frame>
  );
}
export function StudentClassroomSkeleton() {
  return (
    <div style={page}><div style={{ width: "100%", maxWidth: 560 }}><B w={90} h={13} /><AssignmentsBodySkeleton /></div></div>
  );
}

/* ── Parent page: heading, child tabs, four progress tiles, topics, assignments ── */
export function ParentSkeleton() {
  return (
    <Frame label="Loading your children's progress" style={page}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ ...between, alignItems: "flex-start", marginBottom: 20 }}>
          <div><B w={70} h={12} /><B w={200} h={26} style={{ margin: "8px 0" }} /><B w={150} h={13} /></div>
          <B w={76} h={34} r={10} />
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}><B w={74} h={38} r={999} /><B w={74} h={38} r={999} /><B w={118} h={38} r={999} /></div>
        <div style={{ ...between, marginBottom: 14 }}><B w={150} h={21} /><B w={178} h={38} r={10} /></div>
        <B w={130} h={15} style={{ marginBottom: 10 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          {[0, 1, 2, 3].map((i) => <div key={i} style={{ ...card, padding: "13px 14px" }}><B w="72%" h={11} /><B w={64} h={24} style={{ marginTop: 8 }} /><B w="80%" h={10} style={{ marginTop: 8 }} /></div>)}
        </div>
        <div style={{ ...card, marginBottom: 12 }}><B w={140} h={15} /><B w="88%" h={12} style={{ marginTop: 9 }} /><B w="100%" h={14} style={{ marginTop: 16 }} /><B w="100%" h={14} style={{ marginTop: 12 }} /></div>
        <B w={170} h={15} style={{ margin: "18px 0 10px" }} />
        <div style={card}><B w="46%" h={14} /><B w="70%" h={11} style={{ marginTop: 7 }} />
          {[0, 1].map((i) => <div key={i} style={{ marginTop: 16 }}><div style={between}><B w="52%" h={14} /><B w={68} h={20} r={999} /></div><B w="60%" h={11} style={{ marginTop: 7 }} /></div>)}
        </div>
      </div>
    </Frame>
  );
}

/* ── First paint of "/" before the app's JavaScript has loaded ──
   The server cannot know who is signed in (the session is in the browser), so the
   home skeleton is rendered hidden and a tiny inline script reveals it only for a
   signed-in student. Signed-out visitors go straight to the splash screen. */
export function BootSkeleton() {
  return (
    <>
      <div id="gp-boot" style={{ display: "none" }} suppressHydrationWarning><HomeSkeleton /></div>
      <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem("gp_session_v3"))document.getElementById("gp-boot").style.display="block"}catch(e){}` }} />
    </>
  );
}
