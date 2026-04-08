import { getAdminClient } from "../_shared/client.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type ResendWebhookPayload = {
  type?: string;
  created_at?: string;
  data?: {
    email_id?: string;
  };
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Metodo nao permitido." }, { status: 405 });
  }

  try {
    const payload = (await request.json()) as ResendWebhookPayload;
    const eventType = payload.type ?? null;
    const emailId = payload.data?.email_id ?? null;
    const eventDate = payload.created_at ?? new Date().toISOString();

    if (!eventType || !emailId) {
      return jsonResponse({ success: false, message: "Payload sem type ou email_id." }, { status: 400 });
    }

    const adminClient = getAdminClient();

    const { data: currentLog, error: fetchError } = await adminClient
      .from("email_logs")
      .select("id, open_count, opened_at, last_event")
      .eq("provider_email_id", emailId)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!currentLog) {
      return jsonResponse({ success: true, ignored: true, message: "Nenhum email_log encontrado para este provider_email_id." });
    }

    const nextPayload: Record<string, string | number | null> = {
      last_event: eventType,
    };

    if (eventType === "email.opened") {
      nextPayload.opened_at = currentLog.opened_at ?? eventDate;
      nextPayload.open_count = Number(currentLog.open_count ?? 0) + 1;
    }

    const { error: updateError } = await adminClient
      .from("email_logs")
      .update(nextPayload)
      .eq("id", currentLog.id);

    if (updateError) {
      throw updateError;
    }

    return jsonResponse({ success: true, emailId, eventType });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Erro interno.",
      },
      { status: 500 },
    );
  }
});
