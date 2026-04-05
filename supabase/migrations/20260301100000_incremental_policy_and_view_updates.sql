alter view if exists public.equipamentos_visao set (security_invoker = true);

drop policy if exists "crm_cards_admin_or_lider_select" on public.crm_cards;
drop policy if exists "crm_cards_admin_gestor_or_lider_select" on public.crm_cards;

create policy "crm_cards_admin_gestor_or_lider_select"
on public.crm_cards
for select
using (
  public.current_role() = 'admin'
  or public.current_role() = 'gestor'
  or (public.current_role() = 'lider' and public.user_can_access_owner(owner_id))
);

drop policy if exists "email_logs_admin_or_lider_select" on public.email_logs;
drop policy if exists "email_logs_admin_gestor_or_lider_select" on public.email_logs;

create policy "email_logs_admin_gestor_or_lider_select"
on public.email_logs
for select
using (
  public.current_role() = 'admin'
  or public.current_role() = 'gestor'
  or (public.current_role() = 'lider' and public.user_can_access_owner(owner_id))
);
