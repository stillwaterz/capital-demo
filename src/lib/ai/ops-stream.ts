import type { OpsContext, OpsMessage, OpsTask } from "@/lib/ai/ops-prompts";

type StreamParams = {
  task: OpsTask;
  context: OpsContext;
  messages: OpsMessage[];
  /** Called with the full accumulated text on each chunk. */
  onChunk: (text: string) => void;
  signal?: AbortSignal;
};

/**
 * Stream a copilot answer from the ops AI route, mirroring the customer chat
 * stream-reading pattern. Resolves with the full text. Throws on a transport
 * error so the caller can show a fallback message.
 */
export async function streamOpsAi(params: StreamParams): Promise<string> {
  const res = await fetch("/api/ai/ops", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      task: params.task,
      context: params.context,
      messages: params.messages,
    }),
    signal: params.signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    accumulated += decoder.decode(value, { stream: true });
    params.onChunk(accumulated);
  }

  return accumulated;
}
