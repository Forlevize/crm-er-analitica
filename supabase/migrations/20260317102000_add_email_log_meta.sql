alter table public.email_logs
add column if not exists meta jsonb not null default '{}'::jsonb;
