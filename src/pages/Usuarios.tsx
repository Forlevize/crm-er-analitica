import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ModalUsuario } from "@/components/usuarios/ModalUsuario";
import { TabelaUsuarios } from "@/components/usuarios/TabelaUsuarios";
import { Button } from "@/components/ui/button";
import { useUsuarios } from "@/hooks/useUsuarios";
import type { AppUser } from "@/types";

export function Usuarios() {
  const { users, lideres, isLoading, saveUsuario, toggleUserActive } = useUsuarios();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<AppUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter(
      (user) =>
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query),
    );
  }, [search, users]);

  useEffect(() => {
    const editUserId = searchParams.get("edit");
    if (!editUserId || users.length === 0) {
      return;
    }

    const user = users.find((entry) => entry.id === editUserId);
    if (!user) {
      return;
    }

    setSelected(user);
    setModalOpen(true);
    setSearch(user.full_name);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, users]);

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

      <div className="max-w-md">
        <input
          className="h-11 w-full rounded-2xl border border-marine/12 bg-white/80 px-4 text-sm text-textPrimary outline-none transition focus:border-marine/25"
          placeholder="Buscar por nome ou e-mail"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isLoading ? <p className="text-sm text-textSecondary">Carregando usuarios...</p> : null}

      <TabelaUsuarios
        users={filteredUsers}
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
