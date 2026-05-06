"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LandingNav } from "./landing-nav";
import { PhoneMockup } from "./phone-mockup";

const FADE_UP = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: "easeOut" as const, delay },
});

const FLOAT = {
  animate: { y: [0, -5, 0] },
  transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const },
};

const FLOAT_SLOW = {
  animate: { y: [0, -3, 0] },
  transition: { duration: 5, repeat: Infinity, ease: "easeInOut" as const, delay: 1.5 },
};

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] sm:min-h-screen bg-brand-ink overflow-hidden flex flex-col">
      {/* Gradient blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-brand-green/10 blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-brand-copper/10 blur-3xl pointer-events-none" />

      <LandingNav />

      <div className="flex-1 flex items-center">
        <div className="container mx-auto max-w-6xl px-6 sm:px-10 grid grid-cols-1 sm:grid-cols-2 gap-12 sm:gap-8 items-center pt-16 pb-12 sm:py-20">
          {/* Left: copy */}
          <div className="text-center sm:text-left order-2 sm:order-1">
            <motion.p {...FADE_UP(0.0)} className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-copper mb-4">
              Built in Zambia
            </motion.p>
            <motion.h1 {...FADE_UP(0.1)} className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display text-brand-cream leading-[1.05] tracking-tight mb-5">
              Where Zambia invests.
            </motion.h1>
            <motion.p {...FADE_UP(0.2)} className="text-lg sm:text-xl text-brand-cream/70 max-w-xl mb-8 leading-relaxed mx-auto sm:mx-0">
              AI-powered access to LuSE shares and government securities. Real-time research, daily briefings and news intelligence in plain English.
            </motion.p>
            <motion.div {...FADE_UP(0.3)} className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-14 px-8 text-lg font-semibold bg-brand-green hover:bg-brand-green-light text-brand-cream rounded-xl transition-colors"
              >
                Get started for free
              </Link>
              <a
                href="#preview"
                className="inline-flex items-center justify-center h-14 px-8 text-lg font-medium border border-brand-cream/30 hover:border-brand-cream/60 text-brand-cream rounded-xl transition-colors"
              >
                See it live
              </a>
            </motion.div>
            <motion.p {...FADE_UP(0.4)} className="text-xs text-brand-cream/40 mt-4">
              Licensed via Pangaea Securities. DPA Zambia compliant.
            </motion.p>
          </div>

          {/* Right: phone mockup + floating cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" as const }}
            className="relative order-1 sm:order-2 flex items-center justify-center"
          >
            <PhoneMockup />

            {/* Floating card: BoZ notification */}
            <motion.div
              {...FLOAT}
              className="absolute -top-4 -left-2 sm:-left-8 bg-brand-cream rounded-2xl shadow-xl px-4 py-3 max-w-[180px]"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-brand-green">AI Alert</span>
              </div>
              <p className="text-xs font-medium text-brand-ink leading-snug">BoZ held rates at 13.5%</p>
            </motion.div>

            {/* Floating card: AI chat */}
            <motion.div
              {...FLOAT_SLOW}
              className="absolute -bottom-2 -right-2 sm:-right-6 bg-brand-ink border border-brand-green/20 rounded-2xl shadow-xl px-4 py-3 max-w-[190px]"
            >
              <p className="text-[10px] text-brand-cream/60 mb-1">You asked:</p>
              <p className="text-xs font-medium text-brand-cream leading-snug">Why did Zambeef move today?</p>
            </motion.div>

            {/* Floating badge: auto-roll */}
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" as const, delay: 0.7 }}
              className="absolute top-1/2 -left-4 sm:-left-12 -translate-y-1/2 flex items-center gap-1.5 bg-brand-green text-brand-cream rounded-full px-3 py-1.5 shadow-lg text-xs font-semibold"
            >
              <span>✓</span> Auto-roll on
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
