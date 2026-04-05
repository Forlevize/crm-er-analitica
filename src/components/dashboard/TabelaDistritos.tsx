import { Card, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";

interface TabelaDistritosProps {
  rows: Array<{
    district: string;
    calibrado: number;
    critico: number;
    vencido: number;
    agendado: number;
    total: number;
  }>;
}

export function TabelaDistritos({ rows }: TabelaDistritosProps) {
  return (
    <Card>
      <CardTitle className="mb-4">Resumo por Distrito</CardTitle>
      <div className="overflow-x-auto">
        <Table>
          <THead>
            <tr>
              <TH>Distrito</TH>
              <TH>Calibrados</TH>
              <TH>Criticos</TH>
              <TH>Vencidos</TH>
              <TH>Agendados</TH>
              <TH>Total</TH>
            </tr>
          </THead>
          <TBody>
            {rows.length === 0 ? (
              <tr>
                <TD colSpan={6} className="py-8 text-center text-textSecondary">
                  Nenhum dado encontrado para o filtro selecionado.
                </TD>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={row.district} className="transition-colors hover:bg-appBg/60">
                <TD>{row.district}</TD>
                <TD>{row.calibrado}</TD>
                <TD>{row.critico}</TD>
                <TD>{row.vencido}</TD>
                <TD>{row.agendado}</TD>
                <TD>{row.total}</TD>
              </tr>
            ))}
          </TBody>
        </Table>
      </div>
    </Card>
  );
}
