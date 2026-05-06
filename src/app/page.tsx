import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/hero-section";
import { LiveStrip } from "@/components/landing/live-strip";
import { FeaturesSection } from "@/components/landing/features-section";
import { ProductPreviewSection } from "@/components/landing/product-preview-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { SiteFooter } from "@/components/landing/site-footer";

export const metadata: Metadata = {
  title: "MarketLink - AI-powered investing for Zambia",
  description:
    "Buy LuSE shares and government securities. AI research, daily briefings and news intelligence. Built in Zambia, powered by Pangaea Securities.",
  openGraph: {
    title: "MarketLink - AI-powered investing for Zambia",
    description: "Buy LuSE shares and government securities. AI research, daily briefings and news intelligence. Built in Zambia, powered by Pangaea Securities.",
    siteName: "MarketLink",
    images: [{ url: "/og.svg", width: 1200, height: 630 }],
  },
};

export const revalidate = 1800;

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeroSection />
      <LiveStrip />
      <FeaturesSection />
      <ProductPreviewSection />
      <FinalCtaSection />
      <SiteFooter />
    </div>
  );
}
