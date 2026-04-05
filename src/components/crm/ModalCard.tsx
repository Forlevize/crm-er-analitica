import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import type { AppUser, CrmCard, CrmInteraction, EmailLog, EquipamentoVisao } from "@/types";

interface ModalCardProps {
  open: boolean;
  card?: CrmCard | null;
  owner?: AppUser;
  lider?: AppUser;
  equipamentos: EquipamentoVisao[];
  interactions: CrmInteraction[];
  emailLogs: EmailLog[];
  onSaveNote: (cardId: string, ownerId: string, note: string) => Promise<void>;
  onClose: () => void;
}

export function ModalCard({
  open,
  card,
  owner,
  lider,
  equipamentos,
  interactions,
  emailLogs,
  onSaveNote,
  onClose,
}: ModalCardProps) {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) {
      setNote("");
    }
  }, [open, card?.id]);

  async function handleSaveNote() {
    if (!card) {
      return;
    }

    await onSaveNote(card.id, card.owner_id, note);
    setNote("");
  }

  return (
    <Dialog open={open} onClose={onClose} title="Historico do card" widthClassName="max-w-4xl">
      {!card ? null : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <Card className="space-y-3 bg-[linear-gradient(170deg,rgba(0,45,98,0.05),rgba(255,255,255,0.95))]">
            <div>
              <CardDescription>Owner</CardDescription>
              <CardTitle className="mt-1">{owner?.full_name ?? "-"}</CardTitle>
            </div>
            <div>
              <CardDescription>Lider</CardDescription>
              <p className="mt-1 text-sm text-textPrimary">{lider?.full_name ?? "-"}</p>
            </div>
            <div>
              <CardDescription>Coluna atual</CardDescription>
              <p className="mt-1 inline-flex rounded-full border border-marine/15 bg-white px-3 py-1 text-xs font-semibold uppercase text-marine">
                {card.coluna}
              </p>
            </div>
            <div>
              <CardDescription>Equipamentos vinculados</CardDescription>
              <ul className="mt-2 space-y-2 text-sm text-textPrimary">
                {equipamentos.length === 0 ? <li>Nenhum equipamento ativo vinculado.</li> : null}
                {equipamentos.map((item) => (
                  <li key={item.id}>
                    {item.serial_number} - {item.equipamento}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
          <div className="space-y-4">
            <Card className="bg-[linear-gradient(165deg,rgba(5,195,221,0.08),rgba(255,255,255,0.96))]">
              <CardTitle className="mb-3">Nova anotacao</CardTitle>
              <div className="space-y-3">
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Registrar contato, contexto ou proximo passo."
                />
                <div className="flex justify-end">
                  <Button onClick={() => void handleSaveNote()} disabled={!note.trim()}>
                    Salvar anotacao
                  </Button>
                </div>
              </div>
            </Card>
            <Card className="bg-[linear-gradient(165deg,rgba(0,45,98,0.05),rgba(255,255,255,0.96))]">
              <CardTitle className="mb-3">Interacoes</CardTitle>
              <div className="space-y-3">
                {interactions.length === 0 ? (
                  <div className="rounded-2xl bg-appBg p-3 text-sm text-textSecondary">
                    Nenhuma interacao registrada.
                  </div>
                ) : null}
                {interactions.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-marine/10 bg-white/80 p-3">
                    <p className="text-sm font-semibold text-textPrimary">{entry.tipo}</p>
                    <p className="mt-1 text-sm text-textSecondary">{entry.descricao}</p>
                    <p className="mt-1 text-xs text-textSecondary">{formatDate(entry.created_at)}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="bg-[linear-gradient(165deg,rgba(0,45,98,0.05),rgba(255,255,255,0.96))]">
              <CardTitle className="mb-3">E-mails enviados</CardTitle>
              <div className="space-y-3">
                {emailLogs.length === 0 ? (
                  <div className="rounded-2xl bg-appBg p-3 text-sm text-textSecondary">
                    Nenhum e-mail registrado.
                  </div>
                ) : null}
                {emailLogs.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-marine/10 bg-white/80 p-3">
                    <p className="text-sm font-semibold text-textPrimary">{entry.tipo}</p>
                    <p className="mt-1 text-sm text-textSecondary">{entry.enviado_para.join(", ")}</p>
                    <p className="mt-1 text-xs text-textSecondary">{entry.status}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </Dialog>
  );
}
