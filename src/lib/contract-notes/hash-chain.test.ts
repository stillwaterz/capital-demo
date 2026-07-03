import { describe, it, expect } from "vitest";
import type { ContractNote, ContractNotePayload } from "./hash-chain";
import {
  appendNote,
  buildInspectorBundle,
  computeNoteHash,
  detectGaps,
  verifyChain,
} from "./hash-chain";

/** Build a payload with sensible defaults so tests state only what matters. */
function makePayload(
  overrides: Partial<ContractNotePayload> = {}
): ContractNotePayload {
  return {
    symbol: "ZANACO",
    quantity: 1_000,
    priceNgwee: 250,
    considerationNgwee: 250_000,
    commissionNgwee: 3_125,
    stampDutyNgwee: 375,
    tradeDate: "2026-07-01",
    settlementDate: "2026-07-03",
    ...overrides,
  };
}

/** Build a valid chain of n notes from a null genesis. */
function buildChain(count: number): ContractNote[] {
  const notes: ContractNote[] = [];
  let prev: ContractNote | null = null;
  for (let i = 0; i < count; i += 1) {
    const note = appendNote(prev, makePayload({ symbol: `SYM${i}` }));
    notes.push(note);
    prev = note;
  }
  return notes;
}

describe("computeNoteHash", () => {
  it("is stable for the same input", () => {
    const payload = makePayload();
    const first = computeNoteHash(1, null, payload);
    const second = computeNoteHash(1, null, payload);
    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is independent of payload key insertion order", () => {
    const insertedOneWay: ContractNotePayload = {
      symbol: "CEC",
      quantity: 500,
      priceNgwee: 400,
      considerationNgwee: 200_000,
      commissionNgwee: 2_500,
      stampDutyNgwee: 300,
      tradeDate: "2026-07-01",
      settlementDate: "2026-07-03",
    };
    const insertedOtherWay: ContractNotePayload = {
      settlementDate: "2026-07-03",
      tradeDate: "2026-07-01",
      stampDutyNgwee: 300,
      commissionNgwee: 2_500,
      considerationNgwee: 200_000,
      priceNgwee: 400,
      quantity: 500,
      symbol: "CEC",
    };
    expect(computeNoteHash(2, "abc", insertedOneWay)).toBe(
      computeNoteHash(2, "abc", insertedOtherWay)
    );
  });

  it("changes when any field changes", () => {
    const base = computeNoteHash(1, null, makePayload());
    expect(computeNoteHash(1, null, makePayload({ quantity: 999 }))).not.toBe(
      base
    );
    expect(computeNoteHash(2, null, makePayload())).not.toBe(base);
    expect(computeNoteHash(1, "prev", makePayload())).not.toBe(base);
  });
});

describe("appendNote", () => {
  it("starts numbering at 1 with a null prev_hash", () => {
    const first = appendNote(null, makePayload());
    expect(first.sequential_number).toBe(1);
    expect(first.prev_hash).toBeNull();
    expect(first.hash).toBe(computeNoteHash(1, null, first.payload));
  });

  it("increments the number and links to the previous hash", () => {
    const first = appendNote(null, makePayload());
    const second = appendNote(first, makePayload({ symbol: "MTN" }));
    expect(second.sequential_number).toBe(2);
    expect(second.prev_hash).toBe(first.hash);
    expect(second.hash).toBe(
      computeNoteHash(2, first.hash, second.payload)
    );
  });

  it("does not mutate the previous note", () => {
    const first = appendNote(null, makePayload());
    const snapshot = { ...first };
    appendNote(first, makePayload());
    expect(first).toEqual(snapshot);
  });
});

describe("verifyChain", () => {
  it("accepts a valid chain", () => {
    expect(verifyChain(buildChain(5))).toEqual({ ok: true });
  });

  it("accepts an empty chain", () => {
    expect(verifyChain([])).toEqual({ ok: true });
  });

  it("breaks at the tampered note when a payload is mutated", () => {
    const notes = buildChain(5);
    const tampered = notes.map((note) => ({ ...note }));
    // Edit the payload of note 3 without recomputing its hash.
    tampered[2] = {
      ...tampered[2],
      payload: { ...tampered[2].payload, priceNgwee: 999_999 },
    };
    const result = verifyChain(tampered);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(3);
  });

  it("breaks when a prev_hash link is rewritten", () => {
    const notes = buildChain(4);
    const tampered = notes.map((note) => ({ ...note }));
    tampered[3] = { ...tampered[3], prev_hash: "deadbeef" };
    const result = verifyChain(tampered);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(4);
  });
});

describe("detectGaps", () => {
  it("finds a missing sequential number", () => {
    const notes = buildChain(4);
    const withGap = [notes[0], notes[1], notes[3]];
    expect(detectGaps(withGap)).toEqual([3]);
  });

  it("reports no gaps for a complete sequence", () => {
    expect(detectGaps(buildChain(6))).toEqual([]);
  });

  it("reports no gaps for an empty register", () => {
    expect(detectGaps([])).toEqual([]);
  });

  it("finds several missing numbers", () => {
    const notes = buildChain(6);
    const withGaps = [notes[0], notes[2], notes[5]];
    expect(detectGaps(withGaps)).toEqual([2, 4, 5]);
  });
});

describe("buildInspectorBundle", () => {
  it("reports integrity and gaps for a healthy register", () => {
    const notes = buildChain(3);
    const bundle = buildInspectorBundle(notes);
    expect(bundle.count).toBe(3);
    expect(bundle.integrity).toEqual({ ok: true });
    expect(bundle.gaps).toEqual([]);
    expect(bundle.notes).toBe(notes);
  });

  it("surfaces a broken chain and any gaps together", () => {
    const notes = buildChain(4);
    const damaged = [notes[0], notes[1], notes[3]].map((note) => ({
      ...note,
    }));
    damaged[1] = {
      ...damaged[1],
      payload: { ...damaged[1].payload, commissionNgwee: 1 },
    };
    const bundle = buildInspectorBundle(damaged);
    expect(bundle.integrity.ok).toBe(false);
    expect(bundle.integrity.brokenAt).toBe(2);
    expect(bundle.gaps).toEqual([3]);
  });

  it("is serialisable to JSON without loss", () => {
    const bundle = buildInspectorBundle(buildChain(2));
    const roundTripped = JSON.parse(JSON.stringify(bundle));
    expect(roundTripped.count).toBe(2);
    expect(roundTripped.integrity.ok).toBe(true);
  });
});
