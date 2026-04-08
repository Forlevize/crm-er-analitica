import { getYear, parseISO } from "date-fns";
import { getMonthLabels } from "@/lib/utils";
import { summarizeStatus } from "@/lib/statusUtils";
import type { Calibracao, CrmCard, DashboardMetrics, EquipamentoVisao, ReviewRequest } from "@/types";

const crmLabels = {
  sem_contato: "Sem contato",
  aguardando_retorno: "Aguardando retorno",
  em_contato: "Em contato",
  agendado: "Agendado",
  calibrado: "Calibrado",
  perdido: "Perdido",
} as const;

interface DashboardMetricSources {
  calibracoes: Calibracao[];
  crmCards: CrmCard[];
  reviewRequests: ReviewRequest[];
}

export function buildDashboardMetrics(
  items: EquipamentoVisao[],
  district: string,
  isAdmin: boolean,
  sources: DashboardMetricSources,
): DashboardMetrics {
  const equipmentById = new Map(items.map((item) => [item.id, item]));
  const scoped = items.filter((item) => {
    if (!item.active) {
      return false;
    }

    if (district && district !== "todos") {
      return item.owner_district === district;
    }

    return true;
  });

  const currentYear = new Date().getFullYear();
  const monthLabels = getMonthLabels();
  const status = summarizeStatus(scoped);

  const scopedCalibracoes = sources.calibracoes.filter((item) => {
    const equipamento = equipmentById.get(item.equipamento_id);
    if (!equipamento?.active) {
      return false;
    }

    if (district && district !== "todos") {
      return equipamento.owner_district === district;
    }

    return true;
  });

  const previstoPorMes = monthLabels.map((mes, index) => {
    const previsto = scoped.filter((item) => {
      if (!item.proxima_calibracao) {
        return false;
      }
      const date = parseISO(item.proxima_calibracao);
      return date.getMonth() === index && getYear(date) === currentYear;
    }).length;

    const executado = scopedCalibracoes.filter((item) => {
      const date = parseISO(item.data_calibracao);
      return item.realizado && date.getMonth() === index && getYear(date) === currentYear;
    }).length;

    return { mes, previsto, executado };
  });

  const crmResumo = Object.entries(crmLabels).map(([coluna, label]) => ({
    coluna: coluna as keyof typeof crmLabels,
    label,
    valor: sources.crmCards.filter((card) => card.coluna === coluna).length,
  }));

  const distritosMap = new Map<string, EquipamentoVisao[]>();
  scoped.forEach((item) => {
    const key = item.owner_district ?? "Sem distrito";
    const current = distritosMap.get(key) ?? [];
    current.push(item);
    distritosMap.set(key, current);
  });

  const distritos = Array.from(distritosMap.entries()).map(([key, values]) => {
    const resumo = summarizeStatus(values);
    return {
      district: key,
      calibrado: resumo.calibrado,
      critico: resumo.critico,
      vencido: resumo.vencido,
      agendado: resumo.agendado,
      total: values.length,
    };
  });

  return {
    calibracoesRealizadas: scopedCalibracoes.filter((item) => {
      const date = parseISO(item.data_calibracao);
      return item.realizado && getYear(date) === currentYear;
    }).length,
    equipamentosAtivos: scoped.length,
    equipamentosVencidos: status.vencido,
    previstoPorMes,
    statusEquipamentos: [
      { nome: "Calibrado", valor: status.calibrado },
      { nome: "Critico", valor: status.critico },
      { nome: "Vencido", valor: status.vencido },
      { nome: "Agendado", valor: status.agendado },
    ],
    crmResumo,
    distritos,
    pendingReviews: isAdmin ? sources.reviewRequests.filter((item) => item.status === "aberto").length : 0,
  };
}
