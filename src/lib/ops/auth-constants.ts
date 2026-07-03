// Shared between middleware (edge runtime) and server actions, so this file
// must stay free of "use server" and Node-only APIs.

export const OPS_COOKIE_NAME = "ops_session";
export const OPS_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

// The session cookie value. Set OPS_SESSION_SECRET in production to an
// unguessable string so the gate cannot be bypassed by forging a static cookie.
// Falls back to a demo value locally.
export const OPS_SESSION_TOKEN = process.env.OPS_SESSION_SECRET ?? "authenticated";

// Credentials. Set OPS_USERNAME and OPS_PASSWORD in production. Demo defaults
// keep local use working. Replace with real auth before any non-demo use.
export const OPS_DEMO_USERNAME = process.env.OPS_USERNAME ?? "admin";
export const OPS_DEMO_PASSWORD = process.env.OPS_PASSWORD ?? "admin";
