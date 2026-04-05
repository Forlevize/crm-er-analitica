alter table public.equipamentos
  add column if not exists district text,
  add column if not exists region_state text,
  add column if not exists city text,
  add column if not exists customer text,
  add column if not exists vendor text,
  add column if not exists observacao text;

drop view if exists public.equipamentos_visao;

create view public.equipamentos_visao
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
  e.district,
  e.region_state,
  e.city,
  e.customer,
  e.vendor,
  e.observacao,
  owner.full_name as owner_name,
  owner.email as owner_email,
  owner.phone as owner_phone,
  owner.district as owner_district,
  lider.full_name as lider_name,
  lider.email as lider_email,
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
  end as status_calibracao,
  case crm.coluna
    when 'sem_contato' then 'Sem contato'
    when 'aguardando_retorno' then 'Aguardando retorno'
    when 'em_contato' then 'Em contato'
    when 'agendado' then 'Agendado'
    when 'calibrado' then 'Realizado'
    when 'perdido' then 'Perdido'
    else 'Sem contato'
  end as status_contato,
  coalesce(cal.executado, 0) as executado
from public.equipamentos e
join public.users owner on owner.id = e.owner_id
left join public.users lider on lider.id = owner.lider_id
left join public.crm_cards crm on crm.owner_id = e.owner_id
left join lateral (
  select count(*)::int as executado
  from public.calibracoes c
  where c.equipamento_id = e.id
    and c.realizado = true
) cal on true;

grant select on public.equipamentos_visao to authenticated;
