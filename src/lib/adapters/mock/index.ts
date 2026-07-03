/**
 * The mock adapter set. Bound in demo mode.
 */

import type { Adapters } from "../types";
import { mockMarketDataAdapter } from "./market-data";
import { mockKycAdapter } from "./kyc";
import { mockPaymentsAdapter } from "./payments";
import { mockExecutionAdapter } from "./execution";
import { mockSettlementAdapter } from "./settlement";

export const mockAdapters: Adapters = {
  marketData: mockMarketDataAdapter,
  kyc: mockKycAdapter,
  payments: mockPaymentsAdapter,
  execution: mockExecutionAdapter,
  settlement: mockSettlementAdapter,
};
