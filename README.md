# GhanaPrep

BECE & WASSCE practice app built with Next.js 14 and Supabase.

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase project values (Supabase Dashboard → Settings → API).

## Run

```bash
npm run dev
```

Open http://localhost:3000

## AI marking (free LLM)

Theory marking and Twi translation call `/api/llm`, which forwards to any OpenAI-compatible API.

The AI study tutor (the "Ask tutor" button students see once signed in) calls `/api/tutor`, which uses the same key and model and streams the answer live. It needs a provider that supports streaming chat completions (Groq, Gemini and OpenRouter all do).

1. Create a free API key with a provider (for example Groq or Google Gemini).
2. Put `LLM_API_KEY`, `LLM_BASE_URL` and `LLM_MODEL` in `.env.local` (see `.env.example`).
3. On Vercel: Settings → Environment Variables, add the same values, then redeploy.
