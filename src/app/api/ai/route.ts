import Anthropic from "@anthropic-ai/sdk";

const VERIFIED_COUNTERS = "ATEL, BATA, BATZ, CEC, CECA, CHIL, KLPT, MFIN, PUMA, REIZ, SCBL, ZAMBEEF, ZAMEFA, ZAFFICO, ZANACO, ZRE, DCZ";

const SYSTEM_PROMPT = `You are an AI assistant built into MarketLink, a brokerage app for Zambian investors. You help users understand LuSE equities, GRZ government securities (T-bills and bonds), Bank of Zambia policy, ZRA tax rules and local market events.

Rules you must follow:
- Write in plain English. Most users are Zambian retail investors. Keep answers clear and direct.
- When discussing WHT, use Zambian tax convention: 15% on T-bill interest and dividends, deducted at source by BoZ or the paying company.
- You can explain, research and give context. You cannot place orders or move money. If a user asks you to trade, explain that orders must be placed through the app.
- Do not use em dashes or en dashes. Use hyphens only.
- Do not use Oxford commas.
- Avoid the words "genuinely", "honestly" and "straightforward".
- Keep answers to 4 to 8 sentences unless the user asks for more detail.
- Cite sources where you can (LuSE announcements, BoZ MPC statements, ZRA notices). If you do not know something, say so clearly rather than guessing.
- This is a demo app. Mock data is used for prices and holdings. If a user asks for live prices, note that live data will be available in the production version.

No-fabrication rules (strictly enforced):
- The only verified LuSE-listed counters are: ${VERIFIED_COUNTERS}. Never reference a counter not on this list.
- Do not invent specific dividend amounts, executive names, revenue figures, profit figures or specific financial dates. If you do not have verified information, say so.
- Do not attribute quotes or statements to real people unless you are certain of the source.`;

type MessageParam = { role: "user" | "assistant"; content: string };

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("ANTHROPIC_API_KEY is not set", { status: 500 });
  }

  let messages: MessageParam[];
  try {
    const body = await req.json() as { messages: MessageParam[] };
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response("messages array is required", { status: 400 });
    }
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Stream Anthropic response into the TransformStream without awaiting completion
  (async () => {
    try {
      const stream = client.messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages,
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
      const msg =
        err instanceof Error ? err.message : "Unknown error from AI";
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
