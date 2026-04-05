import { useRef } from "react";
import { ExternalLink, FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { Calibracao, EquipamentoDocumento, EquipamentoVisao } from "@/types";

interface ModalHistoricoCalibracoesProps {
  open: boolean;
  equipamento?: EquipamentoVisao | null;
  historico: Calibracao[];
  documentos: EquipamentoDocumento[];
  canManageDocuments: boolean;
  onUploadDocument: (file: File) => Promise<void>;
  onDeleteDocument: (documento: EquipamentoDocumento) => Promise<void>;
  onOpenDocument: (documento: EquipamentoDocumento) => Promise<void>;
  onClose: () => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ModalHistoricoCalibracoes({
  open,
  equipamento,
  historico,
  documentos,
  canManageDocuments,
  onUploadDocument,
  onDeleteDocument,
  onOpenDocument,
  onClose,
}: ModalHistoricoCalibracoesProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Historico do equipamento${equipamento ? ` - ${equipamento.serial_number}` : ""}`}
      description="Registro de calibracoes, agendamentos e PDFs de comprovacao vinculados ao equipamento."
      widthClassName="max-w-5xl"
    >
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-[linear-gradient(170deg,rgba(0,45,98,0.05),rgba(255,255,255,0.96))]">
          <CardTitle className="mb-4">Calibracoes e agendamentos</CardTitle>
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <tr>
                  <TH>Data de calibracao</TH>
                  <TH>Status</TH>
                  <TH>Criado em</TH>
                </tr>
              </THead>
              <TBody>
                {historico.length === 0 ? (
                  <tr>
                    <TD colSpan={3} className="py-8 text-center text-textSecondary">
                      Nenhum registro de calibracao para este equipamento.
                    </TD>
                  </tr>
                ) : null}
                {historico.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-appBg/50">
                    <TD>{formatDate(item.data_calibracao)}</TD>
                    <TD>{item.realizado ? "Realizado" : "Agendado"}</TD>
                    <TD>{formatDate(item.created_at)}</TD>
                  </tr>
                ))}
              </TBody>
            </Table>
          </div>
        </Card>

        <Card className="bg-[linear-gradient(170deg,rgba(5,195,221,0.06),rgba(255,255,255,0.98))]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <CardTitle>PDFs de revisao</CardTitle>
            {canManageDocuments ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    event.currentTarget.value = "";
                    if (!file) {
                      return;
                    }
                    await onUploadDocument(file);
                  }}
                />
                <Button type="button" className="h-9 gap-2 px-3 text-xs" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  Anexar PDF
                </Button>
              </>
            ) : null}
          </div>

          <div className="space-y-3">
            {documentos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-marine/14 bg-white/70 px-4 py-8 text-center text-sm text-textSecondary">
                Nenhum PDF anexado para este equipamento.
              </div>
            ) : null}

            {documentos.map((documento) => (
              <div key={documento.id} className="rounded-2xl border border-marine/10 bg-white/85 px-4 py-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-marine/8 text-marine">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-textPrimary">{documento.nome_arquivo}</p>
                        <p className="text-xs text-textSecondary">{`${formatBytes(documento.tamanho_bytes)} | ${formatDate(documento.created_at)}`}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 gap-1.5 px-3 text-[11px]"
                      onClick={() => void onOpenDocument(documento)}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir
                    </Button>
                    {canManageDocuments ? (
                      <Button
                        type="button"
                        variant="danger"
                        className="h-8 gap-1.5 px-3 text-[11px]"
                        onClick={() => void onDeleteDocument(documento)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Dialog>
  );
}
