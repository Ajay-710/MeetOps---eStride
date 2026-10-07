"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import Header from "@/components/Header";
import TranscriptDropzone from "@/components/TranscriptDropzone";
import TaskCard from "@/components/TaskCard";
import MoMModal from "@/components/MoMModal";
import { ActionItem, MeetingExtractionResult } from "@/lib/types";
import {
  Sparkles,
  Send,
  Plus,
  FileCheck2,
  Calendar,
  Building,
  Users2,
  CheckCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  Key,
  X,
  ExternalLink,
  ShieldCheck,
  LogOut,
} from "lucide-react";

export default function HomePage() {
  const [model, setModel] = useState<"gemini" | "ollama" | "demo">("gemini");
  const [docTitle, setDocTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filter, setFilter] = useState<"all" | "estride" | "client">("all");
  const [extraction, setExtraction] = useState<MeetingExtractionResult | null>(null);
  const [isMoMOpen, setIsMoMOpen] = useState(false);
  const [syncSummary, setSyncSummary] = useState<{
    syncedCount: number;
    message: string;
  } | null>(null);

  // Basecamp OAuth State
  const [isBasecampConnected, setIsBasecampConnected] = useState(false);
  const [hasServerOAuthConfig, setHasServerOAuthConfig] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [clientIdInput, setClientIdInput] = useState("");
  const [clientSecretInput, setClientSecretInput] = useState("");
  const [registryProjects, setRegistryProjects] = useState<any[]>([]);

  // Check Basecamp connection status & load dynamic registry on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/auth/basecamp/status");
        if (res.ok) {
          const data = await res.json();
          setIsBasecampConnected(Boolean(data.connected));
          setHasServerOAuthConfig(Boolean(data.hasConfig));
        }
      } catch (e) {
        console.warn("Could not check Basecamp auth status:", e);
      }
    };
    checkStatus();

    const loadRegistry = async () => {
      try {
        const res = await fetch("/api/registry");
        if (res.ok) {
          const json = await res.json();
          if (json.data?.projects) {
            setRegistryProjects(json.data.projects);
          }
        }
      } catch (e) {
        console.warn("Could not load registry in studio:", e);
      }
    };
    loadRegistry();

    // Check query params for OAuth return
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("basecamp_connected") === "true") {
        setIsBasecampConnected(true);
        setSyncSummary({
          syncedCount: 0,
          message: "✓ Successfully connected to Basecamp 3! Account #5463662 is active.",
        });
        confetti({
          particleCount: 60,
          spread: 50,
          origin: { y: 0.6 },
          colors: ["#C84B31", "#CEFF1A", "#2F3542"],
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (urlParams.get("basecamp_error")) {
        alert(`Basecamp Connection Error: ${urlParams.get("basecamp_error")}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Initiate OAuth redirect
  const handleInitiateOAuth = () => {
    if (hasServerOAuthConfig) {
      window.location.href = "/api/auth/basecamp";
    } else {
      setIsConnectModalOpen(true);
    }
  };

  // Disconnect Basecamp
  const handleDisconnect = async () => {
    try {
      await fetch("/api/auth/basecamp/status", { method: "POST" });
      setIsBasecampConnected(false);
      alert("Disconnected from Basecamp.");
    } catch (e) {
      console.error(e);
    }
  };

  // Ingest transcript and run extraction + routing
  const handleProcessTranscript = async (transcript: string, title: string) => {
    setIsLoading(true);
    setSyncSummary(null);
    setDocTitle(title);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          docTitle: title,
          model,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process meeting.");
      }

      setExtraction(data.extraction);
    } catch (err: any) {
      alert(`Extraction Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update a single task in local state
  const handleUpdateTask = (updated: ActionItem) => {
    if (!extraction) return;
    setExtraction({
      ...extraction,
      action_items: extraction.action_items.map((item) =>
        item.id === updated.id ? updated : item
      ),
    });
  };

  // Delete a single task
  const handleDeleteTask = (id: string) => {
    if (!extraction) return;
    setExtraction({
      ...extraction,
      action_items: extraction.action_items.filter((item) => item.id !== id),
    });
  };

  // Add manual task
  const handleAddTask = () => {
    if (!extraction) return;
    const newTask: ActionItem = {
      id: `manual-${Date.now()}`,
      task: "New Staged Action Item",
      owners: ["Pradeep G"],
      due_date: extraction.meeting_date || null,
      resolved_entity: extraction.default_project || "eStride Digital",
      resolved_bc_project: "eStride",
      resolved_bc_project_id: "5463662",
      todo_list_name: extraction.default_project === "FOOGO Green" ? "Website" : "General",
      is_client_commitment: false,
      is_pipeline: false,
      is_inactive: false,
      sync_status: "POST",
    };
    setExtraction({
      ...extraction,
      action_items: [newTask, ...extraction.action_items],
    });
  };

  // Trigger Real Basecamp Sync (Exact same behavior as n8n)
  const handleSyncBasecamp = async () => {
    if (!extraction) return;
    const itemsToSync = extraction.action_items.filter(
      (item) => !item.is_client_commitment && item.sync_status !== "IGNORED"
    );

    if (itemsToSync.length === 0) {
      alert("No valid eStride action items selected for Basecamp sync.");
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch("/api/basecamp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: itemsToSync,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.missingToken) {
          handleInitiateOAuth();
          return;
        }
        throw new Error(data.error || "Sync execution failed.");
      }

      // Mark items as synced
      setExtraction({
        ...extraction,
        action_items: extraction.action_items.map((item) => {
          if (!item.is_client_commitment && item.sync_status !== "IGNORED") {
            return { ...item, sync_status: "SYNCED" };
          }
          return item;
        }),
      });

      setSyncSummary({
        syncedCount: data.syncedCount,
        message: `Successfully posted ${data.syncedCount} action item(s) directly to Basecamp account #5463662.`,
      });

      // Fire celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#C84B31", "#CEFF1A", "#2F3542"],
      });
    } catch (err: any) {
      alert(`Basecamp Sync Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter tasks
  const visibleTasks = (extraction?.action_items || []).filter((item) => {
    if (filter === "estride") return !item.is_client_commitment;
    if (filter === "client") return item.is_client_commitment;
    return true;
  });

  const estrideCount = (extraction?.action_items || []).filter(
    (item) => !item.is_client_commitment
  ).length;
  const clientCount = (extraction?.action_items || []).filter(
    (item) => item.is_client_commitment
  ).length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        currentModel={model}
        onModelChange={setModel}
        activeMeetingCount={extraction ? 1 : 0}
      />

      {/* Main Studio Work Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Studio Banner / Headline */}
        <div className="mb-8 border-b-2 border-charcoal/20 dark:border-foreground/20 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-black text-charcoal dark:text-foreground tracking-tight">
              Meeting Action Staging Studio<span className="text-rust">.</span>
            </h1>
            <p className="font-mono text-xs text-charcoal/60 dark:text-foreground/60 mt-1">
              Automated meeting intelligence • 10 Projects • 8 FOOGO Lists • Direct Basecamp Sync
            </p>
          </div>

          {/* Basecamp Connection Status */}
          <div className="flex items-center gap-3">
            {isBasecampConnected ? (
              <div className="flex items-center gap-2 p-1.5 bg-card border-2 border-charcoal dark:border-foreground font-mono text-xs shadow-[2px_2px_0px_#2F3542]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  Basecamp Connected (#5463662)
                </span>
                <button
                  onClick={handleDisconnect}
                  className="p-1 hover:bg-paper-cool text-charcoal/50 hover:text-rust transition-colors cursor-pointer"
                  title="Disconnect Basecamp"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleInitiateOAuth}
                className="flex items-center gap-2 px-3.5 py-2 bg-card border-2 border-charcoal dark:border-foreground font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#2F3542] hover:bg-lime hover:text-charcoal transition-all cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-rust" />
                <span>Connect Basecamp</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync Summary Alert */}
        {syncSummary && (
          <div className="mb-6 p-4 bg-emerald-100 dark:bg-emerald-950/40 border-2 border-emerald-600 text-charcoal dark:text-emerald-100 font-mono text-xs shadow-brutal flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold">{syncSummary.message}</span>
            </div>
            <button
              onClick={() => setSyncSummary(null)}
              className="px-2 py-1 bg-background border border-charcoal text-[10px] font-bold uppercase hover:bg-paper-cool cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Input Dropzone & Meeting Metadata (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <TranscriptDropzone
              onProcess={handleProcessTranscript}
              isLoading={isLoading}
            />

            {/* Resolved Meeting Context Card */}
            {extraction && (
              <div className="bg-card border-2 border-charcoal dark:border-foreground p-6 shadow-brutal transition-all animate-in fade-in">
                <div className="flex items-center justify-between mb-4 border-b border-charcoal/20 pb-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-rust" />
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal dark:text-foreground">
                      02 // PARSED METRIC & CONTEXT
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMoMOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-lime text-charcoal border border-charcoal font-mono text-[11px] font-bold uppercase shadow-[2px_2px_0px_#2F3542] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>View MoM</span>
                  </button>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between py-1 border-b border-charcoal/10">
                    <span className="text-charcoal/60 dark:text-foreground/60">Meeting Title:</span>
                    <span className="font-bold text-right truncate max-w-[200px]" title={docTitle}>
                      {docTitle}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-charcoal/10">
                    <span className="text-charcoal/60 dark:text-foreground/60">Grounding Date:</span>
                    <span className="font-bold">{extraction.meeting_date || "2026-10-06"}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-charcoal/10">
                    <span className="text-charcoal/60 dark:text-foreground/60">Meeting Context:</span>
                    <span className="font-bold text-rust">{extraction.meeting_context}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-charcoal/10">
                    <span className="text-charcoal/60 dark:text-foreground/60">Default Project:</span>
                    <span className="font-bold">{extraction.default_project}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-charcoal/10">
                    <span className="text-charcoal/60 dark:text-foreground/60">Call Nature:</span>
                    <span className="font-bold">{extraction.meeting_type}</span>
                  </div>

                  {extraction.decisions && extraction.decisions.length > 0 && (
                    <div className="pt-2">
                      <span className="text-charcoal/60 dark:text-foreground/60 block mb-1">
                        Key Alignments ({extraction.decisions.length}):
                      </span>
                      <ul className="list-disc list-inside space-y-1 font-sans text-xs text-charcoal/90 dark:text-foreground/90">
                        {extraction.decisions.slice(0, 3).map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Review & Staging Studio (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="bg-card border-2 border-charcoal dark:border-foreground p-6 shadow-brutal transition-all">
              {/* Studio Header & Counters */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b-2 border-charcoal/20 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rust" />
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal dark:text-foreground">
                      03 // ACTION STAGING STUDIO
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-charcoal/60 dark:text-foreground/60 mt-0.5">
                    {extraction
                      ? `${estrideCount} eStride Deliverable(s) • ${clientCount} Client Commitment(s)`
                      : "Awaiting transcript ingestion..."}
                  </p>
                </div>

                {/* Filter Pills */}
                {extraction && (
                  <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                    <button
                      onClick={() => setFilter("all")}
                      className={`px-2.5 py-1 border border-charcoal transition-all cursor-pointer ${
                        filter === "all"
                          ? "bg-charcoal text-white dark:bg-foreground dark:text-charcoal"
                          : "bg-background text-charcoal dark:text-foreground hover:bg-paper-cool"
                      }`}
                    >
                      All ({extraction.action_items.length})
                    </button>
                    <button
                      onClick={() => setFilter("estride")}
                      className={`px-2.5 py-1 border border-charcoal transition-all cursor-pointer ${
                        filter === "estride"
                          ? "bg-rust text-white"
                          : "bg-background text-charcoal dark:text-foreground hover:bg-paper-cool"
                      }`}
                    >
                      eStride ({estrideCount})
                    </button>
                    <button
                      onClick={() => setFilter("client")}
                      className={`px-2.5 py-1 border border-charcoal transition-all cursor-pointer ${
                        filter === "client"
                          ? "bg-amber-400 text-charcoal"
                          : "bg-background text-charcoal dark:text-foreground hover:bg-paper-cool"
                      }`}
                    >
                      Client ({clientCount})
                    </button>
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              {extraction && (
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 bg-paper-cool/60 dark:bg-background/80 border border-charcoal/30">
                  <button
                    onClick={handleAddTask}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-charcoal font-mono text-xs font-bold hover:bg-lime hover:text-charcoal transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Manual Task</span>
                  </button>

                  <button
                    onClick={handleSyncBasecamp}
                    disabled={isSyncing || estrideCount === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-rust text-white border-2 border-charcoal font-mono text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_#2F3542] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSyncing ? "animate-pulse" : ""}`} />
                    <span>
                      {isSyncing ? "Posting to Basecamp..." : `Post to Basecamp (${estrideCount} Tasks)`}
                    </span>
                  </button>
                </div>
              )}

              {/* Action Items List */}
              {extraction ? (
                visibleTasks.length > 0 ? (
                  <div className="space-y-4">
                    {visibleTasks.map((item, idx) => (
                      <TaskCard
                        key={item.id}
                        item={item}
                        index={idx}
                        availableProjects={registryProjects.length > 0 ? registryProjects : undefined}
                        onUpdate={handleUpdateTask}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border-2 border-dashed border-charcoal/20">
                    <p className="font-mono text-xs text-charcoal/60 dark:text-foreground/60">
                      No action items match the selected filter.
                    </p>
                  </div>
                )
              ) : (
                /* Empty Staging State */
                <div className="py-16 px-6 text-center border-2 border-dashed border-charcoal/20 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-paper-cool dark:bg-background border-2 border-charcoal dark:border-foreground flex items-center justify-center mb-4 shadow-[3px_3px_0px_#2F3542] dark:shadow-[3px_3px_0px_#F5F2EB]">
                    <Sparkles className="w-6 h-6 text-rust" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-charcoal dark:text-foreground mb-1">
                    No Meeting Loaded
                  </h3>
                  <p className="font-mono text-xs text-charcoal/60 dark:text-foreground/60 max-w-sm mb-4">
                    Choose a preset or drop your transcript on the left to extract action items, ground dates, and route to Basecamp.
                  </p>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-rust font-bold">
                    <span>Try Preset: "FOOGO Client" or "eStride Standup"</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Basecamp OAuth Setup Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-background border-2 border-charcoal dark:border-foreground p-6 shadow-[8px_8px_0px_#2F3542] dark:shadow-[8px_8px_0px_#F5F2EB]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-charcoal/20">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-rust" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-charcoal dark:text-foreground">
                  Connect Basecamp 3 (Launchpad OAuth)
                </h3>
              </div>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="p-1 border border-charcoal hover:bg-rust hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="font-sans text-xs text-charcoal/80 dark:text-foreground/80 mb-3 leading-relaxed">
              Add your 37signals Basecamp credentials below to enable 1-click authorization with Account <strong>#5463662</strong>.
            </p>

            <div className="space-y-3 font-mono text-xs mb-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-charcoal/70 mb-1">
                  Basecamp Client ID
                </label>
                <input
                  type="text"
                  placeholder="Paste Client ID..."
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  className="w-full px-3 py-2 bg-card border-2 border-charcoal dark:border-foreground focus:outline-none focus:ring-1 focus:ring-rust"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-charcoal/70 mb-1">
                  Basecamp Client Secret
                </label>
                <input
                  type="password"
                  placeholder="Paste Client Secret..."
                  value={clientSecretInput}
                  onChange={(e) => setClientSecretInput(e.target.value)}
                  className="w-full px-3 py-2 bg-card border-2 border-charcoal dark:border-foreground focus:outline-none focus:ring-1 focus:ring-rust"
                />
              </div>

              <div className="p-2.5 bg-paper-cool border border-charcoal/30 text-[10px] text-charcoal/70">
                <span className="font-bold block mb-0.5">Redirect URI for your Basecamp App:</span>
                <code className="text-rust break-all">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/api/auth/basecamp/callback`
                    : "http://localhost:3000/api/auth/basecamp/callback"}
                </code>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-charcoal/60">
                Tip: You can also set these in <code className="font-bold">.env.local</code>
              </span>
              <button
                onClick={() => {
                  if (!clientIdInput) {
                    alert("Please provide your Basecamp Client ID.");
                    return;
                  }
                  window.location.href = `/api/auth/basecamp?client_id=${encodeURIComponent(
                    clientIdInput
                  )}`;
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-rust text-white border-2 border-charcoal font-mono text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_#2F3542] hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer"
              >
                <span>Authorize on Basecamp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MoM Modal */}
      <MoMModal
        isOpen={isMoMOpen}
        onClose={() => setIsMoMOpen(false)}
        extraction={extraction}
        docTitle={docTitle}
      />
    </div>
  );
}
