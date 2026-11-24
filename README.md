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

Test mode: while `SMTP_USER` and `SMTP_PASS` are not set (locally or on the live site), the code is shown on the verification screen instead of being emailed, so sign-up can be tested without email. In this mode email addresses are not really verified, so set both values before real students sign up.

## Continue with Google

The sign-in screen shows a "Continue with Google" button once `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set. It is free and needs no domain of your own.

1. Go to https://console.cloud.google.com and create a project (for example "GhanaPrep").
2. Open "APIs & Services" → "OAuth consent screen". Choose "External", enter the app name and your email, and save. Then publish the app so anyone with a Google account can sign in.
3. Open "APIs & Services" → "Credentials" → "Create credentials" → "OAuth client ID". Choose "Web application".
4. Under "Authorized JavaScript origins" add every address the app runs on, for example `https://your-app.vercel.app` and, for testing on your computer, `http://localhost:3000` and `http://localhost`.
5. Copy the client ID (it ends in `.apps.googleusercontent.com`) into `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local` and in Vercel → Settings → Environment Variables, then redeploy. No client secret is needed.

How it behaves: someone whose Google email already has an account is signed straight in. A new person is asked for their phone number, role and school once, with no password and no email code, because Google has already verified the email.

## Headmaster dashboard

Every government SHS has a headmaster code: the first 3 letters of the school's name and 4 numbers, for example `ACH-6335`. The headmaster signs in at `/headmaster` with it (the first time they also enter their name). Teachers must choose their school from the list when they sign up, and every classroom they create then appears on that school's headmaster dashboard.

Codes are never stored in the code or sent to the browser. They are worked out on the server from the secret `HEADMASTER_CODE_SECRET`.

1. `.env.local` already has a `HEADMASTER_CODE_SECRET`. Add the **same value** in Vercel → Settings → Environment Variables, then redeploy. Changing it later changes every school's code.
2. Run `node scripts/headmaster-codes.mjs` to write all codes to `private/headmaster-codes.csv` (open it in Excel). This file is excluded from git: keep it private and give each headmaster only their own code.

The school list (`lib/schools.json`) comes from Wikipedia's list of senior high schools in Ghana and is incomplete (about 550 of roughly 720 public SHS). Add missing schools at the **end** of the file so existing codes do not change, then run the script again.

## Database (Supabase)

Accounts, practice progress, classrooms, assignments, announcements, quizzes, parent links and the headmaster dashboard are stored in Supabase.

- The browser never talks to Supabase. Every read and change goes through this app's server (`/api/auth/*`, `/api/me`, `/api/data`, `/api/leaderboard`), which checks the signed sign-in cookie first and sends each person only what they may see (`lib/server/data.ts`).
- Every table has row level security ON with no policies, so the public key cannot read anything.
- Set up a new database by running `supabase/schema.sql` in the Supabase SQL Editor (safe to run again).
- Needed in `.env.local` and on Vercel: `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (the secret / service_role key, server-only) and `AUTH_SECRET` (signs sessions). Never put the secret key in browser code.
