import { addDays, differenceInCalendarDays, nextMonday, setHours, setMinutes, setSeconds, startOfDay, startOfWeek } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { mockCrmCards, mockCrmInteractions, mockEmailLogs, mockEquipamentos, mockUsers } from "@/lib/mockData";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AppUser, CrmCard, CrmInteraction, EmailLog, EquipamentoVisao } from "@/types";

type UpcomingEmailStatus =
  | "agendado"
  | "ja_enviado_no_ciclo"
  | "sem_destinatario"
  | "respondido"
  | "resolvido"
  | "fora_da_etapa";

type UpcomingEmailType = EmailLog["tipo"];

export interface UpcomingEmailItem {
  id: string;
  tipo: UpcomingEmailType;
  status: UpcomingEmailStatus;
  data_prevista: string;
  owner_nome: string;
  owner_email: string | null;
  lider_nome: string | null;
  lider_email: string | null;
  gestor_nome: string | null;
  gestor_email: string | null;
  distrito: string | null;
  equipamento_nome: string | null;
  serial_number: string | null;
  destinatarios: string[];
  motivo: string;
  observacao: string;
}

function atEight(date: Date) {
  return setSeconds(setMinutes(setHours(new Date(date), 8), 0), 0);
}

function getWeekStart(date: Date) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function getNextWeeklyRun(date: Date) {
  const mondayThisWeek = atEight(getWeekStart(date));
  if (date <= mondayThisWeek) {
    return mondayThisWeek;
  }

  return atEight(nextMonday(date));
}

function getNextDailyRun(date: Date) {
  const todayAtEight = atEight(date);
  if (date <= todayAtEight) {
    return todayAtEight;
  }

  return atEight(addDays(date, 1));
}

function hasResponse(interactions: CrmInteraction[], cardId: string | null | undefined) {
  if (!cardId) {
    return false;
  }

  return interactions.some((item) => item.card_id === cardId && (item.tipo === "nota" || item.tipo === "contato_manual"));
}

function alreadySentForCycle(
  emailLogs: EmailLog[],
  equipamentoId: string,
  tipo: Exclude<UpcomingEmailType, "semanal_lider">,
  proximaCalibracao: string,
) {
  return emailLogs.some((item) =>
    item.equipamento_id === equipamentoId &&
    item.tipo === tipo &&
    item.status === "enviado" &&
    item.meta?.proxima_calibracao === proximaCalibracao
  );
}

function alreadySentWeekly(emailLogs: EmailLog[], liderId: string, weekStart: string) {
  return emailLogs.some((item) =>
    item.owner_id === liderId &&
    item.tipo === "semanal_lider" &&
    item.status === "enviado" &&
    item.meta?.week_start === weekStart
  );
}

function buildEquipamentoEmailQueue(
  equipamentos: EquipamentoVisao[],
  users: AppUser[],
  cards: CrmCard[],
  interactions: CrmInteraction[],
  emailLogs: EmailLog[],
) {
  const now = new Date();
  const cardsByOwner = new Map(cards.map((item) => [item.owner_id, item]));
  const queue: UpcomingEmailItem[] = [];

  for (const equipamento of equipamentos.filter((item) => item.active && item.proxima_calibracao)) {
    const owner = users.find((user) => user.id === equipamento.owner_id);
    const leader = users.find((user) => user.id === owner?.lider_id);
    const gestor = users.find((user) => user.role === "gestor" && user.active && user.district === equipamento.owner_district);
    const card = cardsByOwner.get(equipamento.owner_id) ?? null;
    const dias = differenceInCalendarDays(startOfDay(new Date(equipamento.proxima_calibracao as string)), startOfDay(now));

    if (dias === 60) {
      const sent = alreadySentForCycle(emailLogs, equipamento.id, "aviso_60", equipamento.proxima_calibracao as string);
      queue.push({
        id: `${equipamento.id}-aviso60`,
        tipo: "aviso_60",
        status: !owner?.email ? "sem_destinatario" : sent ? "ja_enviado_no_ciclo" : "agendado",
        data_prevista: atEight(new Date(equipamento.proxima_calibracao as string)).toISOString(),
        owner_nome: owner?.full_name ?? equipamento.owner_name,
        owner_email: owner?.email ?? equipamento.owner_email ?? null,
        lider_nome: leader?.full_name ?? null,
        lider_email: leader?.email ?? null,
        gestor_nome: null,
        gestor_email: null,
        distrito: equipamento.owner_district ?? equipamento.district,
        equipamento_nome: equipamento.equipamento,
        serial_number: equipamento.serial_number,
        destinatarios: owner?.email ? [owner.email] : [],
        motivo: "Equipamento atinge o gatilho de 60 dias para vencimento.",
        observacao: sent ? "Aviso de 60 dias ja enviado neste ciclo de calibracao." : "Disparo inicial para owner.",
      });
      continue;
    }

    if (dias === 45) {
      const sent = alreadySentForCycle(emailLogs, equipamento.id, "aviso_45", equipamento.proxima_calibracao as string);
      const responded = hasResponse(interactions, card?.id);
      const outOfStage = !card || card.coluna !== "aguardando_retorno";
      const status: UpcomingEmailStatus = !owner?.email
        ? "sem_destinatario"
        : sent
          ? "ja_enviado_no_ciclo"
          : responded
            ? "respondido"
            : outOfStage
              ? "fora_da_etapa"
              : "agendado";

      queue.push({
        id: `${equipamento.id}-aviso45`,
        tipo: "aviso_45",
        status,
        data_prevista: atEight(new Date(equipamento.proxima_calibracao as string)).toISOString(),
        owner_nome: owner?.full_name ?? equipamento.owner_name,
        owner_email: owner?.email ?? equipamento.owner_email ?? null,
        lider_nome: leader?.full_name ?? null,
        lider_email: leader?.email ?? null,
        gestor_nome: null,
        gestor_email: null,
        distrito: equipamento.owner_district ?? equipamento.district,
        equipamento_nome: equipamento.equipamento,
        serial_number: equipamento.serial_number,
        destinatarios: [owner?.email, leader?.email].filter(Boolean) as string[],
        motivo: "Equipamento atinge o gatilho de 45 dias sem resposta do owner.",
        observacao: responded
          ? "Card ja recebeu interacao manual; o escalonamento de 45 dias nao deve sair."
          : outOfStage
            ? "Card nao esta em aguardando_retorno; regra bloqueada pela etapa atual."
            : sent
              ? "Aviso de 45 dias ja enviado neste ciclo de calibracao."
              : "Disparo para owner com lider em copia.",
      });
      continue;
    }

    if (dias < 0) {
      const sent = alreadySentForCycle(emailLogs, equipamento.id, "escalonamento_gestor", equipamento.proxima_calibracao as string);
      const resolved = !card || card.coluna === "calibrado" || card.coluna === "perdido";
      const status: UpcomingEmailStatus = resolved
        ? "resolvido"
        : !gestor?.email
          ? "sem_destinatario"
          : sent
            ? "ja_enviado_no_ciclo"
            : "agendado";

      queue.push({
        id: `${equipamento.id}-escalonamento`,
        tipo: "escalonamento_gestor",
        status,
        data_prevista: getNextDailyRun(now).toISOString(),
        owner_nome: owner?.full_name ?? equipamento.owner_name,
        owner_email: owner?.email ?? equipamento.owner_email ?? null,
        lider_nome: leader?.full_name ?? null,
        lider_email: leader?.email ?? null,
        gestor_nome: gestor?.full_name ?? null,
        gestor_email: gestor?.email ?? null,
        distrito: equipamento.owner_district ?? equipamento.district,
        equipamento_nome: equipamento.equipamento,
        serial_number: equipamento.serial_number,
        destinatarios: [gestor?.email, owner?.email, leader?.email].filter(Boolean) as string[],
        motivo: "Equipamento vencido e card do CRM ainda sem resolucao.",
        observacao: resolved
          ? "Card ja foi resolvido no CRM; o escalonamento nao deve sair."
          : sent
            ? "Escalonamento para gestor ja enviado neste ciclo de calibracao."
            : !gestor?.email
              ? "Nao existe gestor ativo configurado para o distrito do owner."
              : "Escalonamento diario para gestor do distrito enquanto houver pendencia.",
      });
    }
  }

  return queue;
}

function buildWeeklyQueue(users: AppUser[], equipamentos: EquipamentoVisao[], emailLogs: EmailLog[]) {
  const now = new Date();
  const weekStart = getWeekStart(now).toISOString();

  return users
    .filter((user) => user.role === "lider" && user.active)
    .map<UpcomingEmailItem>((leader) => {
      const ownerIds = new Set(
        users
          .filter((user) => user.id === leader.id || user.lider_id === leader.id)
          .map((user) => user.id),
      );
      const total = equipamentos.filter((item) => ownerIds.has(item.owner_id)).length;
      const sent = alreadySentWeekly(emailLogs, leader.id, weekStart);

      return {
        id: `${leader.id}-semanal`,
        tipo: "semanal_lider",
        status: !leader.email ? "sem_destinatario" : sent ? "ja_enviado_no_ciclo" : "agendado",
        data_prevista: getNextWeeklyRun(now).toISOString(),
        owner_nome: leader.full_name,
        owner_email: leader.email,
        lider_nome: leader.full_name,
        lider_email: leader.email,
        gestor_nome: null,
        gestor_email: null,
        distrito: leader.district,
        equipamento_nome: null,
        serial_number: null,
        destinatarios: leader.email ? [leader.email] : [],
        motivo: `Resumo semanal consolidado com ${total} equipamento(s) no escopo do lider.`,
        observacao: sent ? "Resumo semanal desta semana ja enviado." : "Disparo recorrente toda segunda-feira as 08h.",
      };
    });
}

export function useEmails() {
  const { role, profile } = useAuth();
  const [equipamentos, setEquipamentos] = useState<EquipamentoVisao[]>(isSupabaseConfigured ? [] : mockEquipamentos);
  const [users, setUsers] = useState<AppUser[]>(isSupabaseConfigured ? [] : mockUsers);
  const [cards, setCards] = useState<CrmCard[]>(isSupabaseConfigured ? [] : mockCrmCards);
  const [interactions, setInteractions] = useState<CrmInteraction[]>(isSupabaseConfigured ? [] : mockCrmInteractions);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(isSupabaseConfigured ? [] : mockEmailLogs);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setIsLoading(true);

      if (!isSupabaseConfigured || !supabase) {
        if (!mounted) {
          return;
        }

        setEquipamentos(mockEquipamentos);
        setUsers(mockUsers);
        setCards(mockCrmCards);
        setInteractions(mockCrmInteractions);
        setEmailLogs(mockEmailLogs);
        setIsLoading(false);
        return;
      }

      const [equipamentosResponse, usersResponse, cardsResponse, interactionsResponse, emailLogsResponse] = await Promise.all([
        supabase.from("equipamentos_visao").select("*").eq("active", true),
        supabase.from("users").select("*").eq("active", true),
        supabase.from("crm_cards").select("*"),
        supabase.from("crm_interactions").select("*"),
        supabase.from("email_logs").select("*").order("enviado_em", { ascending: false }),
      ]);

      if (!mounted) {
        return;
      }

      if (equipamentosResponse.error) throw equipamentosResponse.error;
      if (usersResponse.error) throw usersResponse.error;
      if (cardsResponse.error) throw cardsResponse.error;
      if (interactionsResponse.error) throw interactionsResponse.error;
      if (emailLogsResponse.error) throw emailLogsResponse.error;

      setEquipamentos((equipamentosResponse.data as EquipamentoVisao[] | null) ?? []);
      setUsers((usersResponse.data as AppUser[] | null) ?? []);
      setCards((cardsResponse.data as CrmCard[] | null) ?? []);
      setInteractions((interactionsResponse.data as CrmInteraction[] | null) ?? []);
      setEmailLogs((emailLogsResponse.data as EmailLog[] | null) ?? []);
      setIsLoading(false);
    }

    void loadData().catch(() => {
      if (mounted) {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const scopedUsers = useMemo(() => {
    if (role === "lider" && profile) {
      return users.filter((user) => user.id === profile.id || user.lider_id === profile.id);
    }

    return users;
  }, [profile, role, users]);

  const scopedEquipamentos = useMemo(() => {
    if (role === "lider" && profile) {
      return equipamentos.filter((item) => item.owner_id === profile.id || scopedUsers.some((user) => user.id === item.owner_id));
    }

    return equipamentos;
  }, [equipamentos, profile, role, scopedUsers]);

  const scopedCards = useMemo(() => {
    if (role === "lider" && profile) {
      const allowedOwnerIds = new Set(scopedUsers.map((user) => user.id));
      return cards.filter((item) => allowedOwnerIds.has(item.owner_id));
    }

    return cards;
  }, [cards, profile, role, scopedUsers]);

  const scopedInteractions = useMemo(() => {
    if (role === "lider") {
      const allowedCardIds = new Set(scopedCards.map((item) => item.id));
      return interactions.filter((item) => allowedCardIds.has(item.card_id));
    }

    return interactions;
  }, [interactions, role, scopedCards]);

  const scopedEmailLogs = useMemo(() => {
    if (role === "lider" && profile) {
      const allowedOwnerIds = new Set(scopedUsers.map((user) => user.id));
      return emailLogs.filter((item) => allowedOwnerIds.has(item.owner_id));
    }

    return emailLogs;
  }, [emailLogs, profile, role, scopedUsers]);

  const upcomingEmails = useMemo(() => {
    const equipamentoQueue = buildEquipamentoEmailQueue(scopedEquipamentos, users, scopedCards, scopedInteractions, scopedEmailLogs);
    const weeklyQueue = buildWeeklyQueue(
      role === "lider" && profile ? users.filter((user) => user.id === profile.id) : users,
      scopedEquipamentos,
      scopedEmailLogs,
    );

    return [...equipamentoQueue, ...weeklyQueue].sort(
      (a, b) => new Date(a.data_prevista).getTime() - new Date(b.data_prevista).getTime(),
    );
  }, [profile, role, scopedCards, scopedEmailLogs, scopedEquipamentos, scopedInteractions, users]);

  const metrics = useMemo(() => ({
    agendados: upcomingEmails.filter((item) => item.status === "agendado").length,
    bloqueados: upcomingEmails.filter((item) => item.status === "sem_destinatario" || item.status === "fora_da_etapa").length,
    enviadosNoCiclo: upcomingEmails.filter((item) => item.status === "ja_enviado_no_ciclo").length,
    respondidosOuResolvidos: upcomingEmails.filter((item) => item.status === "respondido" || item.status === "resolvido").length,
  }), [upcomingEmails]);

  return {
    upcomingEmails,
    emailLogs: scopedEmailLogs,
    equipamentos: scopedEquipamentos,
    users: scopedUsers,
    metrics,
    isLoading,
  };
}
