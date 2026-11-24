import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Role-based page protection, decided from the SERVER-SIGNED sign-in cookies (they cannot be
// made or edited in the browser):
//  - gp_sid  : a signed-in student, teacher or parent (set by /api/auth/*)
//  - gp_head : a headmaster signed in with their school's code (set by /api/headmaster/login)
//  - /headmaster : its own code sign-in; headmasters cannot open anything else
//  - /parent     : parents only (and parents cannot open anything else)
//  - /teacher/*  : teachers only
//  - everything else (student pages): not for teachers, except the quiz tool at /?quizhub=1
// The data itself is protected separately: every API route checks the signed cookie again.

const enc = new TextEncoder();
const b64urlToBytes = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
const bytesToB64url = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** Same format as lib/server/auth.ts signToken: base64url(json) + "." + HMAC(purpose|data). */
async function readToken(purpose: string, token: string | undefined): Promise<any | null> {
  if (!token || token.length > 4000) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const secret = process.env.AUTH_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev-only-auth-secret");
  if (!secret) return null;
  try {
    const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const good = bytesToB64url(await crypto.subtle.sign("HMAC", key, enc.encode(`${purpose}|${data}`)));
    let diff = good.length ^ sig.length;
    for (let i = 0; i < Math.min(good.length, sig.length); i++) diff |= good.charCodeAt(i) ^ sig.charCodeAt(i);
    if (diff !== 0) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(data)));
    return typeof payload.exp === "number" && payload.exp > Date.now() ? payload : null;
  } catch { return null; }
}

export async function middleware(req: NextRequest) {
  const head = await readToken("head", req.cookies.get("gp_head")?.value);
  const session = head ? null : await readToken("session", req.cookies.get("gp_sid")?.value);
  const role = head ? "headmaster" : session?.role || "";
  const isTeacher = role === "teacher", isParent = role === "parent", isHead = role === "headmaster";

  const p = req.nextUrl.pathname;
  const teacherArea = p === "/teacher" || p.startsWith("/teacher/");
  const parentArea = p === "/parent" || p.startsWith("/parent/");
  const headArea = p === "/headmaster" || p.startsWith("/headmaster/");
  const go = (to: string) => { const u = req.nextUrl.clone(); u.pathname = to; u.search = ""; return NextResponse.redirect(u); };

  if (isHead && !headArea) return go("/headmaster");  // headmasters only see their dashboard
  if (headArea) return NextResponse.next();           // it has its own sign-in (the school's headmaster code)
  if (isParent && !parentArea) return go("/parent");  // parents only see the parent page
  if (!isParent && parentArea) return go("/");        // nobody else can open it
  // The one exception: the teacher quiz tool lives on the main page at /?quizhub=1
  if (isTeacher && p === "/" && req.nextUrl.searchParams?.get("quizhub") === "1") return NextResponse.next();
  if (isTeacher && !teacherArea) return go("/teacher/dashboard"); // teachers cannot open student pages
  if (isTeacher && p === "/teacher") return go("/teacher/dashboard");
  if (!isTeacher && teacherArea) return go("/");      // students cannot open teacher pages
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
