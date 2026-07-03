/**
 * Trading configuration values.
 *
 * These are config, not magic numbers. Settlement is T+3 today and moves to T+1
 * later by changing one line here (BUILD_SPEC section 9).
 */

/** Business days from trade date to settlement date. */
export const SETTLEMENT_CYCLE_DAYS = 3;

/** LuSE equities trade in whole board lots of this size. */
export const DEFAULT_BOARD_LOT = 100;
