create extension if not exists pgcrypto;
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text unique not null,
  phone text,
  district text,
  role text not null check (role in ('admin', 'gestor', 'lider', 'usuario')),
  lider_id uuid references public.users (id),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.equipamentos (
  id uuid primary key default gen_random_uuid(),
  serial_number text unique not null,
  equipamento text not null,
  brand text,
  model text,
  owner_id uuid not null references public.users (id),
  ultima_calibracao date,
  proxima_calibracao date,
  certificado text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.calibracoes (
  id uuid primary key default gen_random_uuid(),
  equipamento_id uuid not null references public.equipamentos (id) on delete cascade,
  data_calibracao date not null,
  realizado boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.crm_cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.users (id) on delete cascade,
  coluna text not null check (coluna in ('sem_contato', 'aguardando_retorno', 'em_contato', 'agendado', 'calibrado', 'perdido')),
  notas text,
  last_contact_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.crm_interactions (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.crm_cards (id) on delete cascade,
  owner_id uuid not null references public.users (id) on delete cascade,
  tipo text not null check (tipo in ('nota', 'email', 'movimentacao', 'contato_manual')),
  descricao text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.users (id)
);

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id),
  equipamento_id uuid references public.equipamentos (id),
  tipo text not null check (tipo in ('aviso_60', 'aviso_45', 'escalonamento_gestor', 'semanal_lider')),
  enviado_para text[] not null default '{}'::text[],
  enviado_em timestamptz not null default timezone('utc', now()),
  status text not null default 'enviado' check (status in ('enviado', 'falha', 'ignorado_sem_destinatario'))
);

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id),
  acao text not null,
  tabela text,
  registro_id uuid,
  valor_anterior jsonb,
  valor_novo jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.review_requests (
  id uuid primary key default gen_random_uuid(),
  equipamento_id uuid not null references public.equipamentos (id) on delete cascade,
  requested_by uuid not null references public.users (id),
  status text not null default 'aberto' check (status in ('aberto', 'em_analise', 'concluido')),
  observacao text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_users_role on public.users (role);
create index if not exists idx_users_lider_id on public.users (lider_id);
create index if not exists idx_equipamentos_owner_id on public.equipamentos (owner_id);
create index if not exists idx_equipamentos_active on public.equipamentos (active);
create index if not exists idx_calibracoes_equipamento_id on public.calibracoes (equipamento_id);
create index if not exists idx_crm_cards_owner_id on public.crm_cards (owner_id);
create index if not exists idx_email_logs_owner_id on public.email_logs (owner_id);
create index if not exists idx_logs_user_id on public.logs (user_id);
create index if not exists idx_review_requests_status on public.review_requests (status);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.user_can_access_owner(owner_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then false
    when public.current_role() in ('admin', 'gestor') then true
    when owner_uuid = auth.uid() then true
    when exists (
      select 1
      from public.users owner
      where owner.id = owner_uuid and owner.lider_id = auth.uid()
    ) then true
    else false
  end;
$$;

create or replace function public.registrar_log(
  p_user_id uuid,
  p_acao text,
  p_tabela text default null,
  p_registro_id uuid default null,
  p_valor_anterior jsonb default null,
  p_valor_novo jsonb default null
)
returns public.logs
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted public.logs;
begin
  insert into public.logs (user_id, acao, tabela, registro_id, valor_anterior, valor_novo)
  values (p_user_id, p_acao, p_tabela, p_registro_id, p_valor_anterior, p_valor_novo)
  returning * into inserted;

  return inserted;
end;
$$;

create or replace function public.upsert_edge_job(
  p_job_name text,
  p_schedule text,
  p_endpoint_path text,
  p_project_url text,
  p_anon_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_job_id bigint;
begin
  select jobid
    into existing_job_id
  from cron.job
  where jobname = p_job_name;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    p_job_name,
    p_schedule,
    format(
      $cmd$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || %L
        ),
        body := '{}'::jsonb
      );
      $cmd$,
      p_project_url || '/functions/v1/' || p_endpoint_path,
      p_anon_key
    )
  );
end;
$$;

create or replace function public.schedule_automation_jobs(p_project_url text, p_anon_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.upsert_edge_job(
    'er_run_calibration_notifications',
    '0 8 * * *',
    'run-calibration-notifications',
    p_project_url,
    p_anon_key
  );

  perform public.upsert_edge_job(
    'er_send_leader_weekly_summary',
    '0 8 * * 1',
    'send-leader-weekly-summary',
    p_project_url,
    p_anon_key
  );
end;
$$;

create or replace view public.equipamentos_visao
with (security_invoker = true) as
select
  e.id,
  e.serial_number,
  e.equipamento,
  e.brand,
  e.model,
  e.owner_id,
  e.ultima_calibracao,
  e.proxima_calibracao,
  e.certificado,
  e.active,
  e.created_at,
  e.updated_at,
  owner.full_name as owner_name,
  owner.email as owner_email,
  owner.district as owner_district,
  lider.full_name as lider_name,
  case
    when e.proxima_calibracao is null then null
    else (e.proxima_calibracao - current_date)
  end as dias_para_vencer,
  case
    when exists (
      select 1
      from public.calibracoes c
      where c.equipamento_id = e.id
        and c.realizado = false
        and c.data_calibracao >= current_date
    ) then 'agendado'
    when e.proxima_calibracao is null then 'calibrado'
    when e.proxima_calibracao < current_date then 'vencido'
    when (e.proxima_calibracao - current_date) <= 45 then 'critico'
    when (e.proxima_calibracao - current_date) <= 60 then 'alerta_60'
    else 'calibrado'
  end as status_calibracao
from public.equipamentos e
join public.users owner on owner.id = e.owner_id
left join public.users lider on lider.id = owner.lider_id;

create trigger trg_equipamentos_updated_at
before update on public.equipamentos
for each row
execute function public.handle_updated_at();

create trigger trg_crm_cards_updated_at
before update on public.crm_cards
for each row
execute function public.handle_updated_at();

create trigger trg_review_requests_updated_at
before update on public.review_requests
for each row
execute function public.handle_updated_at();

alter table public.users enable row level security;
alter table public.equipamentos enable row level security;
alter table public.calibracoes enable row level security;
alter table public.crm_cards enable row level security;
alter table public.crm_interactions enable row level security;
alter table public.email_logs enable row level security;
alter table public.logs enable row level security;
alter table public.review_requests enable row level security;

create policy "users_select_scoped"
on public.users
for select
using (
  public.current_role() in ('admin', 'gestor')
  or id = auth.uid()
  or (public.current_role() = 'lider' and lider_id = auth.uid())
);

create policy "users_admin_insert"
on public.users
for insert
with check (public.current_role() = 'admin');

create policy "users_admin_update"
on public.users
for update
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

create policy "users_admin_delete"
on public.users
for delete
using (public.current_role() = 'admin');

create policy "equipamentos_select_scoped"
on public.equipamentos
for select
using (public.user_can_access_owner(owner_id));

create policy "equipamentos_admin_insert"
on public.equipamentos
for insert
with check (public.current_role() = 'admin');

create policy "equipamentos_admin_update"
on public.equipamentos
for update
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

create policy "equipamentos_admin_delete"
on public.equipamentos
for delete
using (public.current_role() = 'admin');

create policy "calibracoes_select_scoped"
on public.calibracoes
for select
using (
  exists (
    select 1
    from public.equipamentos e
    where e.id = calibracoes.equipamento_id
      and public.user_can_access_owner(e.owner_id)
  )
);

create policy "calibracoes_admin_mutation"
on public.calibracoes
for all
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

create policy "crm_cards_admin_gestor_or_lider_select"
on public.crm_cards
for select
using (
  public.current_role() = 'admin'
  or public.current_role() = 'gestor'
  or (public.current_role() = 'lider' and public.user_can_access_owner(owner_id))
);

create policy "crm_cards_admin_or_lider_update"
on public.crm_cards
for update
using (
  public.current_role() = 'admin'
  or (public.current_role() = 'lider' and public.user_can_access_owner(owner_id))
)
with check (
  public.current_role() = 'admin'
  or (public.current_role() = 'lider' and public.user_can_access_owner(owner_id))
);

create policy "crm_cards_admin_insert"
on public.crm_cards
for insert
with check (public.current_role() = 'admin');

create policy "crm_interactions_admin_or_lider_select"
on public.crm_interactions
for select
using (
  public.current_role() = 'admin'
  or (public.current_role() = 'lider' and public.user_can_access_owner(owner_id))
);

create policy "crm_interactions_admin_or_lider_insert"
on public.crm_interactions
for insert
with check (
  public.current_role() = 'admin'
  or (public.current_role() = 'lider' and public.user_can_access_owner(owner_id))
);

create policy "crm_interactions_admin_or_lider_update"
on public.crm_interactions
for update
using (
  public.current_role() = 'admin'
  or (public.current_role() = 'lider' and public.user_can_access_owner(owner_id))
)
with check (
  public.current_role() = 'admin'
  or (public.current_role() = 'lider' and public.user_can_access_owner(owner_id))
);

create policy "email_logs_admin_gestor_or_lider_select"
on public.email_logs
for select
using (
  public.current_role() = 'admin'
  or public.current_role() = 'gestor'
  or (public.current_role() = 'lider' and public.user_can_access_owner(owner_id))
);

create policy "email_logs_system_insert"
on public.email_logs
for insert
with check (public.current_role() = 'admin');

create policy "logs_admin_select"
on public.logs
for select
using (public.current_role() = 'admin');

create policy "review_requests_gestor_insert"
on public.review_requests
for insert
with check (public.current_role() = 'gestor' and requested_by = auth.uid());

create policy "review_requests_admin_select"
on public.review_requests
for select
using (public.current_role() = 'admin');

create policy "review_requests_admin_update"
on public.review_requests
for update
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

grant select on public.equipamentos_visao to authenticated;
grant execute on function public.current_role() to authenticated;
grant execute on function public.user_can_access_owner(uuid) to authenticated;
grant execute on function public.registrar_log(uuid, text, text, uuid, jsonb, jsonb) to authenticated;
