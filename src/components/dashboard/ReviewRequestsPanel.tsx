import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { AppUser, EquipamentoVisao, ReviewRequest, ReviewRequestStatus } from "@/types";

interface ReviewRequestsPanelProps {
  requests: ReviewRequest[];
  equipamentos: EquipamentoVisao[];
  users: AppUser[];
  onUpdate: (request: ReviewRequest, status: ReviewRequestStatus, observacao: string) => Promise<void>;
}

type Drafts = Record<string, { status: ReviewRequestStatus; observacao: string; isSaving?: boolean }>;

function getDraftValue(request: ReviewRequest, drafts: Drafts) {
  const draft = drafts[request.id];
  return {
    status: draft?.status ?? request.status,
    observacao: draft?.observacao ?? request.observacao ?? "",
    isSaving: draft?.isSaving ?? false,
  };
}

export function ReviewRequestsPanel({ requests, equipamentos, users, onUpdate }: ReviewRequestsPanelProps) {
  const [drafts, setDrafts] = useState<Drafts>({});

  const equipamentosById = new Map(equipamentos.map((item) => [item.id, item]));
  const usersById = new Map(users.map((item) => [item.id, item]));

  async function save(request: ReviewRequest) {
    const draft = getDraftValue(request, drafts);

    setDrafts((current) => ({
      ...current,
      [request.id]: {
        ...draft,
        isSaving: true,
      },
    }));

    try {
      await onUpdate(request, draft.status, draft.observacao);
    } finally {
      setDrafts((current) => ({
        ...current,
        [request.id]: {
          ...getDraftValue(request, current),
          isSaving: false,
        },
      }));
    }
  }

  return (
    <Card className="bg-[linear-gradient(155deg,rgba(255,0,0,0.06),rgba(255,255,255,0.94))]">
      <CardTitle className="mb-1">Solicitacoes de revisao</CardTitle>
      <CardDescription className="mb-4">
        Fluxo do gestor para analise do admin com controle de status e observacao.
      </CardDescription>
      <div className="overflow-x-auto">
        <Table>
          <THead>
            <tr>
              <TH>Data</TH>
              <TH>Equipamento</TH>
              <TH>Serial</TH>
              <TH>Solicitante</TH>
              <TH>Status</TH>
              <TH>Observacao</TH>
              <TH>Acao</TH>
            </tr>
          </THead>
          <TBody>
            {requests.length === 0 ? (
              <tr>
                <TD colSpan={7}>Nenhuma solicitacao de revisao cadastrada.</TD>
              </tr>
            ) : null}
            {requests.map((request) => {
              const equipamento = equipamentosById.get(request.equipamento_id);
              const requestedBy = usersById.get(request.requested_by);
              const draft = getDraftValue(request, drafts);

              return (
                <tr key={request.id} className="transition-colors hover:bg-appBg/60">
                  <TD>{formatDate(request.created_at)}</TD>
                  <TD>{equipamento?.equipamento ?? "-"}</TD>
                  <TD>{equipamento?.serial_number ?? "-"}</TD>
                  <TD>{requestedBy?.full_name ?? request.requested_by}</TD>
                  <TD>
                    <Select
                      value={draft.status}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [request.id]: {
                            ...getDraftValue(request, current),
                            status: event.target.value as ReviewRequestStatus,
                          },
                        }))
                      }
                    >
                      <option value="aberto">Aberto</option>
                      <option value="em_analise">Em analise</option>
                      <option value="concluido">Concluido</option>
                    </Select>
                  </TD>
                  <TD>
                    <Input
                      value={draft.observacao}
                      placeholder="Observacao da analise"
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [request.id]: {
                            ...getDraftValue(request, current),
                            observacao: event.target.value,
                          },
                        }))
                      }
                    />
                  </TD>
                  <TD>
                    <Button onClick={() => void save(request)} disabled={draft.isSaving}>
                      {draft.isSaving ? "Salvando..." : "Salvar"}
                    </Button>
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
