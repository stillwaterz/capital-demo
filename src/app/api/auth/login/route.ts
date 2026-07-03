import { NextResponse } from "next/server";
import { isDemo } from "@/lib/config/mode";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Sign a client in. Production only; demo runs without auth. */
export async function POST(request: Request) {
  if (isDemo) {
    return NextResponse.json(
      { error: "Auth is disabled in demo mode." },
      { status: 400 }
    );
  }

  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
