import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import type { Calibracao, EquipamentoStatus, EquipamentoVisao } from "@/types";

const today = () => startOfDay(new Date());

export function getEquipamentoStatus(
  proximaCalibracao: string | null,
  calibracoes: Calibracao[] = [],
): EquipamentoStatus {
  const hasFutureAgendamento = calibracoes.some(
    (item) => !item.realizado && differenceInCalendarDays(parseISO(item.data_calibracao), today()) >= 0,
  );

  if (hasFutureAgendamento) {
    return "agendado";
  }

  if (!proximaCalibracao) {
    return "calibrado";
  }

  const diasParaVencer = differenceInCalendarDays(parseISO(proximaCalibracao), today());

  if (diasParaVencer < 0) {
    return "vencido";
  }

  if (diasParaVencer <= 45) {
    return "critico";
  }

  if (diasParaVencer <= 60) {
    return "alerta_60";
  }

  return "calibrado";
}

export function getDiasParaVencer(proximaCalibracao: string | null) {
  if (!proximaCalibracao) {
    return null;
  }

  return differenceInCalendarDays(parseISO(proximaCalibracao), today());
}

export function getStatusMeta(status: EquipamentoStatus) {
  switch (status) {
    case "agendado":
      return { label: "Agendado", className: "border border-status-agendado/30 bg-status-agendado text-white shadow-sm" };
    case "vencido":
      return { label: "Vencido", className: "border border-status-vencido/35 bg-status-vencido text-white shadow-sm" };
    case "critico":
      return { label: "Critico", className: "border border-status-critico/35 bg-status-critico text-white shadow-sm" };
    case "alerta_60":
      return { label: "Alerta 60", className: "border border-status-alerta/40 bg-status-alerta text-black shadow-sm" };
    case "calibrado":
    default:
      return {
        label: "Calibrado",
        className: "border border-status-calibrado/35 bg-status-calibrado text-white shadow-sm",
      };
  }
}

export function summarizeStatus(items: EquipamentoVisao[]) {
  return items.reduce(
    (acc, item) => {
      if (item.status_calibracao === "calibrado") acc.calibrado += 1;
      if (item.status_calibracao === "vencido") acc.vencido += 1;
      if (item.status_calibracao === "agendado") acc.agendado += 1;
      if (item.status_calibracao === "critico" || item.status_calibracao === "alerta_60") acc.critico += 1;
      return acc;
    },
    { calibrado: 0, vencido: 0, agendado: 0, critico: 0 },
  );
}
