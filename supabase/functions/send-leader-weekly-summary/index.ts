import { getAdminClient } from "../_shared/client.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/email.ts";
import { renderLeaderWeeklyTemplate } from "../_shared/templates.ts";

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "gestor" | "lider" | "usuario";
  lider_id: string | null;
  active: boolean;
};

type EquipamentoRow = {
  id: string;
  owner_id: string;
  status_calibracao: "agendado" | "vencido" | "critico" | "alerta_60" | "calibrado";
  active: boolean;
};

type EmailLogRow = {
  owner_id: string;
  tipo: "aviso_60" | "aviso_45" | "escalonamento_gestor" | "semanal_lider";
  status: "enviado" | "falha" | "ignorado_sem_destinatario";
  provider_email_id?: string | null;
  last_event?: string | null;
  meta: {
    week_start?: string;
    reference_date?: string;
  } | null;
};

function getWeekStart(value: Date) {
  const date = new Date(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const adminClient = getAdminClient();
    const appUrl = Deno.env.get("APP_URL") ?? "";
    const payload = request.method === "POST" ? await request.json().catch(() => ({})) : {};
    const referenceDate = "referenceDate" in payload && typeof payload.referenceDate === "string"
      ? new Date(payload.referenceDate)
      : new Date();
    const weekStart = getWeekStart(referenceDate).toISOString();

    const [{ data: users }, { data: equipamentos }, { data: emailLogs }] = await Promise.all([
      adminClient.from("users").select("*").eq("active", true),
      adminClient.from("equipamentos_visao").select("id, owner_id, status_calibracao, active").eq("active", true),
      adminClient.from("email_logs").select("owner_id, tipo, status, meta").eq("tipo", "semanal_lider"),
    ]);

    const usersRows = (users as UserRow[] | null) ?? [];
    const equipamentosRows = (equipamentos as EquipamentoRow[] | null) ?? [];
    const emailLogsRows = (emailLogs as EmailLogRow[] | null) ?? [];
    const leaders = usersRows.filter((user) => user.role === "lider");

    const result = {
      sent: 0,
      skipped: 0,
      skippedDuplicated: 0,
      failed: 0,
    };

    for (const leader of leaders) {
      if (!leader.email) {
        result.skipped += 1;
        continue;
      }

      const alreadySentThisWeek = emailLogsRows.some((log) =>
        log.owner_id === leader.id &&
        log.tipo === "semanal_lider" &&
        log.status === "enviado" &&
        log.meta?.week_start === weekStart
      );

      if (alreadySentThisWeek) {
        result.skippedDuplicated += 1;
        continue;
      }

      const ownerIds = new Set(
        usersRows
          .filter((user) => user.id === leader.id || user.lider_id === leader.id)
          .map((user) => user.id),
      );

      const scoped = equipamentosRows.filter((item) => ownerIds.has(item.owner_id));
      const total = scoped.length;
      const calibrado = scoped.filter((item) => item.status_calibracao === "calibrado").length;
      const critico = scoped.filter((item) => ["critico", "alerta_60"].includes(item.status_calibracao)).length;
      const vencido = scoped.filter((item) => item.status_calibracao === "vencido").length;

      try {
        const emailResult = await sendEmail({
          to: [leader.email],
          subject: "[ER Analitica] Resumo semanal de KPIs",
          html: renderLeaderWeeklyTemplate({
            leaderName: leader.full_name,
            total,
            calibrado,
            critico,
            vencido,
            appUrl,
          }),
        });

        await adminClient.from("email_logs").insert({
          owner_id: leader.id,
          equipamento_id: null,
          tipo: "semanal_lider",
          enviado_para: [leader.email],
          status: "enviado",
          provider_email_id: emailResult.id ?? null,
          last_event: "sent",
          meta: {
            week_start: weekStart,
            reference_date: referenceDate.toISOString(),
          },
        });

        await adminClient.rpc("registrar_log", {
          p_user_id: null,
          p_acao: "Enviou resumo semanal para lider",
          p_tabela: "email_logs",
          p_registro_id: null,
          p_valor_anterior: null,
          p_valor_novo: { leader_id: leader.id, total, week_start: weekStart },
        });

        emailLogsRows.push({
          owner_id: leader.id,
          tipo: "semanal_lider",
          status: "enviado",
          provider_email_id: emailResult.id ?? null,
          last_event: "sent",
          meta: {
            week_start: weekStart,
            reference_date: referenceDate.toISOString(),
          },
        });

        result.sent += 1;
      } catch (_error) {
        await adminClient.from("email_logs").insert({
          owner_id: leader.id,
          equipamento_id: null,
          tipo: "semanal_lider",
          enviado_para: [leader.email],
          status: "falha",
          meta: {
            week_start: weekStart,
            reference_date: referenceDate.toISOString(),
          },
        });

        result.failed += 1;
      }
    }

    return jsonResponse({ success: true, result });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Erro interno.",
      },
      { status: 500 },
    );
  }
});
