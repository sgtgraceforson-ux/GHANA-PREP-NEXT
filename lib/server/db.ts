// Server-only access to the Supabase database, with the SECRET key.
// Never import this from a "use client" file: the key must stay on the server.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export class NotConfigured extends Error {}

export function db(): SupabaseClient {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new NotConfigured("SUPABASE_URL / SUPABASE_SECRET_KEY are not set");
  if (!client) client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Next.js caches server-side fetches by default; database reads must always be fresh
    global: { fetch: (input: any, init?: any) => fetch(input, { ...init, cache: "no-store" }) },
  });
  return client;
}
