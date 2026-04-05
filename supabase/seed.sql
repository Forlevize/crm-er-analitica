-- Pre-condicao: crie os usuarios em auth.users ou via Edge Function antes de rodar este seed.

insert into public.users (id, full_name, email, phone, district, role, lider_id, active)
select
  auth_user.id,
  auth_user.raw_user_meta_data ->> 'full_name',
  auth_user.email,
  null,
  'Campinas',
  case
    when auth_user.email = 'admin@eranalitica.com' then 'admin'
    when auth_user.email = 'gestor@veolia.com' then 'gestor'
    when auth_user.email = 'lider@veolia.com' then 'lider'
    else 'usuario'
  end,
  case
    when auth_user.email = 'owner@veolia.com' then (
      select id from auth.users where email = 'lider@veolia.com' limit 1
    )
    else null
  end,
  true
from auth.users auth_user
where auth_user.email in ('admin@eranalitica.com', 'gestor@veolia.com', 'lider@veolia.com', 'owner@veolia.com')
on conflict (id) do update
set
  full_name = excluded.full_name,
  email = excluded.email,
  role = excluded.role,
  lider_id = excluded.lider_id;

insert into public.equipamentos (serial_number, equipamento, brand, model, owner_id, ultima_calibracao, proxima_calibracao, certificado, active)
select
  'COND-001',
  'Condutivimetro',
  'Hach',
  'HQ40D',
  owner_user.id,
  current_date - interval '300 days',
  current_date + interval '20 days',
  'CERT-001',
  true
from public.users owner_user
where owner_user.email = 'owner@veolia.com'
on conflict (serial_number) do nothing;

insert into public.calibracoes (equipamento_id, data_calibracao, realizado)
select
  equipamento.id,
  current_date + interval '30 days',
  false
from public.equipamentos equipamento
where equipamento.serial_number = 'COND-001'
on conflict do nothing;
