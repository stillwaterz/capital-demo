import Anthropic from "@anthropic-ai/sdk";
import {
  MAX_TOKENS_BY_TASK,
  withContext,
  type OpsContext,
  type OpsMessage,
  type OpsTask,
} from "@/lib/ai/ops-prompts";

const OPS_TASKS: readonly OpsTask[] = [
  "morning-briefing",
  "settlement-fail",
  "recon-break",
  "str-narrative",
];

function isOpsTask(value: unknown): value is OpsTask {
  return typeof value === "string" && OPS_TASKS.includes(value as OpsTask);
}

type OpsRequestBody = {
  task: OpsTask;
  context: OpsContext;
  messages: OpsMessage[];
};

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("ANTHROPIC_API_KEY is not set", { status: 500 });
  }

  let body: OpsRequestBody;
  try {
    const parsed = (await req.json()) as Partial<OpsRequestBody>;
    if (!isOpsTask(parsed.task)) {
      return new Response("A valid task is required", { status: 400 });
    }
    if (!parsed.context || typeof parsed.context !== "object") {
      return new Response("A context payload is required", { status: 400 });
    }
    if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) {
      return new Response("messages array is required", { status: 400 });
    }
    body = {
      task: parsed.task,
      context: parsed.context as OpsContext,
      messages: parsed.messages,
    };
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const system = withContext(body.task, body.context);
  const maxTokens = MAX_TOKENS_BY_TASK[body.task];

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Stream the Anthropic response into the TransformStream without awaiting it.
  (async () => {
    try {
      const stream = client.messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens,
        system,
        messages: body.messages,
      });

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          await writer.write(encoder.encode(event.delta.text));
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error from AI";
      await writer.write(encoder.encode(`[Error: ${msg}]`));
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
