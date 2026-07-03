import { stripDashes } from "@/lib/ai/sanitize";
import Anthropic from "@anthropic-ai/sdk";

const VERIFIED_COUNTERS = "ATEL, BATA, BATZ, CEC, CECA, CHIL, KLPT, MFIN, PUMA, REIZ, SCBL, ZAMBEEF, ZAMEFA, ZAFFICO, ZANACO, ZRE, DCZ";

const BRIEFING_SYSTEM = `You are a sharp financial AI assistant for MarketLink, a Zambian investment app.

Generate a very short personalised briefing. Exactly 3 sentences. No more.

Rules:
- Address the user by first name using the greeting that matches the time of day provided. If it is morning use "Good morning", afternoon use "Good afternoon", evening use "Good evening". Never use the wrong one.
- Sentence 1: greeting with name + one notable portfolio or market fact from the context.
- Sentence 2: one relevant news or macro event from the context.
- Sentence 3: one brief practical observation. Not a command.
- Plain paragraph. No headers. No bullets. No em dashes. No Oxford commas.
- Year 9 reading level. Use only data you are given.

No-fabrication rules (strictly enforced):
- You answer only with information provided in the context. Do not invent facts.
- Do not invent dividend amounts, executive names, financial figures, specific dates or earnings.
- The only verified LuSE companies are: ${VERIFIED_COUNTERS}. Never reference a company not on this list.
- If you do not know something, say so or omit it. Do not guess.`;

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response("ANTHROPIC_API_KEY not set", { status: 500 });

  let body: {
    userName?: string;
    timeOfDay?: string;
    portfolioSummary?: string;
    newsHeadlines?: string[];
  };
  try {
    body = await req.json() as typeof body;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { userName, timeOfDay, portfolioSummary, newsHeadlines } = body;

  const contextLines: string[] = [];
  if (userName) contextLines.push(`User name: ${userName}`);
  if (timeOfDay) contextLines.push(`Current time of day: ${timeOfDay}`);
  if (portfolioSummary) contextLines.push(`Portfolio context:\n${portfolioSummary}`);
  if (newsHeadlines && newsHeadlines.length > 0) {
    contextLines.push(`Recent news headlines:\n${newsHeadlines.map((h) => `- ${h}`).join("\n")}`);
  }

  const userMessage = contextLines.length
    ? contextLines.join("\n\n") + "\n\nGenerate the daily briefing now."
    : "Generate a general daily market briefing for a Zambian investor.";

  const client = new Anthropic({ apiKey });
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    try {
      const stream = client.messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: 256,
        system: BRIEFING_SYSTEM,
        messages: [{ role: "user", content: userMessage }],
      });

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          await writer.write(encoder.encode(stripDashes(event.delta.text)));
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
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
