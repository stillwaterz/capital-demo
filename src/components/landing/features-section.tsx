"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, ShieldCheck } from "lucide-react";

const CARDS = [
  {
    icon: Sparkles,
    iconColor: "text-brand-green",
    title: "AI that knows Zambia",
    body: "Daily briefings, news intelligence and real-time explainers. All in plain English. All anchored in LuSE, BoZ and ZRA context.",
  },
  {
    icon: TrendingUp,
    iconColor: "text-brand-copper",
    title: "LuSE shares, one app",
    body: "Buy and sell LuSE shares from a single wallet. Track your holdings and watch the market move in real time.",
  },
  {
    icon: ShieldCheck,
    iconColor: "text-brand-green",
    title: "Built for Zambia",
    body: "Mobile money native. NRC verification in seconds. DPA Zambia compliant. Powered by Pangaea Securities, the licensed broker.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-brand-cream py-20 sm:py-28 px-6 sm:px-10">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-copper mb-3">
            Why MarketLink
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-brand-ink leading-tight">
            Markets made intelligent.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-3xl p-8 border border-brand-ink/8 shadow-sm"
              >
                <Icon className={`w-8 h-8 ${card.iconColor} mb-5`} />
                <h3 className="text-xl font-bold font-display text-brand-ink mb-3">{card.title}</h3>
                <p className="text-base text-brand-ink/60 leading-relaxed">{card.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
