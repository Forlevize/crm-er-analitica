import { getAdminClient } from "../_shared/client.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/email.ts";
import { renderEquipamentoTemplate } from "../_shared/templates.ts";

type EquipamentoRow = {
  id: string;
  owner_id: string;
  serial_number: string;
  equipamento: string;
  proxima_calibracao: string | null;
  owner_name: string;
  owner_email: string;
  owner_district: string | null;
  lider_name: string | null;
  active: boolean;
};

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "gestor" | "lider" | "usuario";
  district: string | null;
  lider_id: string | null;
  active: boolean;
};

type CardRow = {
  id: string;
  owner_id: string;
  coluna: string;
};

type InteractionRow = {
  card_id: string;
  tipo: "nota" | "email" | "movimentacao" | "contato_manual";
};

type EmailLogRow = {
  owner_id: string;
  equipamento_id: string | null;
  tipo: "aviso_60" | "aviso_45" | "escalonamento_gestor" | "semanal_lider";
  status: "enviado" | "falha" | "ignorado_sem_destinatario";
  provider_email_id?: string | null;
  last_event?: string | null;
  meta: {
    proxima_calibracao?: string;
    reference_date?: string;
  } | null;
};

function diffInDays(targetDate: string, referenceDate: Date) {
  const target = new Date(targetDate);
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDatePtBr(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

function alreadySentForCycle(
  emailLogs: EmailLogRow[],
  equipamentoId: string,
  tipo: "aviso_60" | "aviso_45" | "escalonamento_gestor",
  proximaCalibracao: string,
) {
  return emailLogs.some((log) =>
    log.equipamento_id === equipamentoId &&
    log.tipo === tipo &&
    log.status === "enviado" &&
    log.meta?.proxima_calibracao === proximaCalibracao
  );
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const adminClient = getAdminClient();
    const payload = request.method === "POST" ? await request.json().catch(() => ({})) : {};
    const referenceDate = "referenceDate" in payload && typeof payload.referenceDate === "string"
      ? new Date(payload.referenceDate)
      : new Date();
    const appUrl = Deno.env.get("APP_URL") ?? "";

    const [{ data: equipamentos }, { data: users }, { data: cards }, { data: interactions }, { data: emailLogs }] = await Promise.all([
      adminClient.from("equipamentos_visao").select("*").eq("active", true),
      adminClient.from("users").select("*").eq("active", true),
      adminClient.from("crm_cards").select("id, owner_id, coluna"),
      adminClient.from("crm_interactions").select("card_id, tipo"),
      adminClient.from("email_logs").select("owner_id, equipamento_id, tipo, status, meta"),
    ]);

    const equipamentosRows = (equipamentos as EquipamentoRow[] | null) ?? [];
    const usersRows = (users as UserRow[] | null) ?? [];
    const cardsRows = (cards as CardRow[] | null) ?? [];
    const interactionsRows = (interactions as InteractionRow[] | null) ?? [];
    const emailLogsRows = (emailLogs as EmailLogRow[] | null) ?? [];

    const cardsByOwner = new Map(cardsRows.map((item) => [item.owner_id, item]));
    const ownerResponseByCard = new Set(
      interactionsRows
        .filter((item) => item.tipo === "nota" || item.tipo === "contato_manual")
        .map((item) => item.card_id),
    );

    const result = {
      aviso60: 0,
      aviso45: 0,
      escalonamentos: 0,
      ignoradosSemGestor: 0,
      skippedDuplicated: 0,
      falhas: 0,
    };

    for (const equipamento of equipamentosRows) {
      if (!equipamento.proxima_calibracao) {
        continue;
      }

      const dias = diffInDays(equipamento.proxima_calibracao, referenceDate);
      const owner = usersRows.find((user) => user.id === equipamento.owner_id);
      const leader = usersRows.find((user) => user.id === owner?.lider_id);
      const gestor = usersRows.find(
        (user) => user.role === "gestor" && user.active && user.district === equipamento.owner_district,
      );

      if (!owner?.email) {
        continue;
      }

      let card = cardsByOwner.get(equipamento.owner_id) ?? null;

      try {
        if (dias === 60) {
          if (alreadySentForCycle(emailLogsRows, equipamento.id, "aviso_60", equipamento.proxima_calibracao)) {
            result.skippedDuplicated += 1;
            continue;
          }

          if (!card) {
            const { data: upsertedCard, error: upsertError } = await adminClient
              .from("crm_cards")
              .upsert(
                {
                  owner_id: equipamento.owner_id,
                  coluna: "sem_contato",
                  notas: "Card criado automaticamente no aviso de 60 dias.",
                  last_contact_at: new Date().toISOString(),
                },
                { onConflict: "owner_id" },
              )
              .select("id, owner_id, coluna")
              .single();

            if (upsertError) {
              throw upsertError;
            }

            card = (upsertedCard as CardRow | null) ?? null;
            if (card) {
              cardsByOwner.set(card.owner_id, card);
            }
          }

          if (!card?.id) {
            throw new Error("Card de CRM nao disponivel para aviso de 60 dias.");
          }

          const emailResult = await sendEmail({
            to: [owner.email],
            subject: `[ER Analitica] Aviso 60 dias - ${equipamento.serial_number}`,
            html: renderEquipamentoTemplate({
              ownerName: owner.full_name,
              serialNumber: equipamento.serial_number,
              equipamento: equipamento.equipamento,
              dueDate: formatDatePtBr(equipamento.proxima_calibracao),
              statusLabel: "Alerta 60 dias",
              appUrl,
            }),
          });

          if (card.coluna === "sem_contato") {
            const { error: moveError } = await adminClient
              .from("crm_cards")
              .update({ coluna: "aguardando_retorno", last_contact_at: new Date().toISOString() })
              .eq("id", card.id);

            if (moveError) {
              throw moveError;
            }

            await adminClient.from("crm_interactions").insert({
              card_id: card.id,
              owner_id: equipamento.owner_id,
              tipo: "movimentacao",
              descricao: "Movido automaticamente de sem_contato para aguardando_retorno no aviso de 60 dias.",
              meta: { from: "sem_contato", to: "aguardando_retorno", tipo: "aviso_60" },
              created_by: null,
            });

            card = { ...card, coluna: "aguardando_retorno" };
            cardsByOwner.set(equipamento.owner_id, card);
          }

          await adminClient.from("crm_interactions").insert({
            card_id: card.id,
            owner_id: equipamento.owner_id,
            tipo: "email",
            descricao: "Disparo automatico do aviso de 60 dias.",
            meta: { tipo: "aviso_60", equipamento_id: equipamento.id },
            created_by: null,
          });

          await adminClient.from("email_logs").insert({
            owner_id: equipamento.owner_id,
            equipamento_id: equipamento.id,
            tipo: "aviso_60",
            enviado_para: [owner.email],
            status: "enviado",
            provider_email_id: emailResult.id ?? null,
            last_event: "sent",
            meta: {
              proxima_calibracao: equipamento.proxima_calibracao,
              reference_date: referenceDate.toISOString(),
            },
          });

          emailLogsRows.push({
            owner_id: equipamento.owner_id,
            equipamento_id: equipamento.id,
            tipo: "aviso_60",
            status: "enviado",
            provider_email_id: emailResult.id ?? null,
            last_event: "sent",
            meta: {
              proxima_calibracao: equipamento.proxima_calibracao,
              reference_date: referenceDate.toISOString(),
            },
          });

          await adminClient.rpc("registrar_log", {
            p_user_id: null,
            p_acao: "Enviou aviso automatico de 60 dias",
            p_tabela: "email_logs",
            p_registro_id: null,
            p_valor_anterior: null,
            p_valor_novo: { equipamento_id: equipamento.id, owner_id: equipamento.owner_id },
          });

          result.aviso60 += 1;
          continue;
        }

        if (dias === 45 && card?.coluna === "aguardando_retorno" && !ownerResponseByCard.has(card.id)) {
          if (alreadySentForCycle(emailLogsRows, equipamento.id, "aviso_45", equipamento.proxima_calibracao)) {
            result.skippedDuplicated += 1;
            continue;
          }

          const cc = leader?.email ? [leader.email] : [];

          const emailResult = await sendEmail({
            to: [owner.email],
            cc,
            subject: `[ER Analitica] Aviso 45 dias - ${equipamento.serial_number}`,
            html: renderEquipamentoTemplate({
              ownerName: owner.full_name,
              serialNumber: equipamento.serial_number,
              equipamento: equipamento.equipamento,
              dueDate: formatDatePtBr(equipamento.proxima_calibracao),
              statusLabel: "Critico 45 dias",
              appUrl,
            }),
          });

          await adminClient.from("crm_interactions").insert({
            card_id: card.id,
            owner_id: equipamento.owner_id,
            tipo: "email",
            descricao: "Disparo automatico do aviso de 45 dias.",
            meta: { tipo: "aviso_45", equipamento_id: equipamento.id },
            created_by: null,
          });

          await adminClient.from("email_logs").insert({
            owner_id: equipamento.owner_id,
            equipamento_id: equipamento.id,
            tipo: "aviso_45",
            enviado_para: [owner.email, ...cc],
            status: "enviado",
            provider_email_id: emailResult.id ?? null,
            last_event: "sent",
            meta: {
              proxima_calibracao: equipamento.proxima_calibracao,
              reference_date: referenceDate.toISOString(),
            },
          });

          emailLogsRows.push({
            owner_id: equipamento.owner_id,
            equipamento_id: equipamento.id,
            tipo: "aviso_45",
            status: "enviado",
            provider_email_id: emailResult.id ?? null,
            last_event: "sent",
            meta: {
              proxima_calibracao: equipamento.proxima_calibracao,
              reference_date: referenceDate.toISOString(),
            },
          });

          await adminClient.rpc("registrar_log", {
            p_user_id: null,
            p_acao: "Enviou aviso automatico de 45 dias",
            p_tabela: "email_logs",
            p_registro_id: null,
            p_valor_anterior: null,
            p_valor_novo: { equipamento_id: equipamento.id, owner_id: equipamento.owner_id },
          });

          result.aviso45 += 1;
          continue;
        }

        if (dias < 0 && card && !["calibrado", "perdido"].includes(card.coluna)) {
          if (alreadySentForCycle(emailLogsRows, equipamento.id, "escalonamento_gestor", equipamento.proxima_calibracao)) {
            result.skippedDuplicated += 1;
            continue;
          }

          if (!gestor?.email) {
            await adminClient.from("email_logs").insert({
              owner_id: equipamento.owner_id,
              equipamento_id: equipamento.id,
              tipo: "escalonamento_gestor",
              enviado_para: [],
              status: "ignorado_sem_destinatario",
              meta: {
                proxima_calibracao: equipamento.proxima_calibracao,
                reference_date: referenceDate.toISOString(),
              },
            });

            await adminClient.rpc("registrar_log", {
              p_user_id: null,
              p_acao: "Escalonamento ignorado por falta de gestor",
              p_tabela: "email_logs",
              p_registro_id: null,
              p_valor_anterior: null,
              p_valor_novo: { equipamento_id: equipamento.id, district: equipamento.owner_district },
            });

            result.ignoradosSemGestor += 1;
            continue;
          }

          const cc = [owner.email, leader?.email].filter(Boolean) as string[];

          const emailResult = await sendEmail({
            to: [gestor.email],
            cc,
            subject: `[ER Analitica] Escalonamento - ${equipamento.serial_number} vencido`,
            html: renderEquipamentoTemplate({
              ownerName: gestor.full_name,
              serialNumber: equipamento.serial_number,
              equipamento: equipamento.equipamento,
              dueDate: formatDatePtBr(equipamento.proxima_calibracao),
              statusLabel: "Vencido",
              appUrl,
            }),
          });

          await adminClient.from("crm_interactions").insert({
            card_id: card.id,
            owner_id: equipamento.owner_id,
            tipo: "email",
            descricao: "Escalonamento automatico para gestor por equipamento vencido.",
            meta: { tipo: "escalonamento_gestor", equipamento_id: equipamento.id },
            created_by: null,
          });

          await adminClient.from("email_logs").insert({
            owner_id: equipamento.owner_id,
            equipamento_id: equipamento.id,
            tipo: "escalonamento_gestor",
            enviado_para: [gestor.email, ...cc],
            status: "enviado",
            provider_email_id: emailResult.id ?? null,
            last_event: "sent",
            meta: {
              proxima_calibracao: equipamento.proxima_calibracao,
              reference_date: referenceDate.toISOString(),
            },
          });

          emailLogsRows.push({
            owner_id: equipamento.owner_id,
            equipamento_id: equipamento.id,
            tipo: "escalonamento_gestor",
            status: "enviado",
            provider_email_id: emailResult.id ?? null,
            last_event: "sent",
            meta: {
              proxima_calibracao: equipamento.proxima_calibracao,
              reference_date: referenceDate.toISOString(),
            },
          });

          await adminClient.rpc("registrar_log", {
            p_user_id: null,
            p_acao: "Enviou escalonamento automatico para gestor",
            p_tabela: "email_logs",
            p_registro_id: null,
            p_valor_anterior: null,
            p_valor_novo: { equipamento_id: equipamento.id, owner_id: equipamento.owner_id },
          });

          result.escalonamentos += 1;
        }
      } catch (_error) {
        result.falhas += 1;
        await adminClient.from("email_logs").insert({
          owner_id: equipamento.owner_id,
          equipamento_id: equipamento.id,
          tipo: dias < 0 ? "escalonamento_gestor" : dias === 45 ? "aviso_45" : "aviso_60",
          enviado_para: owner?.email ? [owner.email] : [],
          status: "falha",
          meta: {
            proxima_calibracao: equipamento.proxima_calibracao,
            reference_date: referenceDate.toISOString(),
          },
        });
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
