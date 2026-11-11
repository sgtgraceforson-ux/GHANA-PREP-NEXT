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

## Email sign-in and verification codes

Everyone signs in with their email address and password. At sign-up a 6-digit code is emailed to confirm the address (`/api/auth/code`).

Sending uses a normal Gmail account, so no domain is needed:

1. Create (or pick) a Gmail account for the app, for example `ghanaprep.app@gmail.com`.
2. Turn on 2-Step Verification for it at https://myaccount.google.com/security.
3. Create an app password at https://myaccount.google.com/apppasswords and copy the 16 letters.
4. Put `SMTP_USER` (the Gmail address) and `SMTP_PASS` (the app password) in `.env.local`, and in Vercel under Settings → Environment Variables, then redeploy.

Gmail allows about 500 emails a day. To use another provider later, set `SMTP_HOST`, `SMTP_PORT` and `MAIL_FROM` as well.

When `SMTP_USER` is not set and the app runs locally (`npm run dev`), the code is shown on the verification screen instead of being emailed, so sign-up can be tested without email.
