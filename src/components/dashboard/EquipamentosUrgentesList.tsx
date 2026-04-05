import { AlertTriangle } from "lucide-react";
import { BadgeStatus } from "@/components/equipamentos/BadgeStatus";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { EquipamentoVisao } from "@/types";

interface EquipamentosUrgentesListProps {
  items: EquipamentoVisao[];
}

function getDiasLabel(value: number | null) {
  if (value === null) {
    return "Sem data";
  }

  if (value < 0) {
    const diasVencido = Math.abs(value);
    return `${diasVencido} dia(s) vencido`;
  }

  if (value === 0) {
    return "Vence hoje";
  }

  return `${value} dia(s) restantes`;
}

export function EquipamentosUrgentesList({ items }: EquipamentosUrgentesListProps) {
  return (
    <Card className="border-veoliaRed/10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-veoliaRed">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">Acompanhamento imediato</span>
          </div>
          <CardTitle>Equipamentos vencidos ou a ate 45 dias</CardTitle>
          <CardDescription className="mt-0.5">Lista para acao operacional rapida do time.</CardDescription>
        </div>
        <span className="rounded-lg border border-borderSoft bg-appBg px-3 py-1.5 text-sm font-medium text-textPrimary">
          {items.length} equipamento(s)
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-marine/12 bg-appBg px-4 py-8 text-center text-sm text-textSecondary">
          Nenhum equipamento vencido ou dentro da janela de 45 dias.
        </div>
      ) : (
        <div className="max-h-[460px] overflow-auto rounded-xl">
          <Table>
            <THead className="sticky top-0 z-10">
              <tr>
                <TH>Status</TH>
                <TH>Serial</TH>
                <TH>Equipamento</TH>
                <TH>Owner</TH>
                <TH>Distrito</TH>
                <TH>Prox. calibracao</TH>
                <TH>Dias</TH>
              </tr>
            </THead>
            <TBody>
              {items.map((item) => (
                <tr key={item.id} className="bg-white/90 transition-colors hover:bg-appBg/70">
                  <TD>
                    <BadgeStatus status={item.status_calibracao} className="text-[11px]" />
                  </TD>
                  <TD className="font-medium">{item.serial_number}</TD>
                  <TD>{item.equipamento}</TD>
                  <TD>{item.owner_name}</TD>
                  <TD>{item.owner_district ?? item.district ?? "-"}</TD>
                  <TD>{item.proxima_calibracao ? formatDate(item.proxima_calibracao) : "-"}</TD>
                  <TD className={item.dias_para_vencer !== null && item.dias_para_vencer < 0 ? "font-semibold text-veoliaRed" : ""}>
                    {getDiasLabel(item.dias_para_vencer)}
                  </TD>
                </tr>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
