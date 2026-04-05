import { useMemo, useState } from "react";
import { TabelaLogs } from "@/components/logs/TabelaLogs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useLogs } from "@/hooks/useLogs";

export function Logs() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [actionFilter, setActionFilter] = useState("todos");
  const [userFilter, setUserFilter] = useState("todos");

  const { logs, users, actions, isLoading } = useLogs({
    startDate,
    endDate,
    action: actionFilter,
    userId: userFilter,
  });

  const uniqueUsers = useMemo(() => {
    return users
      .filter((user) => user.active)
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [users]);

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[30px] border border-black/6 bg-white px-6 py-5 shadow-panel">
        <div className="absolute -left-8 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-veoliaRed/8" />
        <div className="absolute right-[-18px] top-[-16px] h-20 w-20 rounded-full bg-turquoise/10" />
        <span className="relative z-10 inline-flex rounded-full border border-marine/12 bg-appBg px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-marine">
          Auditoria
        </span>
        <h1 className="relative z-10 mt-1.5 text-[32px] font-semibold tracking-[-0.06em] text-textPrimary">Logs de auditoria</h1>
        <p className="relative z-10 mt-1.5 text-sm text-textSecondary">Rastreamento das mutacoes e eventos do sistema.</p>
      </div>
      <Card className="grid gap-4 border-marine/12 bg-white/90 md:grid-cols-4">
        <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        <Select value={userFilter} onChange={(event) => setUserFilter(event.target.value)}>
          <option value="todos">Todos os usuarios</option>
          {uniqueUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name}
            </option>
          ))}
        </Select>
        <Select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}>
          <option value="todos">Todas as acoes</option>
          {actions.filter((item) => item !== "todos").map((acao) => (
            <option key={acao} value={acao}>
              {acao}
            </option>
          ))}
        </Select>
      </Card>
      {isLoading ? <Card className="text-sm text-textSecondary">Carregando logs...</Card> : null}
      <TabelaLogs logs={logs} />
    </div>
  );
}
