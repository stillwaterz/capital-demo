"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  OPS_COOKIE_NAME,
  OPS_SESSION_TOKEN,
  OPS_SESSION_MAX_AGE_SECONDS,
  OPS_DEMO_USERNAME,
  OPS_DEMO_PASSWORD,
} from "@/lib/ops/auth-constants";

export async function opsLogin(formData: FormData) {
  const username = formData.get("username");
  const password = formData.get("password");

  if (username !== OPS_DEMO_USERNAME || password !== OPS_DEMO_PASSWORD) {
    redirect("/ops-login?error=1");
  }

  const store = await cookies();
  store.set(OPS_COOKIE_NAME, OPS_SESSION_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: OPS_SESSION_MAX_AGE_SECONDS,
  });

  redirect("/ops");
}

export async function opsLogout() {
  const store = await cookies();
  store.delete(OPS_COOKIE_NAME);
  redirect("/ops-login");
}
