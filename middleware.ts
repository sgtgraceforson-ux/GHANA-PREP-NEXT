import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Role-based protection.
//  - /parent     : parents only (and parents cannot open anything else)
//  - /teacher/*  : teachers only (everyone else is sent to the main sign-in page, "/")
//  - everything else (student pages: /, /dashboard, /student/* ...): not for teachers
// The role cookie is set by the teacher sign-in. In demo/local mode it is not tamper-proof;
// use server-verified roles (e.g. Supabase) before relying on this for real data.
export function middleware(req: NextRequest) {
  const role = req.cookies.get("gp_role")?.value;
  const isTeacher = role === "teacher";
  const isParent = role === "parent";
  const p = req.nextUrl.pathname;
  const teacherArea = p === "/teacher" || p.startsWith("/teacher/");
  const parentArea = p === "/parent" || p.startsWith("/parent/");
  const go = (to: string) => { const u = req.nextUrl.clone(); u.pathname = to; u.search = ""; return NextResponse.redirect(u); };

  if (isParent && !parentArea) return go("/parent"); // parents only see the parent page
  if (!isParent && parentArea) return go("/");       // nobody else can open it
  // The one exception: the teacher quiz tool lives on the main page at /?quizhub=1
  if (isTeacher && p === "/" && req.nextUrl.searchParams?.get("quizhub") === "1") return NextResponse.next();
  if (isTeacher && !teacherArea) return go("/teacher/dashboard"); // teachers cannot open student pages
  if (isTeacher && p === "/teacher") return go("/teacher/dashboard");
  if (!isTeacher && teacherArea) return go("/"); // students cannot open teacher pages
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
