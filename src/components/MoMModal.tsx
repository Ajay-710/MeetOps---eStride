"use client";

import React, { useState } from "react";
import { MeetingExtractionResult, ActionItem } from "@/lib/types";
import { X, Copy, Mail, Check, FileText, Calendar, Users, Target } from "lucide-react";

interface MoMModalProps {
  isOpen: boolean;
  onClose: () => void;
  extraction: MeetingExtractionResult | null;
  docTitle: string;
}

export default function MoMModal({ isOpen, onClose, extraction, docTitle }: MoMModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !extraction) return null;

  const estrideDeliverables = extraction.action_items.filter((item) => !item.is_client_commitment);
  const clientCommitments = extraction.action_items.filter((item) => item.is_client_commitment);

  const generateMarkdown = () => {
    return `# MINUTES OF MEETING: ${docTitle}
**Date:** ${extraction.meeting_date || "N/A"}
**Context:** ${extraction.meeting_context} | **Type:** ${extraction.meeting_type}
**Default Project:** ${extraction.default_project}
**Attendees:** ${extraction.participants.join(", ") || "N/A"}

---

## 1. Executive Summary
${extraction.summary || "No summary recorded."}

## 2. Key Decisions & Approvals
${
  extraction.decisions && extraction.decisions.length > 0
    ? extraction.decisions.map((d) => `- ${d}`).join("\n")
    : "- No formal decisions logged."
}

## 3. eStride Deliverables & Workstreams
${
  estrideDeliverables.length > 0
    ? estrideDeliverables
        .map(
          (t) =>
            `- [ ] **${t.task}**\n  - Target: ${t.resolved_entity || extraction.default_project} | List: ${
              t.todo_list_name || "General"
            }\n  - Lead: ${t.owners.join(", ") || "Unassigned"}\n  - Due: ${t.due_date || "Pending alignment"}`
        )
        .join("\n\n")
    : "- No eStride deliverables captured."
}

## 4. Client Dependencies & Commitments
${
  clientCommitments.length > 0
    ? clientCommitments
        .map(
          (c) =>
            `- **${c.task}** (Owner: ${c.owners.join(", ") || "Client"}${
              c.due_date ? ` | Target: ${c.due_date}` : ""
            })`
        )
        .join("\n")
    : "- None identified."
}

---
*Generated via MeetOps Studio (Editorial Archive Engine)*
`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleGmailDraft = () => {
    const subject = encodeURIComponent(`Minutes of Meeting: ${docTitle} (${extraction.meeting_date})`);
    const bodyText = generateMarkdown();
    const body = encodeURIComponent(bodyText);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-background border-2 border-charcoal dark:border-foreground shadow-[8px_8px_0px_#2F3542] dark:shadow-[8px_8px_0px_#F5F2EB] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-charcoal dark:border-foreground bg-card">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-rust" />
            <div>
              <span className="font-mono text-[10px] tracking-widest uppercase text-charcoal/60 dark:text-foreground/60 block">
                MEETING MEMORANDUM // ARCHIVE REF: MOM-2026
              </span>
              <h2 className="font-serif text-lg font-bold text-charcoal dark:text-foreground line-clamp-1">
                {docTitle}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-charcoal dark:border-foreground hover:bg-rust hover:text-white transition-colors cursor-pointer"
            aria-label="Close Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 font-mono text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-paper-cool/50 dark:bg-card border border-charcoal/30 dark:border-foreground/30">
            <div>
              <span className="text-[10px] uppercase text-charcoal/60 dark:text-foreground/60 block">Date</span>
              <span className="font-bold">{extraction.meeting_date || "2026-10-06"}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-charcoal/60 dark:text-foreground/60 block">Context</span>
              <span className="font-bold">{extraction.meeting_context}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-charcoal/60 dark:text-foreground/60 block">Meeting Type</span>
              <span className="font-bold">{extraction.meeting_type}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-charcoal/60 dark:text-foreground/60 block">Default Entity</span>
              <span className="font-bold text-rust">{extraction.default_project}</span>
            </div>
          </div>

          {/* Attendees */}
          {extraction.participants && extraction.participants.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-charcoal/70 dark:text-foreground/70 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-rust" />
                Attendees & Stakeholders
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {extraction.participants.map((p, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-card border border-charcoal dark:border-foreground text-[10px] font-bold"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Executive Summary */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-charcoal/70 dark:text-foreground/70 mb-1.5">
              01 // Executive Summary
            </h4>
            <div className="p-3 bg-card border border-charcoal/30 dark:border-foreground/30 font-sans text-xs leading-relaxed text-charcoal dark:text-foreground">
              {extraction.summary}
            </div>
          </div>

          {/* Key Decisions */}
          {extraction.decisions && extraction.decisions.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-charcoal/70 dark:text-foreground/70 mb-1.5">
                02 // Strategic Decisions & Alignments
              </h4>
              <ul className="list-disc list-inside space-y-1 p-3 bg-card border border-charcoal/30 dark:border-foreground/30 font-sans text-xs text-charcoal dark:text-foreground">
                {extraction.decisions.map((dec, i) => (
                  <li key={i}>{dec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* eStride Deliverables */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-charcoal/70 dark:text-foreground/70 mb-1.5 flex items-center justify-between">
              <span>03 // eStride Internal Deliverables</span>
              <span className="text-[10px] bg-lime text-charcoal px-1.5 py-0.5 border border-charcoal font-bold">
                {estrideDeliverables.length} TASKS
              </span>
            </h4>
            <div className="space-y-2">
              {estrideDeliverables.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-card border border-charcoal dark:border-foreground flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="font-bold text-xs">{item.task}</p>
                    <p className="text-[10px] text-charcoal/60 dark:text-foreground/60 mt-0.5">
                      Target: {item.resolved_entity} // List: {item.todo_list_name || "General"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block font-bold text-[10px] text-rust">{item.owners.join(", ")}</span>
                    <span className="text-[10px] text-charcoal/50 dark:text-foreground/50">
                      {item.due_date ? `Due: ${item.due_date}` : "No date"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Client Commitments */}
          {clientCommitments.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-1.5 flex items-center justify-between">
                <span>04 // Client Dependencies (Exempt from Basecamp)</span>
                <span className="text-[10px] bg-amber-200 text-charcoal px-1.5 py-0.5 border border-charcoal font-bold">
                  {clientCommitments.length} ITEMS
                </span>
              </h4>
              <div className="space-y-1.5">
                {clientCommitments.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 text-xs flex justify-between"
                  >
                    <span>{item.task}</span>
                    <span className="font-bold text-[10px] text-amber-900 dark:text-amber-300">
                      {item.owners.join(", ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t-2 border-charcoal dark:border-foreground bg-card">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 bg-paper-cool dark:bg-background border-2 border-charcoal dark:border-foreground font-mono text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_#2F3542] hover:bg-lime hover:text-charcoal transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied Markdown!" : "Copy Markdown"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGmailDraft}
              className="flex items-center gap-1.5 px-3 py-2 bg-rust text-white border-2 border-charcoal dark:border-foreground font-mono text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_#2F3542] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Draft Client Email</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-background border-2 border-charcoal dark:border-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-paper-cool transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
