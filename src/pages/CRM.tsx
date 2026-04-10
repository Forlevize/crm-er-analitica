import { useMemo, useState } from "react";
import { toast } from "sonner";
import { KanbanBoard } from "@/components/crm/KanbanBoard";
import { ModalCard } from "@/components/crm/ModalCard";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useCRM } from "@/hooks/useCRM";
import type { CrmCard } from "@/types";

export function CRM() {
  const { role, profile } = useAuth();
  const { columns, interactions, attachments, emailLogs, equipamentos, users, isLoading, moveCard, addNote, openAttachment } = useCRM();
  const [selectedCard, setSelectedCard] = useState<CrmCard | null>(null);
  const [leaderFilter, setLeaderFilter] = useState("todos");

  const lideres = useMemo(() => users.filter((user) => user.role === "lider"), [users]);

  const filteredColumns = useMemo(() => {
    if (role !== "admin" || leaderFilter === "todos") {
      return columns;
    }

    return columns.map((column) => ({
      ...column,
      cards: column.cards.filter((card) => {
        const owner = users.find((user) => user.id === card.owner_id);
        return owner?.lider_id === leaderFilter;
      }),
    }));
  }, [columns, leaderFilter, role, users]);

  const selectedOwner = users.find((user) => user.id === selectedCard?.owner_id);
  const selectedLeader = users.find((user) => user.id === selectedOwner?.lider_id);
  const totalCards = filteredColumns.reduce((total, column) => total + column.cards.length, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-borderSoft pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.03em] text-textPrimary">Registro de contatos</h1>
          <p className="mt-0.5 text-sm text-textSecondary">Cards por owner com historico de interacoes e e-mails.</p>
        </div>
        <Select
          disabled={role !== "admin"}
          value={role === "lider" ? profile?.id ?? "todos" : leaderFilter}
          onChange={(event) => setLeaderFilter(event.target.value)}
          className="w-[220px]"
        >
          <option value="todos">Todos os lideres</option>
          {lideres.map((lider) => (
            <option key={lider.id} value={lider.id}>
              {lider.full_name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-borderSoft bg-appBg px-4 py-3">
        <p className="text-sm text-textSecondary">
          Arraste os cards entre as colunas. A movimentacao atualiza o CRM e registra a interacao automaticamente.
        </p>
        <span className="text-xs font-medium text-textSecondary">{totalCards} cards monitorados</span>
      </div>

      {isLoading ? <p className="text-sm text-textSecondary">Carregando CRM...</p> : null}

      <KanbanBoard
        columns={filteredColumns}
        users={users}
        equipamentos={equipamentos}
        onMove={async (cardId, coluna) => {
          try {
            await moveCard(cardId, coluna);
            toast.success(`Card movido para ${coluna}.`);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Falha ao mover card.");
          }
        }}
        onOpen={(card) => setSelectedCard(card)}
      />
      <ModalCard
        open={Boolean(selectedCard)}
        card={selectedCard}
        owner={selectedOwner}
        lider={selectedLeader}
        users={users}
        equipamentos={equipamentos.filter((item) => item.owner_id === selectedCard?.owner_id)}
        interactions={interactions.filter((item) => item.card_id === selectedCard?.id)}
        attachments={attachments.filter((item) => item.card_id === selectedCard?.id)}
        emailLogs={emailLogs.filter((item) => item.owner_id === selectedCard?.owner_id)}
        onSaveNote={async (cardId, ownerId, note, files) => {
          try {
            await addNote(cardId, ownerId, note, files);
            toast.success("Anotacao registrada no CRM.");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Falha ao salvar anotacao.");
          }
        }}
        onOpenAttachment={async (attachment) => {
          try {
            const url = await openAttachment(attachment);
            window.open(url, "_blank", "noopener,noreferrer");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Falha ao abrir anexo.");
          }
        }}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
}
