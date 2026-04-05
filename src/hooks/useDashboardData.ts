import { useEffect, useState } from "react";
import { mockCalibracoes, mockCrmCards, mockEquipamentos, mockReviewRequests, mockUsers } from "@/lib/mockData";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { registerLog } from "@/services/logService";
import type { AppUser, Calibracao, CrmCard, EquipamentoVisao, ReviewRequest, ReviewRequestStatus, UserRole } from "@/types";

export function useDashboardData(role: UserRole | null, actorUserId?: string | null) {
  const [equipamentos, setEquipamentos] = useState<EquipamentoVisao[]>(isSupabaseConfigured ? [] : mockEquipamentos);
  const [calibracoes, setCalibracoes] = useState<Calibracao[]>(isSupabaseConfigured ? [] : mockCalibracoes);
  const [crmCards, setCrmCards] = useState<CrmCard[]>(isSupabaseConfigured ? [] : mockCrmCards);
  const [reviewRequests, setReviewRequests] = useState<ReviewRequest[]>(isSupabaseConfigured ? [] : mockReviewRequests);
  const [users, setUsers] = useState<AppUser[]>(isSupabaseConfigured ? [] : mockUsers);
  const [isLoading, setIsLoading] = useState(true);

  async function loadData() {
    setIsLoading(true);

    if (!isSupabaseConfigured || !supabase) {
      setEquipamentos(mockEquipamentos);
      setCalibracoes(mockCalibracoes);
      setCrmCards(mockCrmCards);
      setReviewRequests(mockReviewRequests);
      setUsers(mockUsers);
      setIsLoading(false);
      return;
    }

    const [equipamentosResponse, calibracoesResponse, crmCardsResponse, usersResponse] = await Promise.all([
      supabase.from("equipamentos_visao").select("*"),
      supabase.from("calibracoes").select("*"),
      supabase.from("crm_cards").select("*"),
      supabase.from("users").select("*").eq("active", true),
    ]);

    if (equipamentosResponse.error) {
      setIsLoading(false);
      throw equipamentosResponse.error;
    }

    if (calibracoesResponse.error) {
      setIsLoading(false);
      throw calibracoesResponse.error;
    }

    if (crmCardsResponse.error) {
      setIsLoading(false);
      throw crmCardsResponse.error;
    }

    if (usersResponse.error) {
      setIsLoading(false);
      throw usersResponse.error;
    }

    setEquipamentos((equipamentosResponse.data as EquipamentoVisao[] | null) ?? []);
    setCalibracoes((calibracoesResponse.data as Calibracao[] | null) ?? []);
    setCrmCards((crmCardsResponse.data as CrmCard[] | null) ?? []);
    setUsers((usersResponse.data as AppUser[] | null) ?? []);

    if (role === "admin") {
      const { data, error } = await supabase.from("review_requests").select("*").order("created_at", { ascending: false });
      if (error) {
        setIsLoading(false);
        throw error;
      }
      setReviewRequests((data as ReviewRequest[] | null) ?? []);
    } else {
      setReviewRequests([]);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    let mounted = true;

    void loadData().catch(() => {
      if (mounted) {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [role]);

  async function updateReviewRequestStatus(
    request: ReviewRequest,
    status: ReviewRequestStatus,
    observacao: string,
  ) {
    const nextObservacao = observacao.trim();

    if (!isSupabaseConfigured || !supabase) {
      setReviewRequests((current) =>
        current.map((entry) =>
          entry.id === request.id
            ? {
                ...entry,
                status,
                observacao: nextObservacao || null,
                updated_at: new Date().toISOString(),
              }
            : entry,
        ),
      );

      await registerLog({
        userId: actorUserId,
        action: "Atualizou solicitacao de revisao",
        table: "review_requests",
        recordId: request.id,
        previousValue: { status: request.status, observacao: request.observacao },
        nextValue: { status, observacao: nextObservacao || null },
      });
      return;
    }

    const { error } = await supabase
      .from("review_requests")
      .update({ status, observacao: nextObservacao || null })
      .eq("id", request.id);

    if (error) {
      throw error;
    }

    await registerLog({
      userId: actorUserId,
      action: "Atualizou solicitacao de revisao",
      table: "review_requests",
      recordId: request.id,
      previousValue: { status: request.status, observacao: request.observacao },
      nextValue: { status, observacao: nextObservacao || null },
    });

    await loadData();
  }

  return {
    equipamentos,
    calibracoes,
    crmCards,
    reviewRequests,
    users,
    isLoading,
    refresh: loadData,
    updateReviewRequestStatus,
  };
}
