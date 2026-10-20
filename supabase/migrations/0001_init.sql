-- FORGE personal data. Apply with the Supabase SQL editor or CLI.
-- The anon key may be public. Never ship the service role key to the browser.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  areas text[] not null default '{}',
  onboarded boolean not null default false,
  timezone text not null default 'UTC',
  task_start_reminders boolean not null default true,
  incomplete_follow_up boolean not null default false,
  daily_review_reminder boolean not null default true,
  daily_review_time time not null default '21:00',
  quiet_hours_enabled boolean not null default true,
  quiet_start time not null default '22:00',
  quiet_end time not null default '07:00',
  pause_all boolean not null default false,
  text_size text not null default 'default',
  reduce_motion boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  priority integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists goals_user_id_idx on public.goals (user_id);

create table if not exists public.tasks (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  series_id uuid not null,
  title text not null,
  scheduled_date date not null,
  scheduled_time time not null,
  duration_minutes integer not null check (duration_minutes between 5 and 480),
  category text not null,
  repeat_rule text not null default 'none',
  reminder_enabled boolean not null default false,
  status text not null default 'scheduled',
  completed_at timestamptz,
  reflection text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_user_date_idx on public.tasks (user_id, scheduled_date);

create table if not exists public.daily_reviews (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  review_date date not null,
  mood integer not null check (mood between 1 and 5),
  obstacles text not null default '',
  tomorrow_adjustment text not null default '',
  completed_at timestamptz not null default now(),
  unique (user_id, review_date)
);
create index if not exists daily_reviews_user_idx on public.daily_reviews (user_id);

create table if not exists public.weekly_reviews (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  went_well text not null default '',
  difficult text not null default '',
  patterns text not null default '',
  next_focus text not null default '',
  completed_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table if not exists public.experiments (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  hypothesis text not null default '',
  measure_prompt text not null default '',
  category text not null default 'Focus',
  duration_days integer not null check (duration_days between 3 and 90),
  start_date date,
  end_date date,
  baseline numeric,
  baseline_note text not null default '',
  measurements jsonb not null default '[]'::jsonb,
  reflection text not null default '',
  status text not null default 'active',
  decision text,
  reminder_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists experiments_user_idx on public.experiments (user_id);

create table if not exists public.reminder_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reminder_key text not null,
  channel text not null,
  fired_at timestamptz not null default now(),
  unique (user_id, reminder_key)
);
create index if not exists reminder_log_user_idx on public.reminder_log (user_id);

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  keys jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.tasks enable row level security;
alter table public.daily_reviews enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.experiments enable row level security;
alter table public.reminder_log enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "profiles own rows" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals own rows" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks own rows" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "daily reviews own rows" on public.daily_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weekly reviews own rows" on public.weekly_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "experiments own rows" on public.experiments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reminder log own rows" on public.reminder_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "push subscriptions own rows" on public.push_subscriptions
  for select using (auth.uid() = user_id);
