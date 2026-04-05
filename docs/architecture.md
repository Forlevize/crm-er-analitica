# Arquitetura

## Visao geral
- Frontend SPA React/Vite na raiz do repositorio.
- Backend versionado em `supabase/`, com migrations SQL, RLS e Edge Functions.
- Integracoes externas: Supabase Auth, Resend para e-mails e Vercel para deploy.

## Fluxos principais
- Auth carrega o perfil da tabela `public.users` e deriva permissoes no cliente.
- Equipamentos usam `equipamentos_visao` para status calculado em tempo real.
- CRM agrupa owners por card unico, com historico em `crm_interactions`.
- Rotinas automaticas usam `pg_cron` -> `pg_net` -> Edge Functions.

## Decisoes
- `gestor` de escalonamento e definido por `district`.
- `status_calibracao` nao e persistido na tabela base.
- Convite de usuario usa link de redefinicao, sem senha em texto puro.

