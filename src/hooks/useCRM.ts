import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  mockCrmCards,
  mockCrmInteractions,
  mockEmailLogs,
  mockEquipamentos,
  mockUsers,
} from "@/lib/mockData";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { registerLog } from "@/services/logService";
import type { AppUser, CrmCard, CrmColuna, CrmInteraction, EmailLog, EquipamentoVisao } from "@/types";

const columnOrder: CrmColuna[] = [
  "sem_contato",
  "aguardando_retorno",
  "em_contato",
  "agendado",
  "calibrado",
  "perdido",
];

export function useCRM() {
  const { role, profile } = useAuth();
  const [cards, setCards] = useState<CrmCard[]>(isSupabaseConfigured ? [] : mockCrmCards);
  const [interactions, setInteractions] = useState<CrmInteraction[]>(isSupabaseConfigured ? [] : mockCrmInteractions);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(isSupabaseConfigured ? [] : mockEmailLogs);
  const [equipamentos, setEquipamentos] = useState<EquipamentoVisao[]>(isSupabaseConfigured ? [] : mockEquipamentos);
  const [users, setUsers] = useState<AppUser[]>(isSupabaseConfigured ? [] : mockUsers);
  const [isLoading, setIsLoading] = useState(true);

  async function loadData() {
    setIsLoading(true);

    if (!isSupabaseConfigured || !supabase) {
      setCards(mockCrmCards);
      setInteractions(mockCrmInteractions);
      setEmailLogs(mockEmailLogs);
      setEquipamentos(mockEquipamentos.filter((item) => item.active));
      setUsers(mockUsers);
      setIsLoading(false);
      return;
    }

    const [cardsResponse, interactionsResponse, emailLogsResponse, equipamentosResponse, usersResponse] = await Promise.all([
      supabase.from("crm_cards").select("*").order("updated_at", { ascending: false }),
      supabase.from("crm_interactions").select("*").order("created_at", { ascending: false }),
      supabase.from("email_logs").select("*").order("enviado_em", { ascending: false }),
      supabase.from("equipamentos_visao").select("*").eq("active", true),
      supabase.from("users").select("*").eq("active", true),
    ]);

    if (cardsResponse.error) throw cardsResponse.error;
    if (interactionsResponse.error) throw interactionsResponse.error;
    if (emailLogsResponse.error) throw emailLogsResponse.error;
    if (equipamentosResponse.error) throw equipamentosResponse.error;
    if (usersResponse.error) throw usersResponse.error;

    setCards((cardsResponse.data as CrmCard[] | null) ?? []);
    setInteractions((interactionsResponse.data as CrmInteraction[] | null) ?? []);
    setEmailLogs((emailLogsResponse.data as EmailLog[] | null) ?? []);
    setEquipamentos((equipamentosResponse.data as EquipamentoVisao[] | null) ?? []);
    setUsers((usersResponse.data as AppUser[] | null) ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    void loadData().catch(() => {
      setIsLoading(false);
    });
  }, []);

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (role === "lider" && profile) {
        const owner = users.find((user) => user.id === card.owner_id);
        return owner?.lider_id === profile.id || owner?.id === profile.id;
      }

      return true;
    });
  }, [cards, profile, role, users]);

  const grouped = useMemo(
    () =>
      columnOrder.map((coluna) => ({
        coluna,
        cards: filteredCards.filter((card) => card.coluna === coluna),
      })),
    [filteredCards],
  );

  async function moveCard(cardId: string, coluna: CrmColuna) {
    const currentCard = cards.find((card) => card.id === cardId);
    if (!currentCard) {
      return;
    }

    const previousColumn = currentCard.coluna;

    if (!isSupabaseConfigured || !supabase) {
      const nextInteraction: CrmInteraction = {
        id: crypto.randomUUID(),
        card_id: cardId,
        owner_id: currentCard.owner_id,
        tipo: "movimentacao",
        descricao: `Movido de ${previousColumn} para ${coluna}.`,
        meta: { from: previousColumn, to: coluna },
        created_at: new Date().toISOString(),
        created_by: profile?.id ?? null,
      };

      setCards((current) =>
        current.map((card) =>
          card.id === cardId
            ? {
                ...card,
                coluna,
                updated_at: new Date().toISOString(),
              }
            : card,
        ),
      );
      setInteractions((current) => [nextInteraction, ...current]);

      await registerLog({
        userId: profile?.id,
        action: "Moveu card no CRM",
        table: "crm_cards",
        recordId: cardId,
        previousValue: { coluna: previousColumn },
        nextValue: { coluna },
      });
      return;
    }

    const { error: updateError } = await supabase.from("crm_cards").update({ coluna }).eq("id", cardId);
    if (updateError) {
      throw updateError;
    }

    const { error: interactionError } = await supabase.from("crm_interactions").insert({
      card_id: cardId,
      owner_id: currentCard.owner_id,
      tipo: "movimentacao",
      descricao: `Movido de ${previousColumn} para ${coluna}.`,
      meta: { from: previousColumn, to: coluna },
      created_by: profile?.id ?? null,
    });
    if (interactionError) {
      throw interactionError;
    }

    await registerLog({
      userId: profile?.id,
      action: "Moveu card no CRM",
      table: "crm_cards",
      recordId: cardId,
      previousValue: { coluna: previousColumn },
      nextValue: { coluna },
    });

    await loadData();
  }

  async function addNote(cardId: string, ownerId: string, descricao: string) {
    const trimmed = descricao.trim();
    if (!trimmed) {
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      const nextInteraction: CrmInteraction = {
        id: crypto.randomUUID(),
        card_id: cardId,
        owner_id: ownerId,
        tipo: "nota",
        descricao: trimmed,
        meta: {},
        created_at: new Date().toISOString(),
        created_by: profile?.id ?? null,
      };

      setInteractions((current) => [nextInteraction, ...current]);
      await registerLog({
        userId: profile?.id,
        action: "Registrou nota no CRM",
        table: "crm_interactions",
        recordId: nextInteraction.id,
        previousValue: null,
        nextValue: { card_id: cardId, owner_id: ownerId, tipo: "nota" },
      });
      return;
    }

    const { data, error } = await supabase
      .from("crm_interactions")
      .insert({
        card_id: cardId,
        owner_id: ownerId,
        tipo: "nota",
        descricao: trimmed,
        meta: {},
        created_by: profile?.id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    await registerLog({
      userId: profile?.id,
      action: "Registrou nota no CRM",
      table: "crm_interactions",
      recordId: (data as { id: string } | null)?.id ?? null,
      previousValue: null,
      nextValue: { card_id: cardId, owner_id: ownerId, tipo: "nota" },
    });

    await loadData();
  }

  return {
    columns: grouped,
    cards: filteredCards,
    interactions,
    emailLogs,
    equipamentos,
    users,
    isLoading,
    moveCard,
    addNote,
  };
}
