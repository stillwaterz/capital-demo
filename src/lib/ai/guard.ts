/**
 * Cheap abuse guard for the public AI routes.
 *
 * The AI endpoints call Anthropic, so an open endpoint is a token-cost target.
 * This rejects cross-origin browser calls (a different site POSTing to our API)
 * while allowing the app's own same-origin fetches. It is a mitigation, not a
 * wall: a same-origin check does not stop a scripted client that spoofs Origin,
 * so pair it with real rate limiting before a wide launch.
 */

/** True when the request is same-origin or carries no Origin (server, curl). */
export function sameOriginOk(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
