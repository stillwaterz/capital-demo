import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { OPS_COOKIE_NAME, OPS_SESSION_TOKEN } from "@/lib/ops/auth-constants";

export function middleware(request: NextRequest) {
  const session = request.cookies.get(OPS_COOKIE_NAME)?.value;

  if (session === OPS_SESSION_TOKEN) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/ops-login";
  return NextResponse.redirect(url);
}

// Guards the back office only. /ops-login lives outside this matcher so the
// login screen stays reachable while unauthenticated.
export const config = {
  matcher: ["/ops", "/ops/:path*"],
};
