import { useEffect, useMemo, useState } from "react";
import { mockLogs, mockUsers } from "@/lib/mockData";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AppUser, AuditLog } from "@/types";

export interface LogsFilters {
  startDate: string;
  endDate: string;
  action: string;
  userId: string;
}

export interface AuditLogWithUser extends AuditLog {
  user_name?: string | null;
}

export function useLogs(filters: LogsFilters) {
  const [logs, setLogs] = useState<AuditLogWithUser[]>(isSupabaseConfigured ? [] : mockLogs);
  const [users, setUsers] = useState<AppUser[]>(isSupabaseConfigured ? [] : mockUsers);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadUsers() {
      if (!isSupabaseConfigured || !supabase) {
        setUsers(mockUsers);
        return;
      }

      const { data, error } = await supabase.from("users").select("*");
      if (error) {
        throw error;
      }

      if (!mounted) {
        return;
      }

      setUsers((data as AppUser[] | null) ?? []);
    }

    void loadUsers().catch(() => {
      if (mounted) {
        setUsers([]);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadLogs() {
      setIsLoading(true);

      if (!isSupabaseConfigured || !supabase) {
        if (!mounted) {
          return;
        }

        const filtered = mockLogs.filter((item) => {
          if (filters.action !== "todos" && item.acao !== filters.action) {
            return false;
          }

          if (filters.userId !== "todos" && item.user_id !== filters.userId) {
            return false;
          }

          if (filters.startDate) {
            const start = new Date(`${filters.startDate}T00:00:00`);
            if (new Date(item.created_at) < start) {
              return false;
            }
          }

          if (filters.endDate) {
            const end = new Date(`${filters.endDate}T23:59:59`);
            if (new Date(item.created_at) > end) {
              return false;
            }
          }

          return true;
        });

        setLogs(filtered);
        setIsLoading(false);
        return;
      }

      let query = supabase.from("logs").select("*").order("created_at", { ascending: false }).limit(500);

      if (filters.action !== "todos") {
        query = query.eq("acao", filters.action);
      }

      if (filters.userId !== "todos") {
        query = query.eq("user_id", filters.userId);
      }

      if (filters.startDate) {
        query = query.gte("created_at", `${filters.startDate}T00:00:00`);
      }

      if (filters.endDate) {
        query = query.lte("created_at", `${filters.endDate}T23:59:59`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (!mounted) {
        return;
      }

      setLogs((data as AuditLog[] | null) ?? []);
      setIsLoading(false);
    }

    void loadLogs().catch(() => {
      if (mounted) {
        setLogs([]);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [filters.action, filters.endDate, filters.startDate, filters.userId]);

  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);

  const logsWithUser = useMemo(
    () =>
      logs.map((log) => ({
        ...log,
        user_name: log.user_id ? usersById.get(log.user_id)?.full_name ?? null : "Sistema",
      })),
    [logs, usersById],
  );

  const actions = useMemo(() => {
    const values = Array.from(new Set(logsWithUser.map((item) => item.acao))).sort((a, b) => a.localeCompare(b));
    return ["todos", ...values];
  }, [logsWithUser]);

  return {
    logs: logsWithUser,
    users,
    actions,
    isLoading,
  };
}
