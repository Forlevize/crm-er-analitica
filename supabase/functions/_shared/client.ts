import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SB_PROJECT_URL") ?? Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SB_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const anonKey = Deno.env.get("SB_ANON_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";

export function getAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getUserClient(authHeader: string | null) {
  return createClient(supabaseUrl, anonKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
