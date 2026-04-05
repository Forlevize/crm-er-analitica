# Matriz de Permissoes

## Roles
- `admin`: acesso total de leitura e mutacao.
- `gestor`: leitura global, sem mutacoes operacionais; pode abrir solicitacoes de revisao.
- `lider`: leitura do proprio grupo e atualizacao do CRM do proprio grupo.
- `usuario`: leitura apenas dos proprios equipamentos e do proprio perfil.

## Paginas
- `/dashboard`: `admin`, `gestor`, `lider`
- `/equipamentos`: todos
- `/usuarios`: `admin`
- `/crm`: `admin`, `lider`
- `/relatorios`: `admin`, `gestor`, `lider`
- `/logs`: `admin`

