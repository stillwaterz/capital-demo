import { NextResponse } from "next/server";
import { isDemo } from "@/lib/config/mode";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Create a client account. Production only.
 *
 * The account row and tenant stamp are provisioned by the on_auth_user_created
 * trigger, so this handler only signs the user up. Demo mode runs on mock
 * adapters with no auth, so it returns 400.
 */
export async function POST(request: Request) {
  if (isDemo) {
    return NextResponse.json(
      { error: "Auth is disabled in demo mode." },
      { status: 400 }
    );
  }

  const { email, password, fullName } = await request.json();
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName ?? "" } },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ userId: data.user?.id ?? null });
}
