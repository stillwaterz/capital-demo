/**
 * Pure business-clock module for the operations console.
 *
 * Drives every time-based ops engine (settlement, corporate actions, fees).
 * Dates are handled as ISO calendar strings ("YYYY-MM-DD"). No React, no
 * Zustand and no side effects here so engines stay deterministic and testable.
 */

import type { IsoDate } from "./types";

/** Fixed demo "today". The clock starts here and is advanced from the UI. */
export const DEMO_TODAY: IsoDate = "2026-05-29";

const MS_PER_DAY = 86_400_000;

const SATURDAY = 6;
const SUNDAY = 0;

/** Parse an ISO date string into a UTC Date at midnight. */
function parseIsoDate(date: IsoDate): Date {
  const [year, month, day] = date.split("-").map((part) => Number(part));
  return new Date(Date.UTC(year, month - 1, day));
}

/** Format a UTC Date back into an ISO calendar date string. */
function toIsoDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

/** True when the date falls on a Saturday or Sunday. */
export function isWeekend(date: IsoDate): boolean {
  const day = parseIsoDate(date).getUTCDay();
  return day === SATURDAY || day === SUNDAY;
}

/** True when the date is a business day (currently weekends only, no holidays). */
export function isBusinessDay(date: IsoDate): boolean {
  return !isWeekend(date);
}

/**
 * Add n business days to a date, skipping Saturdays and Sundays.
 * Negative n walks backwards. n of 0 returns the same date.
 */
export function addBusinessDays(date: IsoDate, n: number): IsoDate {
  if (n === 0) return date;
  const step = n > 0 ? 1 : -1;
  let remaining = Math.abs(n);
  let cursor = parseIsoDate(date);
  while (remaining > 0) {
    cursor = new Date(cursor.getTime() + step * MS_PER_DAY);
    if (isBusinessDay(toIsoDate(cursor))) {
      remaining -= 1;
    }
  }
  return toIsoDate(cursor);
}

/** Settlement date for a trade is T+1 business day. */
export function nextSettlementDate(tradeDate: IsoDate): IsoDate {
  return addBusinessDays(tradeDate, 1);
}

/** Advance to the next business day from the given date. */
export function nextBusinessDay(date: IsoDate): IsoDate {
  return addBusinessDays(date, 1);
}

/** -1 if a is before b, 1 if a is after b, 0 if equal. */
export function compareDates(a: IsoDate, b: IsoDate): -1 | 0 | 1 {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function isBefore(a: IsoDate, b: IsoDate): boolean {
  return a < b;
}

export function isAfter(a: IsoDate, b: IsoDate): boolean {
  return a > b;
}

export function isSameDay(a: IsoDate, b: IsoDate): boolean {
  return a === b;
}

/** True when settlement is due on or before the current business date. */
export function isSettlementDue(settlementDate: IsoDate, today: IsoDate): boolean {
  return settlementDate <= today;
}
