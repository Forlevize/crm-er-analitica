import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FiltrosRelatorio } from "@/components/relatorios/FiltrosRelatorio";
import { TabelaRelatorio } from "@/components/relatorios/TabelaRelatorio";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRelatorios } from "@/hooks/useRelatorios";
import { formatDate } from "@/lib/utils";
import { exportToExcel, exportToPdf } from "@/services/exportService";
import type { RelatorioFiltro } from "@/types";

const initialFilters: RelatorioFiltro = {
  district: "todos",
  ownerId: "todos",
  status: "todos",
  tipoEmail: "todos",
};

export function Relatorios() {
  const { role, profile } = useAuth();
  const [filters, setFilters] = useState<RelatorioFiltro>(initialFilters);

  useEffect(() => {
    if (role === "lider" && profile?.district && filters.district === "todos") {
      setFilters((current) => ({ ...current, district: profile.district ?? "todos" }));
    }
  }, [filters.district, profile?.district, role]);

  const { equipamentos, porOwner, vencimentos, emailHistorico, owners, districts, isLoading } = useRelatorios(filters);

  const equipamentosRows = equipamentos.map((item) => [
    item.equipamento,
    item.serial_number,
    item.owner_name,
    formatDate(item.ultima_calibracao),
    formatDate(item.proxima_calibracao),
    item.status_calibracao,
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-borderSoft pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.03em] text-textPrimary">Relatorios</h1>
          <p className="mt-0.5 text-sm text-textSecondary">Consulta, filtro e exportacao para Excel ou PDF.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await exportToExcel(
                  "relatorio-calibracoes.xlsx",
                  equipamentos.map((item) => ({
                    equipamento: item.equipamento,
                    serial: item.serial_number,
                    owner: item.owner_name,
                    status: item.status_calibracao,
                  })),
                );
                toast.success("Exportacao Excel iniciada.");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Falha ao exportar Excel.");
              }
            }}
          >
            Exportar Excel
          </Button>
          <Button
            onClick={async () => {
              try {
                await exportToPdf(
                  "Relatorio de calibracoes",
                  "relatorio-calibracoes.pdf",
                  ["Equipamento", "Serial", "Owner", "Ultima", "Proxima", "Status"],
                  equipamentosRows,
                );
                toast.success("Exportacao PDF iniciada.");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Falha ao exportar PDF.");
              }
            }}
          >
            Exportar PDF
          </Button>
        </div>
      </div>

      {isLoading ? <p className="text-sm text-textSecondary">Carregando relatorios...</p> : null}

      <FiltrosRelatorio
        filters={filters}
        owners={owners}
        districts={districts}
        districtDisabled={role === "lider"}
        onChange={setFilters}
      />
      <TabelaRelatorio
        title="Calibracoes por periodo"
        headers={["Equipamento", "Serial", "Owner", "Ultima", "Proxima", "Status"]}
        rows={equipamentosRows}
      />
      <TabelaRelatorio
        title="Equipamentos por owner"
        headers={["Owner", "Distrito", "Total", "Calibrado", "Critico", "Vencido", "Agendado"]}
        rows={porOwner.map((item) => [
          item.owner,
          item.district ?? "-",
          item.total,
          item.calibrado,
          item.critico,
          item.vencido,
          item.agendado,
        ])}
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <TabelaRelatorio
          title="Vencimentos 30/60/90 dias"
          headers={["Serial", "Owner", "Dias para vencer", "Status"]}
          rows={vencimentos.map((item) => [
            item.serial_number,
            item.owner_name,
            item.dias_para_vencer ?? "-",
            item.status_calibracao,
          ])}
        />
        <TabelaRelatorio
          title="Historico de e-mails"
          headers={["Tipo", "Destinatarios", "Status", "Data"]}
          rows={emailHistorico.map((item) => [
            item.tipo,
            item.enviado_para.join(", "),
            item.status,
            formatDate(item.enviado_em),
          ])}
        />
      </div>
    </div>
  );
}
