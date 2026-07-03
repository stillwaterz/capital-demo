/**
 * Supabase connection details, read from public env at call time.
 *
 * Both values are public. The publishable key is designed to sit in the browser
 * and RLS is what protects the data, so there is no secret here. The service
 * role key never appears in app code (see CLAUDE.md).
 */

type SupabaseEnv = {
  url: string;
  publishableKey: string;
};

/**
 * Resolve the Supabase URL and publishable key.
 *
 * Throws a clear error if either is missing so a misconfigured deployment fails
 * loudly rather than silently talking to nothing. Called lazily by the client
 * factories, never at module load, so demo builds stay green without Supabase.
 */
export function supabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase env missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  return { url, publishableKey };
}
