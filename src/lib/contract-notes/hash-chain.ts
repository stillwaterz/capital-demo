/**
 * Statutory contract note hash chain (BUILD_SPEC section 8).
 *
 * Every executed trade produces a numbered contract note. The notes form a
 * tamper-evident chain: each note carries a sha256 hash over its own content
 * plus the previous note's hash, so any later edit to an earlier note breaks
 * every hash downstream. Numbering is strictly sequential from 1, which lets an
 * inspector spot a missing note by a gap in the sequence.
 *
 * This module is pure deterministic domain logic. No clock, no network, no
 * React. The same inputs always produce the same hash. Money is integer ngwee.
 */

import { createHash } from "node:crypto";
import type { IsoDate, Ngwee } from "@/lib/ops/types";
import type { ContractNoteRow } from "@/lib/db/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** First sequential number in every tenant's contract note register. */
const SEQUENCE_START = 1;

/** Hash algorithm used for the chain. Do not change without a re-hash migration. */
const HASH_ALGORITHM = "sha256";

/** Digest encoding stored in the hash column. */
const HASH_ENCODING = "hex" as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The economic content of a contract note. This is what gets hashed, so the
 * shape is fixed and every field is load-bearing for the statutory record.
 */
export type ContractNotePayload = {
  /** LuSE ticker or GRZ security symbol the note settles. */
  symbol: string;
  /** Number of units bought or sold. */
  quantity: number;
  /** Price per unit, in ngwee. */
  priceNgwee: Ngwee;
  /** quantity * price, in ngwee, before commission and duty. */
  considerationNgwee: Ngwee;
  /** Brokerage commission charged, in ngwee. */
  commissionNgwee: Ngwee;
  /** Stamp duty charged, in ngwee. */
  stampDutyNgwee: Ngwee;
  /** Trade date (T), ISO calendar date. */
  tradeDate: IsoDate;
  /** Settlement date (T+n), ISO calendar date. */
  settlementDate: IsoDate;
};

/**
 * A single link in the chain. Field names align with the persisted
 * {@link ContractNoteRow} so a note maps straight onto the database row.
 */
export type ContractNote = {
  sequential_number: ContractNoteRow["sequential_number"];
  prev_hash: ContractNoteRow["prev_hash"];
  hash: ContractNoteRow["hash"];
  payload: ContractNotePayload;
};

/** Result of walking the chain and re-checking every hash and link. */
export type ChainVerification = {
  ok: boolean;
  /** Sequential number of the first note that failed, when ok is false. */
  brokenAt?: number;
};

/** One-click tamper-evident export handed to an inspector. */
export type InspectorBundle = {
  notes: ContractNote[];
  count: number;
  integrity: ChainVerification;
  /** Sequential numbers that are missing from the register. */
  gaps: number[];
};

// ---------------------------------------------------------------------------
// Canonical serialisation
// ---------------------------------------------------------------------------

/**
 * Recursively rebuild a value with object keys in a stable sorted order so the
 * serialisation does not depend on the order keys were inserted.
 */
function canonicalise(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalise);
  }
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      sorted[key] = canonicalise(source[key]);
    }
    return sorted;
  }
  return value;
}

/** Deterministic JSON string with stable key order at every depth. */
function canonicalStringify(value: unknown): string {
  return JSON.stringify(canonicalise(value));
}

// ---------------------------------------------------------------------------
// Hashing and chain construction
// ---------------------------------------------------------------------------

/**
 * Compute the sha256 hex hash for a note over the canonical serialisation of
 * the tuple (sequentialNumber, prevHash, payload). Deterministic: the same
 * inputs always yield the same hash regardless of payload key order.
 */
export function computeNoteHash(
  sequentialNumber: number,
  prevHash: string | null,
  payload: ContractNotePayload
): string {
  const canonical = canonicalStringify([sequentialNumber, prevHash, payload]);
  return createHash(HASH_ALGORITHM).update(canonical).digest(HASH_ENCODING);
}

/**
 * Produce the next note in the chain. Pure: returns a fresh object and never
 * mutates prevNote. The first note (prevNote null) starts at SEQUENCE_START
 * with a null prev_hash; every later note links to the previous note's hash.
 */
export function appendNote(
  prevNote: ContractNote | null,
  input: ContractNotePayload
): ContractNote {
  const sequentialNumber = prevNote
    ? prevNote.sequential_number + 1
    : SEQUENCE_START;
  const prevHash = prevNote ? prevNote.hash : null;
  const hash = computeNoteHash(sequentialNumber, prevHash, input);
  return {
    sequential_number: sequentialNumber,
    prev_hash: prevHash,
    hash,
    payload: input,
  };
}

// ---------------------------------------------------------------------------
// Verification and inspection
// ---------------------------------------------------------------------------

/**
 * Walk the chain in order and confirm each note's hash recomputes and its
 * prev_hash links to the prior note. Returns the first break by sequential
 * number, so tampering with any earlier payload is caught.
 */
export function verifyChain(notes: ContractNote[]): ChainVerification {
  let prevHash: string | null = null;
  for (const note of notes) {
    const expected = computeNoteHash(
      note.sequential_number,
      note.prev_hash,
      note.payload
    );
    if (note.hash !== expected || note.prev_hash !== prevHash) {
      return { ok: false, brokenAt: note.sequential_number };
    }
    prevHash = note.hash;
  }
  return { ok: true };
}

/**
 * Return the sequential numbers missing between the lowest and highest note in
 * the register. An empty register has no gaps.
 */
export function detectGaps(notes: ContractNote[]): number[] {
  if (notes.length === 0) {
    return [];
  }
  const numbers = notes.map((note) => note.sequential_number);
  const lowest = Math.min(...numbers);
  const highest = Math.max(...numbers);
  const present = new Set(numbers);
  const gaps: number[] = [];
  for (let n = lowest; n <= highest; n += 1) {
    if (!present.has(n)) {
      gaps.push(n);
    }
  }
  return gaps;
}

/**
 * Build the serialisable inspector bundle: the notes plus a chain-integrity
 * result and any sequence gaps. This is the one-click tamper-evident export.
 */
export function buildInspectorBundle(notes: ContractNote[]): InspectorBundle {
  return {
    notes,
    count: notes.length,
    integrity: verifyChain(notes),
    gaps: detectGaps(notes),
  };
}
