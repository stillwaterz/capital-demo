/**
 * Adapter resolver.
 *
 * The mode flag chooses the binding set. Demo binds the mock adapters. Production
 * bindings arrive one at a time behind the same flag as the negotiations close
 * (TASKS.md production cutover), so production throws until they land rather than
 * silently using mocks in a live deployment.
 *
 * Everything above these ports imports `getAdapters()` and never reaches past it.
 */

import { APP_MODE } from "@/lib/config/mode";
import type { Adapters } from "./types";
import { mockAdapters } from "./mock";

export function getAdapters(): Adapters {
  switch (APP_MODE) {
    case "demo":
      return mockAdapters;
    case "production":
      throw new Error(
        "Production adapters are not bound yet. Bind real rails behind the mode flag before running in production."
      );
  }
}

export type {
  Adapters,
  MarketDataAdapter,
  KycAdapter,
  PaymentsAdapter,
  ExecutionAdapter,
  SettlementAdapter,
} from "./types";
