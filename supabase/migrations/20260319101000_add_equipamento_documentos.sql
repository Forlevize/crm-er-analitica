create table if not exists public.equipamento_documentos (
  id uuid primary key default gen_random_uuid(),
  equipamento_id uuid not null references public.equipamentos (id) on delete cascade,
  nome_arquivo text not null,
  caminho_storage text not null unique,
  tipo_mime text not null default 'application/pdf',
  tamanho_bytes integer not null default 0,
  uploaded_by uuid references public.users (id),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_equipamento_documentos_equipamento_id
on public.equipamento_documentos (equipamento_id);

alter table public.equipamento_documentos enable row level security;

create policy "equipamento_documentos_select_scoped"
on public.equipamento_documentos
for select
using (
  exists (
    select 1
    from public.equipamentos e
    where e.id = equipamento_documentos.equipamento_id
      and public.user_can_access_owner(e.owner_id)
  )
);

create policy "equipamento_documentos_admin_insert"
on public.equipamento_documentos
for insert
with check (public.current_role() = 'admin');

create policy "equipamento_documentos_admin_update"
on public.equipamento_documentos
for update
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

create policy "equipamento_documentos_admin_delete"
on public.equipamento_documentos
for delete
using (public.current_role() = 'admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('equipamento-pdfs', 'equipamento-pdfs', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

create policy "equipamento_pdfs_select_scoped"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'equipamento-pdfs'
  and exists (
    select 1
    from public.equipamento_documentos d
    join public.equipamentos e on e.id = d.equipamento_id
    where d.caminho_storage = storage.objects.name
      and public.user_can_access_owner(e.owner_id)
  )
);

create policy "equipamento_pdfs_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'equipamento-pdfs'
  and public.current_role() = 'admin'
);

create policy "equipamento_pdfs_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'equipamento-pdfs'
  and public.current_role() = 'admin'
)
with check (
  bucket_id = 'equipamento-pdfs'
  and public.current_role() = 'admin'
);

create policy "equipamento_pdfs_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'equipamento-pdfs'
  and public.current_role() = 'admin'
);
