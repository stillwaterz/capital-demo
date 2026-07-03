import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

/**
 * Supabase client for use in Client Components (browser).
 *
 * Auth session is carried in cookies so the server can read it too. RLS on every
 * table is what enforces tenant and account isolation, not this client.
 */
export function createBrowserSupabaseClient() {
  const { url, publishableKey } = supabaseEnv();
  return createBrowserClient(url, publishableKey);
}
