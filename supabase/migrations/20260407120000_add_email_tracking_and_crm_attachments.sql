alter table public.email_logs
  add column if not exists provider_email_id text,
  add column if not exists last_event text,
  add column if not exists opened_at timestamptz,
  add column if not exists open_count integer not null default 0;

create unique index if not exists idx_email_logs_provider_email_id
on public.email_logs (provider_email_id)
where provider_email_id is not null;

create table if not exists public.crm_interaction_attachments (
  id uuid primary key default gen_random_uuid(),
  interaction_id uuid not null references public.crm_interactions (id) on delete cascade,
  card_id uuid not null references public.crm_cards (id) on delete cascade,
  owner_id uuid not null references public.users (id) on delete cascade,
  nome_arquivo text not null,
  caminho_storage text not null unique,
  tipo_mime text not null,
  tamanho_bytes bigint not null,
  uploaded_by uuid references public.users (id),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_crm_interaction_attachments_interaction_id
on public.crm_interaction_attachments (interaction_id);

create index if not exists idx_crm_interaction_attachments_card_id
on public.crm_interaction_attachments (card_id);

alter table public.crm_interaction_attachments enable row level security;

create policy "crm_interaction_attachments_select_scoped"
on public.crm_interaction_attachments
for select
using (
  public.current_role() = 'admin'
  or (public.current_role() = 'lider' and public.user_can_access_owner(owner_id))
);

create policy "crm_interaction_attachments_insert_scoped"
on public.crm_interaction_attachments
for insert
with check (
  public.current_role() = 'admin'
  or (public.current_role() = 'lider' and public.user_can_access_owner(owner_id))
);

create policy "crm_interaction_attachments_update_scoped"
on public.crm_interaction_attachments
for update
using (
  public.current_role() = 'admin'
  or (public.current_role() = 'lider' and public.user_can_access_owner(owner_id))
)
with check (
  public.current_role() = 'admin'
  or (public.current_role() = 'lider' and public.user_can_access_owner(owner_id))
);

create policy "crm_interaction_attachments_delete_scoped"
on public.crm_interaction_attachments
for delete
using (
  public.current_role() = 'admin'
  or (public.current_role() = 'lider' and public.user_can_access_owner(owner_id))
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('crm-imagens', 'crm-imagens', false, 10485760, array['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
on conflict (id) do nothing;

create policy "crm_imagens_select_scoped"
on storage.objects
for select
using (
  bucket_id = 'crm-imagens'
  and exists (
    select 1
    from public.crm_interaction_attachments a
    where a.caminho_storage = storage.objects.name
      and (
        public.current_role() = 'admin'
        or (public.current_role() = 'lider' and public.user_can_access_owner(a.owner_id))
      )
  )
);

create policy "crm_imagens_insert_scoped"
on storage.objects
for insert
with check (
  bucket_id = 'crm-imagens'
  and public.current_role() in ('admin', 'lider')
);

create policy "crm_imagens_update_scoped"
on storage.objects
for update
using (
  bucket_id = 'crm-imagens'
  and public.current_role() in ('admin', 'lider')
)
with check (
  bucket_id = 'crm-imagens'
  and public.current_role() in ('admin', 'lider')
);

create policy "crm_imagens_delete_scoped"
on storage.objects
for delete
using (
  bucket_id = 'crm-imagens'
  and exists (
    select 1
    from public.crm_interaction_attachments a
    where a.caminho_storage = storage.objects.name
      and (
        public.current_role() = 'admin'
        or (public.current_role() = 'lider' and public.user_can_access_owner(a.owner_id))
      )
  )
);
