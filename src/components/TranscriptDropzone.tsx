"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, ArrowRight, Sparkles, RefreshCw } from "lucide-react";

interface DropzoneProps {
  onProcess: (transcript: string, title: string) => void;
  isLoading: boolean;
}

const SAMPLE_FOOGO_TRANSCRIPT = `Meeting Title: FOOGO Green x eStride - Weekly Governance Call
Meeting Date: October 06, 2026
Attendees: Divya Sudalaikkan (FOOGO Green), Pradeep G (eStride), Hari Prasad (eStride), Kannan K (eStride), Govind S (eStride)

Meeting Notes & Discussion:
Divya: Welcome everyone. Let's review the upcoming Q4 push for the Shopify store. 
Pradeep: Hari, how are the Black Friday Meta ad campaigns tracking?
Hari: We have drafted the initial ad groups. I will set up the Meta ads campaign targeting eco-conscious event planners by Friday with the new autumn creatives.
Divya: Great. Also, we noticed on mobile viewports that the hamburger menu navigation gets stuck when scrolling on product detail pages.
Kannan: I checked that yesterday. I will fix the mobile navigation drawer glitch on the Shopify store by Friday.
Govind: On the SEO side, the palm leaf plates collection has dropped slightly in organic impressions. I will optimize the existing palm leaf plates article for search & AI visibility by tomorrow, including schema.org and metadata updates.
Hari: Freya will also write a new comprehensive buying guide on compostable party plates next week.
Divya: Perfect. I will share the updated wholesale pricing tier sheet with the eStride team by Thursday so we can align on B2B margins.
Pradeep: Thanks Divya. We will review the numbers once you send them over.`;

const SAMPLE_STANDUP_TRANSCRIPT = `Meeting Title: eStride Daily Standup
Meeting Date: October 06, 2026
Attendees: Pradeep G, Hari Prasad, Govind S, Karthik R, Praveen Kumar, Kannan K

Meeting Notes:
Pradeep: Good morning team. Let's do a quick round across all active accounts.
Govind: For Unifi, I will update the mutual fund portfolio breakdown component on their client dashboard by tomorrow.
Kannan: For BOLDEST, Dilip requested updates to the hero banner and brand typography on theboldest.ai website. I will complete that today.
Hari: On the eFin opportunity, we need to prepare the preliminary architecture proposal for the BOLDEST leadership team. Pradeep, can you take that?
Pradeep: Yes, I will draft the SOW architecture proposal for the eFin opportunity by Friday.
Karthik: I will finish the weekly analytics summary for all client pipelines today.`;

export default function TranscriptDropzone({ onProcess, isLoading }: DropzoneProps) {
  const [docTitle, setDocTitle] = useState("FOOGO Green x eStride - Weekly Governance Call");
  const [transcript, setTranscript] = useState(SAMPLE_FOOGO_TRANSCRIPT);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
    if (file.name.endsWith(".txt")) {
      const text = await file.text();
      setTranscript(text);
    } else if (file.name.endsWith(".docx")) {
      try {
        const mammoth = await import("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setTranscript(result.value);
      } catch (err) {
        alert("Failed to parse .docx file. You can paste the text directly.");
      }
    } else {
      alert("Please upload a .txt or .docx transcript.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-card border-2 border-charcoal dark:border-foreground shadow-brutal dark:shadow-brutal-dark p-6 transition-all">
      {/* Box Header Badge */}
      <div className="flex items-center justify-between mb-4 border-b-2 border-charcoal/20 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-rust" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal dark:text-foreground">
            01 // INGESTION & DOCUMENT SOURCE
          </span>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-charcoal/60 dark:text-foreground/60 uppercase">Preset:</span>
          <button
            onClick={() => {
              setDocTitle("FOOGO Green x eStride - Weekly Governance Call");
              setTranscript(SAMPLE_FOOGO_TRANSCRIPT);
            }}
            className="px-2 py-0.5 font-mono text-[10px] font-bold bg-paper-cool dark:bg-card border border-charcoal dark:border-foreground hover:bg-lime hover:text-charcoal transition-colors"
          >
            FOOGO Client
          </button>
          <button
            onClick={() => {
              setDocTitle("eStride Daily Standup");
              setTranscript(SAMPLE_STANDUP_TRANSCRIPT);
            }}
            className="px-2 py-0.5 font-mono text-[10px] font-bold bg-paper-cool dark:bg-card border border-charcoal dark:border-foreground hover:bg-lime hover:text-charcoal transition-colors"
          >
            eStride Standup
          </button>
        </div>
      </div>

      {/* Document Title Input */}
      <div className="mb-4">
        <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-charcoal/80 dark:text-foreground/80 mb-1">
          Meeting Title / Document Identifier
        </label>
        <input
          type="text"
          value={docTitle}
          onChange={(e) => setDocTitle(e.target.value)}
          placeholder="e.g. FOOGO Green x eStride - Weekly Governance Call"
          className="w-full px-3 py-2 bg-background border-2 border-charcoal dark:border-foreground font-mono text-xs text-charcoal dark:text-foreground focus:outline-none focus:ring-2 focus:ring-rust"
        />
      </div>

      {/* Drag & Drop File Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed border-charcoal/40 dark:border-foreground/40 p-4 text-center cursor-pointer mb-4 transition-all ${
          isDragging ? "bg-lime/20 border-rust scale-[0.99]" : "hover:bg-paper-cool/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.docx"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        />
        <div className="flex flex-col items-center justify-center gap-1">
          <Upload className="w-5 h-5 text-rust mb-1" />
          <p className="font-mono text-xs font-bold text-charcoal dark:text-foreground">
            Drop .docx or .txt transcript here, or click to browse
          </p>
          <p className="font-mono text-[10px] text-charcoal/60 dark:text-foreground/60">
            Supports Google Meet raw transcripts & Notes by Gemini
          </p>
        </div>
      </div>

      {/* Raw Transcript Area */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-charcoal/80 dark:text-foreground/80">
            Transcript Text
          </label>
          <span className="font-mono text-[10px] text-charcoal/60 dark:text-foreground/60">
            {transcript.length} characters
          </span>
        </div>
        <textarea
          rows={7}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste meeting transcript here..."
          className="w-full p-3 bg-background border-2 border-charcoal dark:border-foreground font-mono text-xs leading-relaxed text-charcoal dark:text-foreground focus:outline-none focus:ring-2 focus:ring-rust resize-y"
        />
      </div>

      {/* Action Button */}
      <button
        onClick={() => onProcess(transcript, docTitle)}
        disabled={isLoading || !transcript.trim()}
        className="w-full py-3 bg-rust text-white border-2 border-charcoal dark:border-foreground font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 cursor-pointer"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Processing Action Items...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Extract & Stage Actions</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
