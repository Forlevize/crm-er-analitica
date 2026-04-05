import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

interface CalibracaoChartProps {
  data: Array<{ mes: string; previsto: number; executado: number }>;
}

export function CalibracaoChart({ data }: CalibracaoChartProps) {
  const totalPrevisto = data.reduce((total, item) => total + item.previsto, 0);
  const totalExecutado = data.reduce((total, item) => total + item.executado, 0);

  return (
    <Card className="flex h-full flex-col">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <CardTitle>Calibracoes por Mes</CardTitle>
          <CardDescription className="mt-0.5">Comparativo mensal entre previsto e executado.</CardDescription>
        </div>
        <div className="flex items-center gap-4 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-turquoise" />
            <span className="text-xs text-textSecondary">Previsto</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-marine" />
            <span className="text-xs text-textSecondary">Executado</span>
          </div>
        </div>
      </div>

      <div className="h-72 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={10}>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,45,98,0.08)" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: "#55555A", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: "#55555A", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(0,45,98,0.04)" }}
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid rgba(0,45,98,0.12)",
                boxShadow: "0 8px 24px rgba(0,45,98,0.12)",
                fontSize: "13px",
              }}
            />
            <Bar dataKey="previsto" name="Previsto" fill="#05C3DD" radius={[6, 6, 0, 0]} barSize={18} />
            <Bar dataKey="executado" name="Executado" fill="#002D62" radius={[6, 6, 0, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center gap-6 border-t border-borderSoft pt-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-textSecondary">Previsto</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-textPrimary">{totalPrevisto}</p>
        </div>
        <div className="h-8 w-px bg-borderSoft" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-textSecondary">Executado</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-textPrimary">{totalExecutado}</p>
        </div>
      </div>
    </Card>
  );
}
