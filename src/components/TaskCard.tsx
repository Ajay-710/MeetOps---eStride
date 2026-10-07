"use client";

import React, { useState } from "react";
import { ActionItem, ProjectEntity } from "@/lib/types";
import { INITIAL_PROJECTS, FOOGO_APPROVED_LISTS, TEAM_MEMBERS } from "@/lib/defaultRegistry";
import {
  Calendar,
  User,
  FolderGit2,
  ListTodo,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
} from "lucide-react";

interface TaskCardProps {
  item: ActionItem;
  index: number;
  availableProjects?: ProjectEntity[];
  onUpdate: (updated: ActionItem) => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({
  item,
  index,
  availableProjects = INITIAL_PROJECTS,
  onUpdate,
  onDelete,
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const handleFieldChange = (field: keyof ActionItem, value: any) => {
    const updated = { ...item, [field]: value };
    // If project changed, adjust routing hints
    if (field === "resolved_entity") {
      const proj = availableProjects.find((p) => p.entity_name === value) || INITIAL_PROJECTS.find((p) => p.entity_name === value);
      if (proj) {
        updated.is_pipeline = proj.status === "Pipeline";
        updated.is_inactive = proj.status === "Inactive";
        updated.resolved_bc_project =
          proj.status === "Pipeline" || proj.status === "Inactive" || !proj.basecamp_project_name
            ? "eStride"
            : proj.basecamp_project_name;
        updated.resolved_bc_project_id = proj.basecamp_project_id || "5463662";

        // Auto-assign list if FOOGO
        if (value === "FOOGO Green" && (!item.todo_list_name || !FOOGO_APPROVED_LISTS.includes(item.todo_list_name))) {
          updated.todo_list_name = "Requires Routing";
        }
      }
    }
    onUpdate(updated);
  };

  const isClient = item.is_client_commitment;
  const isPipeline = item.is_pipeline;
  const isInactive = item.is_inactive;
  const isSynced = item.sync_status === "SYNCED";

  return (
    <div
      className={`border-2 border-charcoal dark:border-foreground transition-all duration-200 bg-card p-4 sm:p-5 mb-4 shadow-brutal hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#2F3542] dark:hover:shadow-[5px_5px_0px_#F5F2EB] ${
        isClient ? "border-dashed bg-amber-50/40 dark:bg-amber-950/20" : ""
      } ${isSynced ? "border-green-600 bg-green-50/30 dark:bg-green-950/20" : ""}`}
    >
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-charcoal/15 dark:border-foreground/15">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-paper-cool dark:bg-background border border-charcoal dark:border-foreground">
            #{String(index + 1).padStart(2, "0")}
          </span>

          {/* Sync Status Badge */}
          {isSynced ? (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 bg-emerald-500 text-white border border-charcoal">
              <CheckCircle2 className="w-3 h-3" />
              SYNCED_BASECAMP
            </span>
          ) : isClient ? (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 bg-amber-400 text-charcoal border border-charcoal">
              <AlertCircle className="w-3 h-3" />
              CLIENT COMMITMENT // NO SYNC
            </span>
          ) : isPipeline ? (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100 border border-charcoal">
              PIPELINE // ROUTES TO ESTRIDE
            </span>
          ) : isInactive ? (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 bg-stone-300 dark:bg-stone-700 text-charcoal dark:text-stone-100 border border-charcoal">
              INACTIVE // ROUTES TO ESTRIDE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 bg-lime text-charcoal border border-charcoal">
              READY FOR STAGING
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isClient && (
            <label className="flex items-center gap-1.5 cursor-pointer font-mono text-[11px] text-charcoal dark:text-foreground">
              <input
                type="checkbox"
                checked={item.sync_status !== "IGNORED"}
                onChange={(e) =>
                  handleFieldChange("sync_status", e.target.checked ? "POST" : "IGNORED")
                }
                className="w-3.5 h-3.5 accent-rust border border-charcoal rounded-none cursor-pointer"
              />
              <span className="select-none font-bold">Include in Sync</span>
            </label>
          )}

          <button
            onClick={() => onDelete(item.id)}
            className="p-1 hover:bg-red-500 hover:text-white text-charcoal/60 dark:text-foreground/60 transition-colors border border-transparent hover:border-charcoal cursor-pointer"
            title="Remove Action Item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Task Title (Editable) */}
      <div className="mb-3">
        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={item.task}
              autoFocus
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
              onChange={(e) => handleFieldChange("task", e.target.value)}
              className="w-full px-2.5 py-1.5 bg-background border-2 border-rust font-mono text-xs font-bold text-charcoal dark:text-foreground focus:outline-none"
            />
          </div>
        ) : (
          <h3
            onClick={() => setIsEditingTitle(true)}
            title="Click to edit task name"
            className="font-mono text-sm font-bold text-charcoal dark:text-foreground hover:text-rust cursor-text leading-snug py-1 flex items-start justify-between group"
          >
            <span>{item.task}</span>
            <span className="font-mono text-[10px] font-normal text-charcoal/40 dark:text-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
              [edit]
            </span>
          </h3>
        )}
      </div>

      {/* Primary Config Row: Project, To-do List, Assignee, Due Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        {/* Project Selector */}
        <div>
          <label className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-charcoal/70 dark:text-foreground/70 mb-1">
            <FolderGit2 className="w-3 h-3 text-rust" />
            Project Target
          </label>
          <select
            value={item.resolved_entity || "eStride Digital"}
            onChange={(e) => handleFieldChange("resolved_entity", e.target.value)}
            className="w-full px-2 py-1.5 bg-background border border-charcoal dark:border-foreground font-mono text-xs text-charcoal dark:text-foreground focus:outline-none focus:ring-1 focus:ring-rust cursor-pointer"
          >
            {availableProjects.map((proj) => (
              <option key={proj.entity_name} value={proj.entity_name}>
                {proj.entity_name} {proj.status === "Pipeline" ? "(Pipeline)" : proj.status === "Inactive" ? "(Inactive)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* To-Do List Selector */}
        <div>
          <label className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-charcoal/70 dark:text-foreground/70 mb-1">
            <ListTodo className="w-3 h-3 text-rust" />
            Basecamp To-Do List
          </label>
          {item.resolved_entity === "FOOGO Green" ? (
            <select
              value={item.todo_list_name || "Requires Routing"}
              onChange={(e) => handleFieldChange("todo_list_name", e.target.value)}
              className="w-full px-2 py-1.5 bg-background border border-charcoal dark:border-foreground font-mono text-xs text-charcoal dark:text-foreground focus:outline-none focus:ring-1 focus:ring-rust cursor-pointer font-bold"
            >
              {FOOGO_APPROVED_LISTS.map((listName) => (
                <option key={listName} value={listName}>
                  {listName}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="e.g. Action Items / General"
              value={item.todo_list_name || ""}
              onChange={(e) => handleFieldChange("todo_list_name", e.target.value)}
              className="w-full px-2 py-1.5 bg-background border border-charcoal dark:border-foreground font-mono text-xs text-charcoal dark:text-foreground focus:outline-none focus:ring-1 focus:ring-rust"
            />
          )}
        </div>

        {/* Assignee / Owners */}
        <div>
          <label className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-charcoal/70 dark:text-foreground/70 mb-1">
            <User className="w-3 h-3 text-rust" />
            Assignee (eStride Lead)
          </label>
          <select
            value={item.owners?.[0] || "Pradeep G"}
            onChange={(e) => handleFieldChange("owners", [e.target.value])}
            className="w-full px-2 py-1.5 bg-background border border-charcoal dark:border-foreground font-mono text-xs text-charcoal dark:text-foreground focus:outline-none focus:ring-1 focus:ring-rust cursor-pointer"
          >
            {TEAM_MEMBERS.map((tm) => (
              <option key={tm.name} value={tm.name}>
                {tm.name} ({tm.role})
              </option>
            ))}
          </select>
        </div>

        {/* Due Date Picker */}
        <div>
          <label className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-charcoal/70 dark:text-foreground/70 mb-1">
            <Calendar className="w-3 h-3 text-rust" />
            Due Date
          </label>
          <input
            type="date"
            value={item.due_date || ""}
            onChange={(e) => handleFieldChange("due_date", e.target.value || null)}
            className="w-full px-2 py-1.5 bg-background border border-charcoal dark:border-foreground font-mono text-xs text-charcoal dark:text-foreground focus:outline-none focus:ring-1 focus:ring-rust cursor-pointer"
          />
        </div>
      </div>

      {/* Expandable Notes / Technical Route Details */}
      <div className="mt-3 pt-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 font-mono text-[10px] text-charcoal/60 dark:text-foreground/60 hover:text-rust transition-colors cursor-pointer"
        >
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span>{isExpanded ? "Hide Routing Diagnostics" : "Show Routing Diagnostics & Notes"}</span>
        </button>

        {isExpanded && (
          <div className="mt-2.5 p-3 bg-paper-cool/50 dark:bg-background/80 border border-charcoal/30 dark:border-foreground/30 font-mono text-[11px] space-y-1.5 text-charcoal dark:text-foreground">
            <div className="flex justify-between">
              <span className="text-charcoal/60 dark:text-foreground/60">Basecamp Destination:</span>
              <span className="font-bold">{item.resolved_bc_project || "eStride"} (ID: {item.resolved_bc_project_id || "5463662"})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal/60 dark:text-foreground/60">Routing Rule Matrix:</span>
              <span>
                {isClient
                  ? "Rule §6.2 (Client Commitment Filtered)"
                  : isPipeline
                  ? "Rule §4.3 (Pipeline Destination -> eStride)"
                  : isInactive
                  ? "Rule §4.4 (Inactive Destination -> eStride)"
                  : item.resolved_entity === "FOOGO Green"
                  ? "FOOGO Profile v1.0 (8-List Heuristics)"
                  : "Standard Project Route"}
              </span>
            </div>
            {item.description && (
              <div className="pt-1.5 border-t border-charcoal/20">
                <span className="text-charcoal/60 dark:text-foreground/60 block mb-0.5">Context Description:</span>
                <p className="font-sans text-xs italic">{item.description}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
