import { Mail, Pencil, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import type { AppUser } from "@/types";

interface TabelaUsuariosProps {
  users: AppUser[];
  lideres: AppUser[];
  onEdit: (user: AppUser) => void;
  onToggleActive: (user: AppUser) => void;
}

export function TabelaUsuarios({ users, lideres, onEdit, onToggleActive }: TabelaUsuariosProps) {
  return (
    <Card className="bg-[linear-gradient(180deg,rgba(0,45,98,0.04),rgba(255,255,255,0.96))]">
      <CardTitle className="mb-4">Gestao de Usuarios</CardTitle>
      <div className="overflow-x-auto">
        <Table>
          <THead>
            <tr>
              <TH>Nome</TH>
              <TH>E-mail</TH>
              <TH>Telefone</TH>
              <TH>Distrito</TH>
              <TH>Lider</TH>
              <TH>Role</TH>
              <TH>Status</TH>
              <TH>Acoes</TH>
            </tr>
          </THead>
          <TBody>
            {users.length === 0 ? (
              <tr>
                <TD colSpan={8} className="py-8 text-center text-textSecondary">
                  Nenhum usuario cadastrado.
                </TD>
              </tr>
            ) : null}
            {users.map((user) => {
              const lider = lideres.find((item) => item.id === user.lider_id);
              return (
                <tr key={user.id} className="transition-colors hover:bg-appBg/60">
                  <TD>{user.full_name}</TD>
                  <TD>
                    <span className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4 text-textSecondary" />
                      {user.email}
                    </span>
                  </TD>
                  <TD>{user.phone ?? "-"}</TD>
                  <TD>{user.district ?? "-"}</TD>
                  <TD>{lider?.full_name ?? "-"}</TD>
                  <TD>
                    <span className="rounded-full border border-marine/15 bg-white px-3 py-1 text-xs font-semibold uppercase text-marine">
                      {user.role}
                    </span>
                  </TD>
                  <TD>
                    <span
                      className={
                        user.active
                          ? "rounded-full border border-status-calibrado/35 bg-status-calibrado px-3 py-1 text-xs font-semibold uppercase text-white"
                          : "rounded-full border border-marine/20 bg-marine/80 px-3 py-1 text-xs font-semibold uppercase text-white"
                      }
                    >
                      {user.active ? "Ativo" : "Inativo"}
                    </span>
                  </TD>
                  <TD>
                    <div className="flex gap-2">
                      <Button variant="ghost" className="gap-2 px-3 py-2 text-xs" onClick={() => onEdit(user)}>
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="ghost" className="gap-2 px-3 py-2 text-xs" onClick={() => onToggleActive(user)}>
                        <Power className="h-4 w-4" />
                        {user.active ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </TD>
                </tr>
              );
            })}
          </TBody>
        </Table>
      </div>
    </Card>
  );
}
