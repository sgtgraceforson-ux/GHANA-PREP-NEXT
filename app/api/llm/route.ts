// Server-side proxy to any OpenAI-compatible LLM API (free tiers: Groq, Gemini, OpenRouter, ...).
// The API key lives in server env vars only and never reaches the browser.
//
// The app sends the same body it used to send to Anthropic ({ messages, max_tokens })
// and gets back { content: [{ type: "text", text }] }, so the UI code barely changes.

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "LLM_API_KEY is not set on the server." }, { status: 500 });
  }

  // Only accept calls made from this site (blocks other websites using your free quota).
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host) {
    let originHost = "";
    try { originHost = new URL(origin).host; } catch {}
    if (originHost !== host) {
      return Response.json({ error: "Forbidden origin." }, { status: 403 });
    }
  }

  let body: any;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON body." }, { status: 400 }); }

  const messages = Array.isArray(body?.messages) ? body.messages : null;
  if (!messages || messages.length === 0 || messages.length > 6) {
    return Response.json({ error: "messages must be an array of 1-6 items." }, { status: 400 });
  }
  const clean = messages.map((m: any) => ({
    role: m?.role === "assistant" ? "assistant" : "user",
    content: String(m?.content ?? ""),
  }));
  const totalChars = clean.reduce((n: number, m: any) => n + m.content.length, 0);
  if (totalChars > 8000) {
    return Response.json({ error: "Prompt too long." }, { status: 413 });
  }

  // max_tokens is only a cap. The floor leaves room for "thinking" models.
  const maxTokens = Math.min(Math.max(Number(body?.max_tokens) || 500, 800), 1500);

  const baseUrl = (process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/+$/, "");
  const payload: Record<string, unknown> = {
    model: process.env.LLM_MODEL || "openai/gpt-oss-120b", // model is chosen server-side only
    messages: clean,
    max_tokens: maxTokens,
    temperature: 0.3,
  };
  if (process.env.LLM_REASONING_EFFORT) payload.reasoning_effort = process.env.LLM_REASONING_EFFORT;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      return Response.json({ error: `LLM provider error (${res.status}).` }, { status: 502 });
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text || typeof text !== "string") {
      return Response.json({ error: "Empty response from LLM provider." }, { status: 502 });
    }
    return Response.json({ content: [{ type: "text", text }] });
  } catch {
    return Response.json({ error: "Could not reach the LLM provider." }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
