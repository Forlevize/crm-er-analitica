update public.crm_cards
set coluna = 'sem_contato',
    updated_at = now()
where coluna = 'perdido';
