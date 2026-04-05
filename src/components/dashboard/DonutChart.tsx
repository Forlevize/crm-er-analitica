import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

interface DonutChartProps {
  data: Array<{ nome: string; valor: number }>;
}

const colorMap = ["#438D42", "#FF6900", "#FF0000", "#772583"];

export function DonutChart({ data }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.valor, 0);
  const hasData = total > 0;

  return (
    <Card>
      <CardTitle>Distribuicao de Status</CardTitle>
      <CardDescription className="mt-0.5">Visao consolidada dos equipamentos ativos.</CardDescription>

      {hasData ? (
        <div className="mt-4 h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} innerRadius={60} outerRadius={92} paddingAngle={3} dataKey="valor">
                {data.map((entry, index) => (
                  <Cell key={entry.nome} fill={colorMap[index % colorMap.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "10px",
                  border: "1px solid rgba(0,45,98,0.12)",
                  boxShadow: "0 8px 24px rgba(0,45,98,0.12)",
                  fontSize: "13px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      <div className="mt-4 border-t border-borderSoft pt-4">
        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm text-textSecondary">Total monitorado</span>
          <span className="text-sm font-semibold text-textPrimary">{total}</span>
        </div>
        {data.map((item, index) => (
          <div key={item.nome} className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: colorMap[index % colorMap.length] }}
              />
              <span className="text-sm text-textSecondary">{item.nome}</span>
            </div>
            <span className="text-sm font-semibold text-textPrimary">{item.valor}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
