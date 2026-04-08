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
import type {
  AppUser,
  CrmCard,
  CrmColuna,
  CrmInteraction,
  CrmInteractionAttachment,
  EmailLog,
  EquipamentoVisao,
} from "@/types";

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
  const [attachments, setAttachments] = useState<CrmInteractionAttachment[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(isSupabaseConfigured ? [] : mockEmailLogs);
  const [equipamentos, setEquipamentos] = useState<EquipamentoVisao[]>(isSupabaseConfigured ? [] : mockEquipamentos);
  const [users, setUsers] = useState<AppUser[]>(isSupabaseConfigured ? [] : mockUsers);
  const [isLoading, setIsLoading] = useState(true);

  async function loadData() {
    setIsLoading(true);

    if (!isSupabaseConfigured || !supabase) {
      setCards(mockCrmCards);
      setInteractions(mockCrmInteractions);
      setAttachments([]);
      setEmailLogs(mockEmailLogs);
      setEquipamentos(mockEquipamentos.filter((item) => item.active));
      setUsers(mockUsers);
      setIsLoading(false);
      return;
    }

    const [cardsResponse, interactionsResponse, attachmentsResponse, emailLogsResponse, equipamentosResponse, usersResponse] = await Promise.all([
      supabase.from("crm_cards").select("*").order("updated_at", { ascending: false }),
      supabase.from("crm_interactions").select("*").order("created_at", { ascending: false }),
      supabase.from("crm_interaction_attachments").select("*").order("created_at", { ascending: false }),
      supabase.from("email_logs").select("*").order("enviado_em", { ascending: false }),
      supabase.from("equipamentos_visao").select("*").eq("active", true),
      supabase.from("users").select("*").eq("active", true),
    ]);

    if (cardsResponse.error) throw cardsResponse.error;
    if (interactionsResponse.error) throw interactionsResponse.error;
    if (attachmentsResponse.error) throw attachmentsResponse.error;
    if (emailLogsResponse.error) throw emailLogsResponse.error;
    if (equipamentosResponse.error) throw equipamentosResponse.error;
    if (usersResponse.error) throw usersResponse.error;

    setCards((cardsResponse.data as CrmCard[] | null) ?? []);
    setInteractions((interactionsResponse.data as CrmInteraction[] | null) ?? []);
    setAttachments((attachmentsResponse.data as CrmInteractionAttachment[] | null) ?? []);
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

  const scopedInteractions = useMemo(() => {
    if (role === "lider") {
      const allowedCardIds = new Set(filteredCards.map((item) => item.id));
      return interactions.filter((item) => allowedCardIds.has(item.card_id));
    }

    return interactions;
  }, [filteredCards, interactions, role]);

  const scopedAttachments = useMemo(() => {
    if (role === "lider") {
      const allowedCardIds = new Set(filteredCards.map((item) => item.id));
      return attachments.filter((item) => allowedCardIds.has(item.card_id));
    }

    return attachments;
  }, [attachments, filteredCards, role]);

  const scopedEmailLogs = useMemo(() => {
    if (role === "lider" && profile) {
      const allowedOwnerIds = new Set(
        users
          .filter((user) => user.id === profile.id || user.lider_id === profile.id)
          .map((user) => user.id),
      );
      return emailLogs.filter((item) => allowedOwnerIds.has(item.owner_id));
    }

    return emailLogs;
  }, [emailLogs, profile, role, users]);

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

  async function addNote(cardId: string, ownerId: string, descricao: string, files: File[] = []) {
    const trimmed = descricao.trim();
    const hasFiles = files.length > 0;

    if (!trimmed && !hasFiles) {
      return;
    }

    const finalDescription = trimmed || "Imagem anexada ao card.";

    if (!isSupabaseConfigured || !supabase) {
      const interactionId = crypto.randomUUID();
      const nextInteraction: CrmInteraction = {
        id: interactionId,
        card_id: cardId,
        owner_id: ownerId,
        tipo: "nota",
        descricao: finalDescription,
        meta: {},
        created_at: new Date().toISOString(),
        created_by: profile?.id ?? null,
      };

      setInteractions((current) => [nextInteraction, ...current]);

      if (hasFiles) {
        const nextAttachments = files.map<CrmInteractionAttachment>((file) => ({
          id: crypto.randomUUID(),
          interaction_id: interactionId,
          card_id: cardId,
          owner_id: ownerId,
          nome_arquivo: file.name,
          caminho_storage: URL.createObjectURL(file),
          tipo_mime: file.type,
          tamanho_bytes: file.size,
          uploaded_by: profile?.id ?? null,
          created_at: new Date().toISOString(),
        }));

        setAttachments((current) => [...nextAttachments, ...current]);
      }

      await registerLog({
        userId: profile?.id,
        action: "Registrou nota no CRM",
        table: "crm_interactions",
        recordId: nextInteraction.id,
        previousValue: null,
        nextValue: { card_id: cardId, owner_id: ownerId, tipo: "nota", anexos: files.length },
      });
      return;
    }

    const { data, error } = await supabase
      .from("crm_interactions")
      .insert({
        card_id: cardId,
        owner_id: ownerId,
        tipo: "nota",
        descricao: finalDescription,
        meta: {},
        created_by: profile?.id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    const interactionId = (data as { id: string } | null)?.id;
    if (!interactionId) {
      throw new Error("Falha ao criar interacao do CRM.");
    }

    if (hasFiles) {
      const attachmentRows: Array<{
        interaction_id: string;
        card_id: string;
        owner_id: string;
        nome_arquivo: string;
        caminho_storage: string;
        tipo_mime: string;
        tamanho_bytes: number;
        uploaded_by: string | null;
      }> = [];

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          throw new Error("Apenas imagens sao permitidas nos anexos do CRM.");
        }

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
        const path = `${cardId}/${interactionId}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage.from("crm-imagens").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

        if (uploadError) {
          throw uploadError;
        }

        attachmentRows.push({
          interaction_id: interactionId,
          card_id: cardId,
          owner_id: ownerId,
          nome_arquivo: file.name,
          caminho_storage: path,
          tipo_mime: file.type,
          tamanho_bytes: file.size,
          uploaded_by: profile?.id ?? null,
        });
      }

      const { error: attachmentError } = await supabase.from("crm_interaction_attachments").insert(attachmentRows);

      if (attachmentError) {
        throw attachmentError;
      }
    }

    await registerLog({
      userId: profile?.id,
      action: "Registrou nota no CRM",
      table: "crm_interactions",
      recordId: interactionId,
      previousValue: null,
      nextValue: { card_id: cardId, owner_id: ownerId, tipo: "nota", anexos: files.length },
    });

    await loadData();
  }

  async function openAttachment(attachment: CrmInteractionAttachment) {
    if (!isSupabaseConfigured || !supabase) {
      return attachment.caminho_storage;
    }

    const { data, error } = await supabase.storage
      .from("crm-imagens")
      .createSignedUrl(attachment.caminho_storage, 60);

    if (error) {
      throw error;
    }

    return data.signedUrl;
  }

  return {
    columns: grouped,
    cards: filteredCards,
    interactions: scopedInteractions,
    attachments: scopedAttachments,
    emailLogs: scopedEmailLogs,
    equipamentos,
    users,
    isLoading,
    moveCard,
    addNote,
    openAttachment,
  };
}
