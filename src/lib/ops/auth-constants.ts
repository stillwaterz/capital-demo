// Shared between middleware (edge runtime) and server actions, so this file
// must stay free of "use server" and Node-only APIs.

export const OPS_COOKIE_NAME = "ops_session";
export const OPS_SESSION_TOKEN = "authenticated";
export const OPS_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

// Demo-only credentials. Replace with real auth before any non-demo use.
export const OPS_DEMO_USERNAME = "admin";
export const OPS_DEMO_PASSWORD = "admin";
