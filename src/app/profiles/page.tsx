"use client";

import React from "react";
import Header from "@/components/Header";
import { BookOpen, CheckCircle, Tag, ArrowRight, ShieldAlert, Cpu } from "lucide-react";

const PROFILES = [
  {
    name: "Marketing Automation",
    category: "CRM & Lifecycle",
    badge: "Klaviyo / Flow Engine",
    color: "bg-blue-100 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200",
    description: "Email automation flows, welcome series, abandoned cart sequences, SMS campaigns, customer segmentation, and trigger logic.",
    triggers: ["klaviyo", "automation flow", "welcome sequence", "abandoned cart", "sms campaign", "email newsletter", "retention flow"],
    example: "Hari: 'I will set up the post-purchase VIP replenishment email flow in Klaviyo by Thursday.'",
  },
  {
    name: "Paid Media",
    category: "Growth & Performance",
    badge: "Meta / Google / TikTok",
    color: "bg-orange-100 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200",
    description: "Paid advertising campaign builds, audience targeting, budget pacing, ad creative rotation, ROAS optimization across Meta, Google Ads, and TikTok.",
    triggers: ["meta ads", "google ads", "ad creatives", "campaign launch", "roas", "ad groups", "target audience", "ppc"],
    example: "Hari: 'I will launch the Black Friday Meta ads campaign targeting party planners by Friday.'",
  },
  {
    name: "Website",
    category: "Store Engineering",
    badge: "Shopify / Liquid / Theme",
    color: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200",
    description: "Shopify store frontend bugs, Liquid code customizations, UI/UX mobile responsive glitches, cart drawer fixes, and landing page development.",
    triggers: ["shopify", "website glitch", "hamburger menu", "mobile navigation", "liquid template", "checkout", "pdp layout", "cart drawer"],
    example: "Kannan: 'I will fix the mobile navigation drawer glitch on the Shopify store by Friday.'",
  },
  {
    name: "Content",
    category: "Editorial & Copy",
    badge: "Articles / Buying Guides",
    color: "bg-purple-100 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200",
    description: "New article copywriting, buying guides, sustainability thought leadership, recipe content, and product storytelling.",
    triggers: ["blog", "article draft", "buying guide", "copywriting", "content calendar", "storytelling", "writing"],
    example: "Freya: 'I will write a comprehensive buying guide on compostable party plates next week.'",
  },
  {
    name: "SEO & AEO",
    category: "Search & Answer Engines",
    badge: "Organic & Schema.org",
    color: "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200",
    description: "Search Engine Optimization & Answer Engine Optimization (Perplexity/ChatGPT discovery), schema markup, keyword audits, and metadata refreshes.",
    triggers: ["seo", "aeo", "schema", "schema.org", "keyword research", "organic search", "meta descriptions", "structured data"],
    example: "Govind: 'I will optimize the palm leaf plates article for search & AI visibility including schema.org by tomorrow.'",
  },
  {
    name: "Analytics & Reporting",
    category: "Data & BI",
    badge: "GA4 / Looker / Shopify Analytics",
    color: "bg-cyan-100 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200",
    description: "GA4 conversion tracking, e-commerce funnel auditing, Looker Studio dashboards, weekly analytics reports, and Attribution modeling.",
    triggers: ["analytics", "ga4", "looker studio", "conversion tracking", "weekly reporting", "funnel audit", "metrics dashboard"],
    example: "Karthik: 'I will deliver the monthly GA4 revenue attribution report by Monday.'",
  },
  {
    name: "Operations",
    category: "Supply & Logistics",
    badge: "Inventory / Pricing / B2B",
    color: "bg-slate-100 dark:bg-slate-900/40 text-slate-900 dark:text-slate-200",
    description: "Operational coordination, wholesale pricing tier alignment, supply chain spreadsheets, packaging specs, and inventory tracking.",
    triggers: ["operations", "pricing sheet", "wholesale tier", "inventory", "packaging", "supply chain", "logistics"],
    example: "Divya: 'I will share the updated wholesale pricing tier sheet with the team by Thursday.'",
  },
  {
    name: "Requires Routing",
    category: "Triage / Ambiguous",
    badge: "Fallback / Unclassified",
    color: "bg-red-100 dark:bg-red-950/40 text-red-900 dark:text-red-200",
    description: "Safe fallback for items without explicit deliverable category or crossing multiple cross-functional workstreams. Flagged for delivery manager review.",
    triggers: ["general alignment", "discussion", "unclear", "misc review"],
    example: "Unmatched task routing fallback preventing misplaced Basecamp tasks.",
  },
];

export default function ProfilesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Banner */}
        <div className="mb-8 border-b-2 border-charcoal/20 dark:border-foreground/20 pb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs font-bold uppercase tracking-widest px-2 py-0.5 bg-paper-cool dark:bg-card border border-charcoal dark:border-foreground">
              ROUTING PROFILE // SPEC V1.0 SPECIFICATION
            </span>
            <span className="font-mono text-xs text-charcoal/60 dark:text-foreground/60">
              • 8 Basecamp Lists Classification Rule Engine
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-black text-charcoal dark:text-foreground tracking-tight">
            FOOGO Green List Routing Profile<span className="text-rust">.</span>
          </h1>
          <p className="font-sans text-sm text-charcoal/80 dark:text-foreground/80 mt-2 max-w-2xl">
            In Basecamp project <strong>FOOGO Green (#29607162)</strong>, all eStride action items are deterministically routed to one of 8 approved to-do lists based on primary deliverable heuristics.
          </p>
        </div>

        {/* 8 Lists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {PROFILES.map((prof, idx) => (
            <div
              key={idx}
              className="bg-card border-2 border-charcoal dark:border-foreground p-6 shadow-brutal transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]"
            >
              <div className="flex items-center justify-between mb-3 border-b border-charcoal/15 pb-2.5">
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-charcoal/60 dark:text-foreground/60 block">
                    LIST 0{idx + 1} // {prof.category}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-charcoal dark:text-foreground">
                    {prof.name}
                  </h3>
                </div>
                <span className={`font-mono text-[10px] font-bold px-2 py-0.5 border border-charcoal ${prof.color}`}>
                  {prof.badge}
                </span>
              </div>

              <p className="font-sans text-xs text-charcoal/80 dark:text-foreground/80 leading-relaxed mb-4">
                {prof.description}
              </p>

              {/* Triggers */}
              <div className="mb-4">
                <span className="font-mono text-[10px] uppercase font-bold text-charcoal/60 dark:text-foreground/60 block mb-1">
                  Trigger Keywords & Match Patterns:
                </span>
                <div className="flex flex-wrap gap-1">
                  {prof.triggers.map((t, tidx) => (
                    <span
                      key={tidx}
                      className="px-1.5 py-0.5 bg-paper-cool dark:bg-background border border-charcoal/40 font-mono text-[10px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Example Quote */}
              <div className="p-2.5 bg-paper-cool/60 dark:bg-background/80 border border-charcoal/20 font-mono text-[11px]">
                <span className="text-rust font-bold block mb-0.5">Transcript Example:</span>
                <p className="italic text-charcoal/80 dark:text-foreground/80">{prof.example}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
