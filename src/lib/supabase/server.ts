import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

/**
 * Supabase client for use in Server Components, route handlers and Server Actions.
 *
 * Reads and writes the auth session through Next's cookie store. Writing from a
 * Server Component render is not allowed, so that case is swallowed and the
 * session refresh is left to middleware or a route handler instead.
 */
export async function createServerSupabaseClient() {
  const { url, publishableKey } = supabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render, where cookies are read only.
        }
      },
    },
  });
}
