"use client";

import { useSearchParams } from "next/navigation";
import { Chat } from "@/components/chat";

export function AskPageInner() {
  const params = useSearchParams();
  const initialQuery = params.get("q") ?? undefined;
  return <Chat initialQuery={initialQuery} />;
}
