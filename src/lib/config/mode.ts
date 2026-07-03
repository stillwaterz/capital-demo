/**
 * Runtime mode flag.
 *
 * One codebase, one flag. `NEXT_PUBLIC_APP_MODE` selects which adapter set binds
 * at runtime: `demo` runs on mock adapters, `production` binds the real rails.
 * There are no separate databases and no forked code, only this switch.
 *
 * The value is public on purpose. It changes which bindings load, never a secret.
 */

export type AppMode = "demo" | "production";

const DEFAULT_MODE: AppMode = "demo";

function resolveMode(): AppMode {
  const raw = process.env.NEXT_PUBLIC_APP_MODE;
  if (raw === "production") return "production";
  if (raw === "demo") return "demo";
  return DEFAULT_MODE;
}

/** The active mode for this deployment. */
export const APP_MODE: AppMode = resolveMode();

/** True when mock adapters are bound. */
export const isDemo = APP_MODE === "demo";

/** True when the real rails are bound. */
export const isProduction = APP_MODE === "production";
