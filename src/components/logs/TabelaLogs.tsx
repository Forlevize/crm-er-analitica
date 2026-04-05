import { Card, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { AuditLog } from "@/types";

export function TabelaLogs({ logs }: { logs: AuditLog[] }) {
  function stringify(value: Record<string, unknown> | null) {
    if (!value) {
      return "-";
    }

    return JSON.stringify(value);
  }

  return (
    <Card className="bg-[linear-gradient(180deg,rgba(0,45,98,0.03),rgba(255,255,255,0.96))]">
      <CardTitle className="mb-4">Auditoria</CardTitle>
      <div className="overflow-x-auto">
        <Table>
          <THead>
            <tr>
              <TH>Data</TH>
              <TH>Usuario</TH>
              <TH>Acao</TH>
              <TH>Tabela</TH>
              <TH>Registro</TH>
              <TH>Valor anterior</TH>
              <TH>Valor novo</TH>
            </tr>
          </THead>
          <TBody>
            {logs.length === 0 ? (
              <tr>
                <TD colSpan={7} className="py-8 text-center text-textSecondary">
                  Nenhum log encontrado para o periodo/filtro informado.
                </TD>
              </tr>
            ) : null}
            {logs.map((log) => (
              <tr key={log.id} className="transition-colors hover:bg-appBg/60">
                <TD>{formatDate(log.created_at)}</TD>
                <TD>{log.user_name ?? log.user_id ?? "Sistema"}</TD>
                <TD>{log.acao}</TD>
                <TD>{log.tabela ?? "-"}</TD>
                <TD>{log.registro_id ?? "-"}</TD>
                <TD className="max-w-[280px] truncate">{stringify(log.valor_anterior)}</TD>
                <TD className="max-w-[280px] truncate">{stringify(log.valor_novo)}</TD>
              </tr>
            ))}
          </TBody>
        </Table>
      </div>
    </Card>
  );
}
