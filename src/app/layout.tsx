import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Capital - Invest in Zambia",
  description:
    "Buy LuSE equities and GRZ T-bills. AI-powered research for Zambian investors.",
  openGraph: {
    title: "Capital - Invest in Zambia",
    description: "Buy LuSE equities and GRZ T-bills. AI-powered research for Zambian investors.",
    siteName: "Capital",
    images: [{ url: "/og.svg", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        <Nav />
        <main className="flex-1 container mx-auto max-w-3xl px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
