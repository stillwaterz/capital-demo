"use client";

import { motion } from "framer-motion";

const CHAT_EXCHANGE = [
  {
    role: "user" as const,
    text: "Why did Zambeef move 2.9% today?",
  },
  {
    role: "ai" as const,
    text: "Zambeef released half-year results showing 18% revenue growth to ZMW 1.2 billion. The retail and export beef divisions drove the gain. Management kept the interim dividend at 4 ngwee per share. Analysts revised estimates upward after the announcement, which pushed buying volume higher in afternoon trading.",
  },
];

function BrowserMockup() {
  return (
    <div className="rounded-2xl border border-brand-green/30 bg-brand-ink overflow-hidden shadow-2xl">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-brand-cream/5 border-b border-brand-cream/10">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400/60" />
          <span className="w-3 h-3 rounded-full bg-yellow-400/60" />
          <span className="w-3 h-3 rounded-full bg-green-400/60" />
        </div>
        <div className="flex-1 mx-4 bg-brand-cream/10 rounded-md h-6 flex items-center px-3">
          <span className="text-[10px] text-brand-cream/40">marketlink.pranary.com/ask</span>
        </div>
      </div>
      {/* Chat content */}
      <div className="p-5 space-y-4">
        <div className="text-xs text-brand-cream/30 uppercase tracking-widest mb-3">Ask MarketLink AI</div>
        {CHAT_EXCHANGE.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "ai" && (
              <span className="w-6 h-6 rounded-full bg-brand-green flex items-center justify-center text-brand-cream text-[10px] font-bold mr-2 mt-0.5 shrink-0">M</span>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-brand-green text-brand-cream"
                  : "bg-brand-cream/10 text-brand-cream"
              }`}
            >
              {msg.text}
              {msg.role === "ai" && (
                <p className="text-[10px] text-brand-cream/40 mt-2">Source: LuSE announcement, 6 May 2026</p>
              )}
            </div>
          </div>
        ))}
        <div className="mt-2 border border-brand-cream/10 rounded-xl px-4 py-3 text-sm text-brand-cream/30">
          Ask a follow-up...
        </div>
      </div>
    </div>
  );
}

export function ProductPreviewSection() {
  return (
    <section id="preview" className="bg-brand-ink py-20 sm:py-28 px-6 sm:px-10">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-copper mb-3">
            Inside the app
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold font-display text-brand-cream">
            See the markets through AI&apos;s eyes.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <BrowserMockup />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <h3 className="text-3xl font-bold font-display text-brand-cream">
              Ask anything. Get a Zambian answer.
            </h3>
            <ul className="space-y-4">
              {[
                { label: "Conversational.", text: "Tap, type or paste a question." },
                { label: "Personalised.", text: "Knows your portfolio and your goals." },
                { label: "Cited.", text: "Every answer links back to the source news." },
              ].map((item) => (
                <li key={item.label} className="flex gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-copper mt-2.5 shrink-0" />
                  <p className="text-base text-brand-cream/80">
                    <strong className="text-brand-cream">{item.label}</strong> {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
