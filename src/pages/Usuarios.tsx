import { useState } from "react";
import { toast } from "sonner";
import { ModalUsuario } from "@/components/usuarios/ModalUsuario";
import { TabelaUsuarios } from "@/components/usuarios/TabelaUsuarios";
import { Button } from "@/components/ui/button";
import { useUsuarios } from "@/hooks/useUsuarios";
import type { AppUser } from "@/types";

export function Usuarios() {
  const { users, lideres, isLoading, saveUsuario, toggleUserActive } = useUsuarios();
  const [selected, setSelected] = useState<AppUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-borderSoft pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.03em] text-textPrimary">Usuarios</h1>
          <p className="mt-0.5 text-sm text-textSecondary">Provisionamento e hierarquia lider/owner.</p>
        </div>
        <Button
          onClick={() => {
            setSelected(null);
            setModalOpen(true);
          }}
        >
          Cadastrar usuario
        </Button>
      </div>

      {isLoading ? <p className="text-sm text-textSecondary">Carregando usuarios...</p> : null}

      <TabelaUsuarios
        users={users}
        lideres={lideres}
        onEdit={(user) => {
          setSelected(user);
          setModalOpen(true);
        }}
        onToggleActive={async (user) => {
          try {
            await toggleUserActive(user);
            toast.success(`Usuario ${user.active ? "desativado" : "ativado"} com sucesso.`);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Falha ao atualizar status do usuario.");
          }
        }}
      />
      <ModalUsuario
        open={modalOpen}
        item={selected}
        lideres={lideres}
        onClose={() => setModalOpen(false)}
        onSave={async (values) => {
          try {
            const result = await saveUsuario(values, selected);

            if (selected) {
              toast.success("Usuario atualizado.");
              return;
            }

            if (result.onboardingMode === "manual_link" && result.manualActionLink) {
              await navigator.clipboard.writeText(result.manualActionLink).catch(() => undefined);
              toast.warning("Limite de convite atingido. Link de onboarding copiado para envio manual.");
              return;
            }

            if (result.onboardingMode === "manual_link") {
              toast.warning(result.onboardingWarning ?? "Usuario criado sem convite automatico. Gere um reset manual.");
              return;
            }

            toast.success("Convite enviado para o novo usuario.");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Falha ao salvar usuario.");
            throw error;
          }
        }}
      />
    </div>
  );
}
