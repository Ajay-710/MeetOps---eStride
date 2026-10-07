import type { Metadata } from "next";
import { Playfair_Display, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MeetOps Studio | Meeting Execution & Basecamp Automation",
  description:
    "Editorial Meeting Intelligence Studio for eStride. Bridges raw meeting transcripts into Basecamp to-dos and client MoMs with human-in-the-loop triage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${jetbrainsMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-rust selection:text-white">
        {/* Background Paper Grid Overlay */}
        <div
          aria-hidden="true"
          className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none"
        >
          <div className="absolute inset-0 paper-grid opacity-75 dark:opacity-35" />
          <div className="absolute top-3 left-4 text-charcoal/20 dark:text-foreground/20 font-mono text-[10px] tracking-widest hidden sm:block">
            ┌ 001 // MEETOPS_STUDIO // 2026
          </div>
          <div className="absolute top-3 right-4 text-charcoal/20 dark:text-foreground/20 font-mono text-[10px] tracking-widest hidden sm:block">
            GRID_ALIGN: 12_COL ┐
          </div>
          <div className="absolute bottom-3 left-4 text-charcoal/20 dark:text-foreground/20 font-mono text-[10px] tracking-widest hidden sm:block">
            └ ESTRIDE // AUTOMATION_ENGINE
          </div>
          <div className="absolute bottom-3 right-4 text-charcoal/20 dark:text-foreground/20 font-mono text-[10px] tracking-widest hidden sm:block">
            [50° 04′ N, 14° 26′ E] ┘
          </div>
          <div className="absolute top-1/4 left-8 text-charcoal/15 dark:text-foreground/15 font-mono text-sm hidden md:block">
            +
          </div>
          <div className="absolute top-1/2 right-12 text-charcoal/15 dark:text-foreground/15 font-mono text-sm hidden md:block">
            +
          </div>
          <div className="absolute top-3/4 left-16 text-charcoal/15 dark:text-foreground/15 font-mono text-sm hidden md:block">
            +
          </div>
        </div>

        {/* Application Content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
