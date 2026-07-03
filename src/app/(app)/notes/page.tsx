"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCustomerOrdersStore } from "@/lib/store/customer-orders";
import { buildNotesForOrders } from "@/lib/contract-notes/generate";
import {
  buildInspectorBundle,
  verifyChain,
  type ContractNote,
} from "@/lib/contract-notes/hash-chain";
import { formatZMW, formatDateZM } from "@/lib/format";

/** Characters of the sha256 hash shown as a short fingerprint. */
const SHORT_HASH_LENGTH = 12;

/** Pretty-print indentation for the exported inspector bundle. */
const BUNDLE_INDENT = 2;

function shortHash(hash: string): string {
  return `${hash.slice(0, SHORT_HASH_LENGTH)}...`;
}

/** Serialise the tamper-evident bundle and trigger a browser download. */
function downloadBundle(notes: ContractNote[]): void {
  const bundle = buildInspectorBundle(notes);
  const json = JSON.stringify(bundle, null, BUNDLE_INDENT);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "contract-notes-inspector-bundle.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

function NoteCard({ note }: { note: ContractNote }) {
  const { payload } = note;
  return (
    <Card className="border border-brand-ink/10">
      <CardContent className="py-4 px-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-brand-ink">
              Note #{note.sequential_number} - {payload.symbol}
            </p>
            <p className="text-sm text-muted-foreground">
              {payload.quantity.toLocaleString()} units
            </p>
          </div>
          <Badge variant="outline">{shortHash(note.hash)}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-y-1 text-sm">
          <span className="text-muted-foreground">Consideration</span>
          <span className="text-right tabular-nums">
            {formatZMW(payload.considerationNgwee)}
          </span>
          <span className="text-muted-foreground">Commission</span>
          <span className="text-right tabular-nums">
            {formatZMW(payload.commissionNgwee)}
          </span>
          <span className="text-muted-foreground">Stamp duty</span>
          <span className="text-right tabular-nums">
            {formatZMW(payload.stampDutyNgwee)}
          </span>
          <span className="text-muted-foreground">Trade date</span>
          <span className="text-right">{formatDateZM(payload.tradeDate)}</span>
          <span className="text-muted-foreground">Settlement date</span>
          <span className="text-right">
            {formatDateZM(payload.settlementDate)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ContractNotesPage() {
  const orders = useCustomerOrdersStore((state) => state.orders);
  const notes = buildNotesForOrders(orders);
  const integrity = verifyChain(notes);

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between gap-4">
        <h1 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Contract notes
        </h1>
        {notes.length > 0 && integrity.ok ? (
          <Badge className="bg-brand-green text-white">Chain verified</Badge>
        ) : null}
      </section>

      {notes.length === 0 ? (
        <Card className="border border-brand-ink/10">
          <CardContent className="py-10 px-5 text-center space-y-1">
            <p className="font-medium text-brand-ink">No contract notes yet</p>
            <p className="text-sm text-muted-foreground">
              Place an order and your contract note will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {notes.map((note) => (
              <NoteCard key={note.sequential_number} note={note} />
            ))}
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => downloadBundle(notes)}
          >
            Download inspector bundle
          </Button>
        </>
      )}
    </div>
  );
}
