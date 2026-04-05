import { isSupabaseConfigured, supabase } from "@/lib/supabase";

interface RegisterLogInput {
  userId?: string | null;
  action: string;
  table?: string | null;
  recordId?: string | null;
  previousValue?: Record<string, unknown> | null;
  nextValue?: Record<string, unknown> | null;
}

export async function registerLog(input: RegisterLogInput) {
  if (!isSupabaseConfigured || !supabase) {
    return input;
  }

  const { error } = await supabase.rpc("registrar_log", {
    p_user_id: input.userId ?? null,
    p_acao: input.action,
    p_tabela: input.table ?? null,
    p_registro_id: input.recordId ?? null,
    p_valor_anterior: input.previousValue ?? null,
    p_valor_novo: input.nextValue ?? null,
  });

  if (error) {
    throw error;
  }

  return input;
}

