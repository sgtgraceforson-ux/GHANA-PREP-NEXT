import { clearSessionCookie } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json", "Set-Cookie": clearSessionCookie() } });
}
