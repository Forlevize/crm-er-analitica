import { isSupabaseConfigured, supabase } from "@/lib/supabase";

async function getValidAccessToken() {
  if (!supabase) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return null;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (session.expires_at && session.expires_at - nowInSeconds > 60) {
    return session.access_token;
  }

  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session?.access_token) {
    return session.access_token;
  }

  return data.session.access_token;
}

async function callFunctionWithToken<TPayload extends Record<string, unknown>>(
  functionName: string,
  payload: TPayload,
  token: string,
) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Variaveis do Supabase nao configuradas no frontend.");
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const result = contentType.includes("application/json") ? await response.json() : await response.text();

  return { response, result };
}

export async function invokeEdgeFunction<TPayload extends Record<string, unknown>>(
  functionName: string,
  payload: TPayload,
) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: true, payload };
  }

  const firstToken = await getValidAccessToken();
  if (!firstToken) {
    throw new Error("Sessao expirada. Faca login novamente.");
  }

  let { response, result } = await callFunctionWithToken(functionName, payload, firstToken);

  const message =
    typeof result === "object" && result
      ? "message" in result
        ? String(result.message)
        : "error" in result
          ? String(result.error)
          : ""
      : "";

  if (!response.ok && response.status === 401 && /invalid jwt/i.test(message)) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session?.access_token) {
      throw new Error("Sessao expirada. Faca login novamente.");
    }

    const retry = await callFunctionWithToken(functionName, payload, data.session.access_token);
    response = retry.response;
    result = retry.result;
  }

  if (!response.ok) {
    if (typeof result === "object" && result && "error" in result) {
      throw new Error(String(result.error));
    }

    if (typeof result === "object" && result && "message" in result) {
      throw new Error(String(result.message));
    }

    throw new Error(typeof result === "string" ? result : "Falha ao chamar Edge Function.");
  }

  return result;
}
