import { useEffect, useMemo, useState } from "react";
import { mockEmailLogs, mockEquipamentos, mockUsers } from "@/lib/mockData";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { summarizeStatus } from "@/lib/statusUtils";
import type { AppUser, EmailLog, EquipamentoVisao, RelatorioFiltro } from "@/types";

function toStartOfDay(value: string) {
  return new Date(`${value}T00:00:00`);
}

function toEndOfDay(value: string) {
  return new Date(`${value}T23:59:59`);
}

export function useRelatorios(filters: RelatorioFiltro) {
  const [allEquipamentos, setAllEquipamentos] = useState<EquipamentoVisao[]>(isSupabaseConfigured ? [] : mockEquipamentos);
  const [allEmailLogs, setAllEmailLogs] = useState<EmailLog[]>(isSupabaseConfigured ? [] : mockEmailLogs);
  const [owners, setOwners] = useState<AppUser[]>(
    isSupabaseConfigured ? [] : mockUsers.filter((user) => user.role === "usuario" || user.role === "lider"),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setIsLoading(true);

      if (!isSupabaseConfigured || !supabase) {
        if (!mounted) {
          return;
        }

        setAllEquipamentos(mockEquipamentos);
        setAllEmailLogs(mockEmailLogs);
        setOwners(mockUsers.filter((user) => user.role === "usuario" || user.role === "lider"));
        setIsLoading(false);
        return;
      }

      const [equipamentosResponse, emailLogsResponse, usersResponse] = await Promise.all([
        supabase.from("equipamentos_visao").select("*"),
        supabase.from("email_logs").select("*").order("enviado_em", { ascending: false }),
        supabase.from("users").select("*").eq("active", true),
      ]);

      if (!mounted) {
        return;
      }

      if (equipamentosResponse.error) throw equipamentosResponse.error;
      if (emailLogsResponse.error) throw emailLogsResponse.error;
      if (usersResponse.error) throw usersResponse.error;

      setAllEquipamentos((equipamentosResponse.data as EquipamentoVisao[] | null) ?? []);
      setAllEmailLogs((emailLogsResponse.data as EmailLog[] | null) ?? []);
      setOwners(
        ((usersResponse.data as AppUser[] | null) ?? []).filter(
          (user) => user.role === "usuario" || user.role === "lider",
        ),
      );
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

  const equipamentos = useMemo(() => {
    return allEquipamentos.filter((item) => {
      if (filters.district && filters.district !== "todos" && item.owner_district !== filters.district) {
        return false;
      }

      if (filters.ownerId && filters.ownerId !== "todos" && item.owner_id !== filters.ownerId) {
        return false;
      }

      if (filters.status && filters.status !== "todos" && item.status_calibracao !== filters.status) {
        return false;
      }

      if (filters.dataInicio) {
        if (!item.proxima_calibracao) {
          return false;
        }

        if (new Date(item.proxima_calibracao) < toStartOfDay(filters.dataInicio)) {
          return false;
        }
      }

      if (filters.dataFim) {
        if (!item.proxima_calibracao) {
          return false;
        }

        if (new Date(item.proxima_calibracao) > toEndOfDay(filters.dataFim)) {
          return false;
        }
      }

      return true;
    });
  }, [allEquipamentos, filters.dataFim, filters.dataInicio, filters.district, filters.ownerId, filters.status]);

  const porOwner = useMemo(() => {
    return owners
      .map((user) => {
        const itens = equipamentos.filter((item) => item.owner_id === user.id);
        return {
          owner: user.full_name,
          district: user.district,
          total: itens.length,
          ...summarizeStatus(itens),
        };
      })
      .filter((entry) => entry.total > 0);
  }, [equipamentos, owners]);

  const vencimentos = useMemo(
    () =>
      equipamentos.filter((item) => item.dias_para_vencer !== null && item.dias_para_vencer >= 0 && item.dias_para_vencer <= 90),
    [equipamentos],
  );

  const emailHistorico = useMemo(() => {
    return allEmailLogs.filter((item) => {
      if (filters.ownerId && filters.ownerId !== "todos" && item.owner_id !== filters.ownerId) {
        return false;
      }

      if (filters.tipoEmail && filters.tipoEmail !== "todos" && item.tipo !== filters.tipoEmail) {
        return false;
      }

      if (filters.dataInicio && new Date(item.enviado_em) < toStartOfDay(filters.dataInicio)) {
        return false;
      }

      if (filters.dataFim && new Date(item.enviado_em) > toEndOfDay(filters.dataFim)) {
        return false;
      }

      return true;
    });
  }, [allEmailLogs, filters.dataFim, filters.dataInicio, filters.ownerId, filters.tipoEmail]);

  const districts = useMemo(() => {
    const values = Array.from(new Set(allEquipamentos.map((item) => item.owner_district).filter(Boolean)));
    return values.sort((a, b) => String(a).localeCompare(String(b))) as string[];
  }, [allEquipamentos]);

  return {
    equipamentos,
    porOwner,
    vencimentos,
    emailHistorico,
    owners,
    districts,
    isLoading,
  };
}
