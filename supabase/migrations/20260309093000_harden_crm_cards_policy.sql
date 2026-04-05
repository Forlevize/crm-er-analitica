drop policy if exists "crm_cards_admin_gestor_or_lider_select" on public.crm_cards;

create policy "crm_cards_admin_or_lider_select"
on public.crm_cards
for select
using (
  public.current_role() = 'admin'
  or (public.current_role() = 'lider' and public.user_can_access_owner(owner_id))
);
