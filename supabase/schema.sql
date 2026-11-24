-- GhanaPrep database: accounts, practice stats, classrooms, assignments, announcements, quizzes, parents.
-- Safe to run more than once.
--
-- Security model: the browser never talks to Supabase. Every read and write goes through the
-- app's own server (/api/...), which uses the secret key and checks who is signed in.
-- Row level security is ON with NO policies, so the public (anon/publishable) key cannot read
-- or change anything in these tables.

create extension if not exists pgcrypto;

create table if not exists public.gp_accounts (
  id             uuid primary key default gen_random_uuid(),
  email          text not null unique check (email = lower(email)),
  phone          text not null unique,
  name           text not null,
  role           text not null default 'student' check (role in ('student', 'teacher', 'parent')),
  password_hash  text,                 -- scrypt; null for accounts that only sign in with Google
  google         boolean not null default false,
  school         text not null default '',
  school_id      text,                 -- teachers: id from lib/schools.json (links them to the headmaster)
  region         text not null default '',
  avatar_color   text not null default '#22c55e',
  stats          jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  last_login_at  timestamptz
);

create index if not exists gp_accounts_role_idx on public.gp_accounts (role);
create index if not exists gp_accounts_school_id_idx on public.gp_accounts (school_id);

alter table public.gp_accounts enable row level security;
revoke all on public.gp_accounts from anon, authenticated;
-- the app's server (secret key) needs these; newer Supabase projects do not grant them automatically
grant select, insert, update, delete on public.gp_accounts to service_role;

-- ═══ Stage 2: classrooms, assignments, announcements, quizzes, parents ═══
-- `data` holds the record the app works with; the other columns are what the server
-- needs to check who may see or change it.

create table if not exists public.gp_classrooms (
  id          text primary key,
  code        text not null unique,
  teacher_id  uuid not null references public.gp_accounts(id) on delete cascade,
  school_id   text,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists gp_classrooms_teacher_idx on public.gp_classrooms (teacher_id);
create index if not exists gp_classrooms_school_idx on public.gp_classrooms (school_id);

create table if not exists public.gp_members (
  classroom_id text not null references public.gp_classrooms(id) on delete cascade,
  student_id   uuid not null references public.gp_accounts(id) on delete cascade,
  joined_at    timestamptz not null default now(),
  primary key (classroom_id, student_id)
);
create index if not exists gp_members_student_idx on public.gp_members (student_id);

create table if not exists public.gp_assignments (
  id           text primary key,
  classroom_id text not null references public.gp_classrooms(id) on delete cascade,
  data         jsonb not null,
  created_at   timestamptz not null default now()
);
create index if not exists gp_assignments_classroom_idx on public.gp_assignments (classroom_id);

create table if not exists public.gp_submissions (
  assignment_id text not null references public.gp_assignments(id) on delete cascade,
  student_id    uuid not null references public.gp_accounts(id) on delete cascade,
  data          jsonb not null,
  primary key (assignment_id, student_id)
);
create index if not exists gp_submissions_student_idx on public.gp_submissions (student_id);

create table if not exists public.gp_announcements (
  id           text primary key,
  classroom_id text not null references public.gp_classrooms(id) on delete cascade,
  data         jsonb not null,
  created_at   timestamptz not null default now()
);
create index if not exists gp_announcements_classroom_idx on public.gp_announcements (classroom_id);

create table if not exists public.gp_announcement_reads (
  student_id      uuid not null references public.gp_accounts(id) on delete cascade,
  announcement_id text not null references public.gp_announcements(id) on delete cascade,
  read_at         timestamptz not null default now(),
  primary key (student_id, announcement_id)
);

create table if not exists public.gp_quizzes (
  code       text primary key,
  owner_id   uuid not null references public.gp_accounts(id) on delete cascade,
  data       jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists gp_quizzes_owner_idx on public.gp_quizzes (owner_id);

create table if not exists public.gp_quiz_results (
  id         bigint generated always as identity primary key,
  code       text not null references public.gp_quizzes(code) on delete cascade,
  student_id uuid not null references public.gp_accounts(id) on delete cascade,
  data       jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists gp_quiz_results_code_idx on public.gp_quiz_results (code);
create index if not exists gp_quiz_results_student_idx on public.gp_quiz_results (student_id);

create table if not exists public.gp_quiz_opened (
  student_id uuid not null references public.gp_accounts(id) on delete cascade,
  code       text not null references public.gp_quizzes(code) on delete cascade,
  primary key (student_id, code)
);

create table if not exists public.gp_parent_codes (
  student_id uuid primary key references public.gp_accounts(id) on delete cascade,
  code       text not null unique
);

create table if not exists public.gp_parent_links (
  parent_id  uuid not null references public.gp_accounts(id) on delete cascade,
  student_id uuid not null references public.gp_accounts(id) on delete cascade,
  linked_at  timestamptz not null default now(),
  primary key (parent_id, student_id)
);
create index if not exists gp_parent_links_student_idx on public.gp_parent_links (student_id);

-- same lock as the accounts table: no public access, the app's server only
do $$
declare t text;
begin
  foreach t in array array['gp_classrooms','gp_members','gp_assignments','gp_submissions','gp_announcements',
    'gp_announcement_reads','gp_quizzes','gp_quiz_results','gp_quiz_opened','gp_parent_codes','gp_parent_links']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to service_role', t);
  end loop;
end $$;
