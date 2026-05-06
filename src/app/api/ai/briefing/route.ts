import Anthropic from "@anthropic-ai/sdk";

const BRIEFING_SYSTEM = `You are a brief, sharp financial AI assistant for MarketLink, a Zambian investment app.

You are generating a personalised morning briefing for a specific user. Follow these rules exactly:
- Write 4 to 6 sentences total. No more.
- Address the user by their first name in the first sentence if provided.
- First sentence: greet and mention the portfolio overall or a notable move.
- Second or third sentence: mention one specific holding or T-bill that is relevant today.
- One sentence: reference a news item or macro event (BoZ rate, copper price, ZMW moves, LuSE announcements).
- Final sentence: one practical observation or gentle suggestion. Not a command.
- No bullet points. No headers. Plain paragraph.
- Use plain English. Year 9 reading level.
- No em dashes. No Oxford commas. No "honestly" or "genuinely".
- Do not fabricate prices you are not given. Use only what is in the context.
- End without a sign-off line.`;

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response("ANTHROPIC_API_KEY not set", { status: 500 });

  let body: {
    userName?: string;
    portfolioSummary?: string;
    newsHeadlines?: string[];
  };
  try {
    body = await req.json() as typeof body;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { userName, portfolioSummary, newsHeadlines } = body;

  const contextLines: string[] = [];
  if (userName) contextLines.push(`User name: ${userName}`);
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
          await writer.write(encoder.encode(event.delta.text));
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
