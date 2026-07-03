/**
 * Mock Settlement binding.
 *
 * Settles both legs on the cycle date, the demo binding from BUILD_SPEC. Uses
 * the shared business-day clock and the configured settlement cycle. In
 * production this port is filled by LCSA trade and settlement files.
 */

import { addBusinessDays } from "@/lib/ops/clock";
import { SETTLEMENT_CYCLE_DAYS } from "@/lib/config/trading";
import type {
  SettlementAdapter,
  SettlementInstruction,
  SettlementRecord,
} from "../types";

const recordsByExecutionId = new Map<string, SettlementRecord>();

export const mockSettlementAdapter: SettlementAdapter = {
  async instruct(instruction: SettlementInstruction) {
    const existing = recordsByExecutionId.get(instruction.executionId);
    if (existing) return existing;

    const record: SettlementRecord = {
      executionId: instruction.executionId,
      cycleDays: SETTLEMENT_CYCLE_DAYS,
      tradeDate: instruction.tradeDate,
      settlementDate: addBusinessDays(instruction.tradeDate, SETTLEMENT_CYCLE_DAYS),
      cashLegStatus: "settled",
      stockLegStatus: "settled",
    };
    recordsByExecutionId.set(instruction.executionId, record);
    return record;
  },

  async getStatus(executionId) {
    return recordsByExecutionId.get(executionId) ?? null;
  },
};
