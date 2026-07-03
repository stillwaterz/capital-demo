import { NextResponse } from "next/server";
import { isDemo } from "@/lib/config/mode";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Sign a client out. Production only; demo runs without auth. */
export async function POST() {
  if (isDemo) {
    return NextResponse.json(
      { error: "Auth is disabled in demo mode." },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
