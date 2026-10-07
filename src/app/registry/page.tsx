"use client";

import React, { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import {
  ProjectEntity,
  ProjectAlias,
  MeetingAlias,
  ContactEntity,
  ProjectStatus,
} from "@/lib/types";
import {
  Search,
  FolderGit2,
  Users,
  Tag,
  Calendar,
  Plus,
  Trash2,
  RefreshCw,
  Upload,
  Download,
  RotateCcw,
  CheckCircle2,
  Save,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";

export default function RegistryPage() {
  const [activeTab, setActiveTab] = useState<"projects" | "aliases" | "meetings" | "contacts">("projects");
  const [search, setSearch] = useState("");

  // Registry state
  const [projects, setProjects] = useState<ProjectEntity[]>([]);
  const [projectAliases, setProjectAliases] = useState<ProjectAlias[]>([]);
  const [meetingAliases, setMeetingAliases] = useState<MeetingAlias[]>([]);
  const [contacts, setContacts] = useState<ContactEntity[]>([]);

  // Status indicators
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [sourceTag, setSourceTag] = useState<string>("Default");
  const [saveStatus, setSaveStatus] = useState<string>("Synced");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch registry on initial mount
  useEffect(() => {
    const fetchRegistry = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/registry");
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setProjects(json.data.projects || []);
            setProjectAliases(json.data.projectAliases || []);
            setMeetingAliases(json.data.meetingAliases || []);
            setContacts(json.data.contacts || []);
            setSourceTag(json.data.source || "Default");
          }
        }
      } catch (err) {
        console.error("Failed to load registry:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRegistry();
  }, []);

  // 2. Persist changes to /api/registry (Debounced Auto-save)
  const triggerAutoSave = (
    newProjects = projects,
    newAliases = projectAliases,
    newMeetings = meetingAliases,
    newContacts = contacts
  ) => {
    setSaveStatus("Saving...");
    setIsSaving(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const payload = {
          projects: newProjects,
          projectAliases: newAliases,
          meetingAliases: newMeetings,
          contacts: newContacts,
        };

        const res = await fetch("/api/registry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registry: payload }),
        });

        if (res.ok) {
          setSaveStatus("All changes saved");
          setSourceTag("Manual Edit");
        } else {
          setSaveStatus("Save failed");
        }
      } catch (err) {
        console.error("Auto-save error:", err);
        setSaveStatus("Error saving");
      } finally {
        setIsSaving(false);
      }
    }, 600);
  };

  // Sync directly from Google Sheets
  const handleSyncGoogleSheets = async () => {
    try {
      setIsSyncingSheets(true);
      setSaveStatus("Syncing from Google Sheets...");
      const res = await fetch("/api/registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_sheets" }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to sync from Google Sheets.");
      }

      setProjects(json.data.projects || []);
      setProjectAliases(json.data.projectAliases || []);
      setMeetingAliases(json.data.meetingAliases || []);
      setContacts(json.data.contacts || []);
      setSourceTag("Google Sheets");
      setSaveStatus("Synced from Google Sheets");
      alert(`Synchronized successfully! Loaded ${json.data.projects.length} projects from Google Sheets.`);
    } catch (err: any) {
      alert(`Google Sheets Sync Error: ${err.message}`);
      setSaveStatus("Sync error");
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Import uploaded Excel (.xlsx) file
  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaveStatus("Importing Excel...");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/registry", {
        method: "PUT",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to parse Excel file.");
      }

      setProjects(json.data.projects || []);
      setProjectAliases(json.data.projectAliases || []);
      setMeetingAliases(json.data.meetingAliases || []);
      setContacts(json.data.contacts || []);
      setSourceTag("Excel Import");
      setSaveStatus("Imported from Excel");
      alert(`Imported ${json.data.projects.length} projects from ${file.name}!`);
    } catch (err: any) {
      alert(`Excel Import Error: ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Export current registry to Excel workbook (.xlsx)
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      const wsProjects = XLSX.utils.json_to_sheet(projects);
      const wsAliases = XLSX.utils.json_to_sheet(projectAliases);
      const wsMeetings = XLSX.utils.json_to_sheet(meetingAliases);
      const wsContacts = XLSX.utils.json_to_sheet(contacts);

      XLSX.utils.book_append_sheet(wb, wsProjects, "Projects");
      XLSX.utils.book_append_sheet(wb, wsAliases, "Project Aliases");
      XLSX.utils.book_append_sheet(wb, wsMeetings, "Meeting Aliases");
      XLSX.utils.book_append_sheet(wb, wsContacts, "Contacts");

      XLSX.writeFile(wb, "eStride_MeetOps_Project_Registry.xlsx");
    } catch (err: any) {
      alert(`Export Error: ${err.message}`);
    }
  };

  // Reset to default spec values
  const handleResetDefaults = async () => {
    if (!confirm("Reset all registry tables back to default specification values?")) return;
    try {
      setSaveStatus("Resetting...");
      const res = await fetch("/api/registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const json = await res.json();
      if (res.ok) {
        setProjects(json.data.projects || []);
        setProjectAliases(json.data.projectAliases || []);
        setMeetingAliases(json.data.meetingAliases || []);
        setContacts(json.data.contacts || []);
        setSourceTag("Default");
        setSaveStatus("Reset to Defaults");
      }
    } catch (err: any) {
      alert(`Reset Error: ${err.message}`);
    }
  };

  // ==========================================
  // INLINE CELL EDITORS
  // ==========================================
  const updateProjectField = (index: number, field: keyof ProjectEntity, value: any) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
    triggerAutoSave(updated, projectAliases, meetingAliases, contacts);
  };

  const addProjectRow = () => {
    const newRow: ProjectEntity = {
      entity_name: "New Client",
      relationship_type: "Direct Client",
      parent_relationship: null,
      status: "Active",
      basecamp_project_name: "New Client",
      basecamp_project_id: "",
      list_routing_profile: "Standard",
      notes: "Newly created project",
    };
    const updated = [newRow, ...projects];
    setProjects(updated);
    triggerAutoSave(updated, projectAliases, meetingAliases, contacts);
  };

  const deleteProjectRow = (index: number) => {
    const updated = projects.filter((_, i) => i !== index);
    setProjects(updated);
    triggerAutoSave(updated, projectAliases, meetingAliases, contacts);
  };

  const updateAliasField = (index: number, field: keyof ProjectAlias, value: any) => {
    const updated = [...projectAliases];
    updated[index] = { ...updated[index], [field]: value };
    setProjectAliases(updated);
    triggerAutoSave(projects, updated, meetingAliases, contacts);
  };

  const addAliasRow = () => {
    const newRow: ProjectAlias = {
      entity_name: projects[0]?.entity_name || "eStride Digital",
      alias: "new_alias",
      alias_type: "Short Name",
    };
    const updated = [newRow, ...projectAliases];
    setProjectAliases(updated);
    triggerAutoSave(projects, updated, meetingAliases, contacts);
  };

  const deleteAliasRow = (index: number) => {
    const updated = projectAliases.filter((_, i) => i !== index);
    setProjectAliases(updated);
    triggerAutoSave(projects, updated, meetingAliases, contacts);
  };

  const updateMeetingField = (index: number, field: keyof MeetingAlias, value: any) => {
    const updated = [...meetingAliases];
    updated[index] = { ...updated[index], [field]: value };
    setMeetingAliases(updated);
    triggerAutoSave(projects, projectAliases, updated, contacts);
  };

  const addMeetingRow = () => {
    const newRow: MeetingAlias = {
      meeting_alias: "New Meeting Sync",
      entity_name: projects[0]?.entity_name || "eStride Digital",
      meeting_context: "External - Single Project",
    };
    const updated = [newRow, ...meetingAliases];
    setMeetingAliases(updated);
    triggerAutoSave(projects, projectAliases, updated, contacts);
  };

  const deleteMeetingRow = (index: number) => {
    const updated = meetingAliases.filter((_, i) => i !== index);
    setMeetingAliases(updated);
    triggerAutoSave(projects, projectAliases, updated, contacts);
  };

  const updateContactField = (index: number, field: keyof ContactEntity, value: any) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
    triggerAutoSave(projects, projectAliases, meetingAliases, updated);
  };

  const addContactRow = () => {
    const newRow: ContactEntity = {
      full_name: "New Stakeholder",
      name_alias: "Stakeholder",
      entity_name: projects[0]?.entity_name || "eStride Digital",
      notes: "",
    };
    const updated = [newRow, ...contacts];
    setContacts(updated);
    triggerAutoSave(projects, projectAliases, meetingAliases, updated);
  };

  const deleteContactRow = (index: number) => {
    const updated = contacts.filter((_, i) => i !== index);
    setContacts(updated);
    triggerAutoSave(projects, projectAliases, meetingAliases, updated);
  };

  // Filter items by search term
  const filteredProjects = projects.filter(
    (p) =>
      p.entity_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.relationship_type && p.relationship_type.toLowerCase().includes(search.toLowerCase())) ||
      (p.status && p.status.toLowerCase().includes(search.toLowerCase())) ||
      (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredProjectAliases = projectAliases.filter(
    (a) =>
      a.alias.toLowerCase().includes(search.toLowerCase()) ||
      a.entity_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMeetingAliases = meetingAliases.filter(
    (m) =>
      m.meeting_alias.toLowerCase().includes(search.toLowerCase()) ||
      m.entity_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredContacts = contacts.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.name_alias.toLowerCase().includes(search.toLowerCase()) ||
      c.entity_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Banner */}
        <div className="mb-6 border-b-2 border-charcoal/20 dark:border-foreground/20 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-black text-charcoal dark:text-foreground tracking-tight">
              Project & Entity Registry<span className="text-rust">.</span>
            </h1>
            <p className="font-mono text-xs text-charcoal/60 dark:text-foreground/60 mt-1">
              Live editable spreadsheet grid • Click any cell to modify • Changes immediately update meeting routing
            </p>
          </div>

          {/* Sync & Spreadsheet Controls Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Auto-save Status Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-paper-cool dark:bg-card border border-charcoal dark:border-foreground font-mono text-[11px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSaving ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                }`}
              />
              <span className="font-bold">{saveStatus}</span>
              <span className="text-charcoal/40 dark:text-foreground/40 text-[10px]">({sourceTag})</span>
            </div>

            {/* Sync from Google Sheets */}
            <button
              onClick={handleSyncGoogleSheets}
              disabled={isSyncingSheets}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-lime text-charcoal border-2 border-charcoal font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#2F3542] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all cursor-pointer disabled:opacity-50"
              title="Sync live from Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? "animate-spin" : ""}`} />
              <span>Sync Google Sheets</span>
            </button>

            {/* Hidden Excel File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleUploadExcel}
              className="hidden"
            />

            {/* Import Excel Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-card border-2 border-charcoal dark:border-foreground font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#2F3542] hover:bg-paper-cool transition-all cursor-pointer"
              title="Import .xlsx file (eStride - MeetOps - Project Registry)"
            >
              <Upload className="w-3.5 h-3.5 text-rust" />
              <span>Import .xlsx</span>
            </button>

            {/* Export Excel Button */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-card border-2 border-charcoal dark:border-foreground font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#2F3542] hover:bg-paper-cool transition-all cursor-pointer"
              title="Export registry to Excel"
            >
              <Download className="w-3.5 h-3.5 text-rust" />
              <span>Export</span>
            </button>

            {/* Reset Defaults */}
            <button
              onClick={handleResetDefaults}
              className="p-1.5 border-2 border-charcoal dark:border-foreground hover:bg-paper-cool cursor-pointer"
              title="Reset to default specification data"
            >
              <RotateCcw className="w-4 h-4 text-charcoal/60 dark:text-foreground/60" />
            </button>
          </div>
        </div>

        {/* Tab Selector & Search & Add Row Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("projects")}
              className={`flex items-center gap-1.5 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider border-2 border-charcoal dark:border-foreground transition-all cursor-pointer ${
                activeTab === "projects"
                  ? "bg-rust text-white shadow-brutal"
                  : "bg-card text-charcoal dark:text-foreground hover:bg-paper-cool"
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Projects ({projects.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("aliases")}
              className={`flex items-center gap-1.5 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider border-2 border-charcoal dark:border-foreground transition-all cursor-pointer ${
                activeTab === "aliases"
                  ? "bg-rust text-white shadow-brutal"
                  : "bg-card text-charcoal dark:text-foreground hover:bg-paper-cool"
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Project Aliases ({projectAliases.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("meetings")}
              className={`flex items-center gap-1.5 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider border-2 border-charcoal dark:border-foreground transition-all cursor-pointer ${
                activeTab === "meetings"
                  ? "bg-rust text-white shadow-brutal"
                  : "bg-card text-charcoal dark:text-foreground hover:bg-paper-cool"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Meeting Aliases ({meetingAliases.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("contacts")}
              className={`flex items-center gap-1.5 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider border-2 border-charcoal dark:border-foreground transition-all cursor-pointer ${
                activeTab === "contacts"
                  ? "bg-rust text-white shadow-brutal"
                  : "bg-card text-charcoal dark:text-foreground hover:bg-paper-cool"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Stakeholders ({contacts.length})</span>
            </button>
          </div>

          {/* Right Tools: Search & Add Row */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/50 dark:text-foreground/50" />
              <input
                type="text"
                placeholder="Filter table..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-card border-2 border-charcoal dark:border-foreground font-mono text-xs text-charcoal dark:text-foreground focus:outline-none focus:ring-1 focus:ring-rust"
              />
            </div>

            {/* Tab specific + Add Row Button */}
            {activeTab === "projects" && (
              <button
                onClick={addProjectRow}
                className="flex items-center gap-1 px-3 py-2 bg-charcoal text-white dark:bg-foreground dark:text-charcoal font-mono text-xs font-bold uppercase hover:bg-rust transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project</span>
              </button>
            )}
            {activeTab === "aliases" && (
              <button
                onClick={addAliasRow}
                className="flex items-center gap-1 px-3 py-2 bg-charcoal text-white dark:bg-foreground dark:text-charcoal font-mono text-xs font-bold uppercase hover:bg-rust transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Alias</span>
              </button>
            )}
            {activeTab === "meetings" && (
              <button
                onClick={addMeetingRow}
                className="flex items-center gap-1 px-3 py-2 bg-charcoal text-white dark:bg-foreground dark:text-charcoal font-mono text-xs font-bold uppercase hover:bg-rust transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Meeting</span>
              </button>
            )}
            {activeTab === "contacts" && (
              <button
                onClick={addContactRow}
                className="flex items-center gap-1 px-3 py-2 bg-charcoal text-white dark:bg-foreground dark:text-charcoal font-mono text-xs font-bold uppercase hover:bg-rust transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Stakeholder</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Editable Projects Spreadsheet Table */}
        {activeTab === "projects" && (
          <div className="border-2 border-charcoal dark:border-foreground bg-card shadow-brutal overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="bg-paper-cool dark:bg-background border-b-2 border-charcoal dark:border-foreground sticky top-0">
                <tr>
                  <th className="p-2.5 border-r border-charcoal/20 min-w-[160px]">Entity Name</th>
                  <th className="p-2.5 border-r border-charcoal/20 min-w-[150px]">Relationship</th>
                  <th className="p-2.5 border-r border-charcoal/20 min-w-[100px]">Parent</th>
                  <th className="p-2.5 border-r border-charcoal/20 min-w-[110px]">Status</th>
                  <th className="p-2.5 border-r border-charcoal/20 min-w-[130px]">Basecamp Project</th>
                  <th className="p-2.5 border-r border-charcoal/20 min-w-[110px]">Basecamp ID</th>
                  <th className="p-2.5 border-r border-charcoal/20 min-w-[160px]">Routing Profile</th>
                  <th className="p-2.5 border-r border-charcoal/20 min-w-[200px]">Routing Notes</th>
                  <th className="p-2.5 w-10 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/15 dark:divide-foreground/15">
                {filteredProjects.map((p, idx) => (
                  <tr key={idx} className="hover:bg-paper-cool/30 transition-colors group">
                    {/* Entity Name */}
                    <td className="p-1 border-r border-charcoal/15">
                      <input
                        type="text"
                        value={p.entity_name}
                        onChange={(e) => updateProjectField(idx, "entity_name", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent font-bold text-charcoal dark:text-foreground focus:bg-background focus:outline-none focus:ring-1 focus:ring-rust"
                      />
                    </td>

                    {/* Relationship Type */}
                    <td className="p-1 border-r border-charcoal/15">
                      <input
                        type="text"
                        value={p.relationship_type || ""}
                        onChange={(e) => updateProjectField(idx, "relationship_type", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent text-charcoal/80 dark:text-foreground/80 focus:bg-background focus:outline-none focus:ring-1 focus:ring-rust"
                      />
                    </td>

                    {/* Parent */}
                    <td className="p-1 border-r border-charcoal/15">
                      <input
                        type="text"
                        value={p.parent_relationship || ""}
                        placeholder="—"
                        onChange={(e) => updateProjectField(idx, "parent_relationship", e.target.value || null)}
                        className="w-full px-2 py-1.5 bg-transparent text-charcoal/60 dark:text-foreground/60 focus:bg-background focus:outline-none focus:ring-1 focus:ring-rust"
                      />
                    </td>

                    {/* Status Dropdown */}
                    <td className="p-1 border-r border-charcoal/15">
                      <select
                        value={p.status}
                        onChange={(e) =>
                          updateProjectField(idx, "status", e.target.value as ProjectStatus)
                        }
                        className={`w-full px-2 py-1 font-bold border border-charcoal text-[11px] cursor-pointer focus:outline-none ${
                          p.status === "Active"
                            ? "bg-lime text-charcoal"
                            : p.status === "Pipeline"
                            ? "bg-purple-200 text-purple-900"
                            : "bg-stone-300 text-stone-800"
                        }`}
                      >
                        <option value="Active">Active</option>
                        <option value="Pipeline">Pipeline</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </td>

                    {/* Basecamp Project */}
                    <td className="p-1 border-r border-charcoal/15">
                      <input
                        type="text"
                        value={p.basecamp_project_name || ""}
                        placeholder="eStride (Default)"
                        onChange={(e) => updateProjectField(idx, "basecamp_project_name", e.target.value || null)}
                        className="w-full px-2 py-1.5 bg-transparent font-bold text-charcoal dark:text-foreground focus:bg-background focus:outline-none focus:ring-1 focus:ring-rust"
                      />
                    </td>

                    {/* Basecamp ID */}
                    <td className="p-1 border-r border-charcoal/15">
                      <input
                        type="text"
                        value={p.basecamp_project_id || ""}
                        placeholder="5463662"
                        onChange={(e) => updateProjectField(idx, "basecamp_project_id", e.target.value || null)}
                        className="w-full px-2 py-1.5 bg-transparent text-charcoal/70 dark:text-foreground/70 focus:bg-background focus:outline-none focus:ring-1 focus:ring-rust"
                      />
                    </td>

                    {/* Routing Profile */}
                    <td className="p-1 border-r border-charcoal/15">
                      <input
                        type="text"
                        value={p.list_routing_profile || ""}
                        placeholder="Standard"
                        onChange={(e) => updateProjectField(idx, "list_routing_profile", e.target.value || null)}
                        className="w-full px-2 py-1.5 bg-transparent font-bold text-rust focus:bg-background focus:outline-none focus:ring-1 focus:ring-rust"
                      />
                    </td>

                    {/* Notes */}
                    <td className="p-1 border-r border-charcoal/15">
                      <input
                        type="text"
                        value={p.notes || ""}
                        placeholder="Add routing note..."
                        onChange={(e) => updateProjectField(idx, "notes", e.target.value || null)}
                        className="w-full px-2 py-1.5 bg-transparent font-sans text-xs text-charcoal/80 dark:text-foreground/80 focus:bg-background focus:outline-none focus:ring-1 focus:ring-rust"
                      />
                    </td>

                    {/* Delete Action */}
                    <td className="p-1 text-center">
                      <button
                        onClick={() => deleteProjectRow(idx)}
                        className="p-1.5 hover:bg-red-500 hover:text-white text-charcoal/40 transition-colors cursor-pointer"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Editable Project Aliases Spreadsheet Table */}
        {activeTab === "aliases" && (
          <div className="border-2 border-charcoal dark:border-foreground bg-card shadow-brutal overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="bg-paper-cool dark:bg-background border-b-2 border-charcoal dark:border-foreground">
                <tr>
                  <th className="p-2.5 border-r border-charcoal/20 min-w-[200px]">Alias Pattern / Token</th>
                  <th className="p-2.5 border-r border-charcoal/20 min-w-[200px]">Resolved Entity Name</th>
                  <th className="p-2.5 border-r border-charcoal/20 min-w-[150px]">Alias Type</th>
                  <th className="p-2.5 w-10 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/15 dark:divide-foreground/15">
                {filteredProjectAliases.map((a, idx) => (
                  <tr key={idx} className="hover:bg-paper-cool/30 transition-colors">
                    <td className="p-1 border-r border-charcoal/15">
                      <input
                        type="text"
                        value={a.alias}
                        onChange={(e) => updateAliasField(idx, "alias", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent font-bold text-rust focus:bg-background focus:outline-none focus:ring-1 focus:ring-rust"
                      />
                    </td>
                    <td className="p-1 border-r border-charcoal/15">
                      <select
                        value={a.entity_name}
                        onChange={(e) => updateAliasField(idx, "entity_name", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent font-bold text-charcoal dark:text-foreground focus:bg-background focus:outline-none focus:ring-1 focus:ring-rust cursor-pointer"
                      >
                        {projects.map((p) => (
                          <option key={p.entity_name} value={p.entity_name}>
                            {p.entity_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1 border-r border-charcoal/15">
                      <input
                        type="text"
                        value={a.alias_type || "Variant"}
                        onChange={(e) => updateAliasField(idx, "alias_type", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent text-charcoal/70 dark:text-foreground/70 focus:bg-background focus:outline-none focus:ring-1 focus:ring-rust"
                      />
                    </td>
                    <td className="p-1 text-center">
                      <button
                        onClick={() => deleteAliasRow(idx)}
                        className="p-1.5 hover:bg-red-500 hover:text-white text-charcoal/40 transition-colors cursor-pointer"
                        title="Delete alias"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Editable Meeting Aliases Spreadsheet Table */}
        {activeTab === "meetings" && (
          <div className="border-2 border-charcoal dark:border-foreground bg-card shadow-brutal overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="bg-paper-cool dark:bg-background border-b-2 border-charcoal dark:border-foreground">
                <tr>
                  <th className="p-2.5 border-r border-charcoal/20 min-w-[280px]">Meeting Title Pattern</th>
                  <th className="p-2.5 border-r border-charcoal/20 min-w-[200px]">Resolved Entity</th>
                  <th className="p-2.5 border-r border-charcoal/20 min-w-[180px]">Meeting Context</th>
                  <th className="p-2.5 w-10 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/15 dark:divide-foreground/15">
                {filteredMeetingAliases.map((m, idx) => (
                  <tr key={idx} className="hover:bg-paper-cool/30 transition-colors">
                    <td className="p-1 border-r border-charcoal/15">
                      <input
                        type="text"
                        value={m.meeting_alias}
                        onChange={(e) => updateMeetingField(idx, "meeting_alias", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent font-bold text-charcoal dark:text-foreground focus:bg-background focus:outline-none focus:ring-1 focus:ring-rust"
                      />
                    </td>
                    <td className="p-1 border-r border-charcoal/15">
                      <select
                        value={m.entity_name}
                        onChange={(e) => updateMeetingField(idx, "entity_name", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent font-bold text-rust focus:bg-background focus:outline-none focus:ring-1 focus:ring-rust cursor-pointer"
                      >
                        {projects.map((p) => (
                          <option key={p.entity_name} value={p.entity_name}>
                            {p.entity_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1 border-r border-charcoal/15">
                      <select
                        value={m.meeting_context}
                        onChange={(e) => updateMeetingField(idx, "meeting_context", e.target.value as any)}
                        className="w-full px-2 py-1.5 bg-transparent font-bold text-charcoal dark:text-foreground focus:bg-background focus:outline-none focus:ring-1 focus:ring-rust cursor-pointer"
                      >
                        <option value="External - Single Project">External - Single Project</option>
                        <option value="External - Multi-Project">External - Multi-Project</option>
                        <option value="Internal - Single Project">Internal - Single Project</option>
                        <option value="Internal - Multi-Project">Internal - Multi-Project</option>
                      </select>
                    </td>
                    <td className="p-1 text-center">
                      <button
                        onClick={() => deleteMeetingRow(idx)}
                        className="p-1.5 hover:bg-red-500 hover:text-white text-charcoal/40 transition-colors cursor-pointer"
                        title="Delete meeting pattern"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Editable Stakeholders Spreadsheet Table */}
        {activeTab === "contacts" && (
          <div className="border-2 border-charcoal dark:border-foreground bg-card shadow-brutal overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="bg-paper-cool dark:bg-background border-b-2 border-charcoal dark:border-foreground">
                <tr>
                  <th className="p-2.5 border-r border-charcoal/20 min-w-[180px]">Full Name</th>
                  <th className="p-2.5 border-r border-charcoal/20 min-w-[140px]">Transcript Alias</th>
                  <th className="p-2.5 border-r border-charcoal/20 min-w-[180px]">Entity Affiliation</th>
                  <th className="p-2.5 border-r border-charcoal/20 min-w-[250px]">Routing Disambiguation Notes</th>
                  <th className="p-2.5 w-10 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/15 dark:divide-foreground/15">
                {filteredContacts.map((c, idx) => (
                  <tr key={idx} className="hover:bg-paper-cool/30 transition-colors">
                    <td className="p-1 border-r border-charcoal/15">
                      <input
                        type="text"
                        value={c.full_name}
                        onChange={(e) => updateContactField(idx, "full_name", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent font-bold text-charcoal dark:text-foreground focus:bg-background focus:outline-none focus:ring-1 focus:ring-rust"
                      />
                    </td>
                    <td className="p-1 border-r border-charcoal/15">
                      <input
                        type="text"
                        value={c.name_alias}
                        onChange={(e) => updateContactField(idx, "name_alias", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent font-bold text-rust focus:bg-background focus:outline-none focus:ring-1 focus:ring-rust"
                      />
                    </td>
                    <td className="p-1 border-r border-charcoal/15">
                      <select
                        value={c.entity_name}
                        onChange={(e) => updateContactField(idx, "entity_name", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent font-bold text-charcoal dark:text-foreground focus:bg-background focus:outline-none focus:ring-1 focus:ring-rust cursor-pointer"
                      >
                        {projects.map((p) => (
                          <option key={p.entity_name} value={p.entity_name}>
                            {p.entity_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1 border-r border-charcoal/15">
                      <input
                        type="text"
                        value={c.notes || ""}
                        placeholder="Add notes..."
                        onChange={(e) => updateContactField(idx, "notes", e.target.value || null)}
                        className="w-full px-2 py-1.5 bg-transparent font-sans text-xs text-charcoal/80 dark:text-foreground/80 focus:bg-background focus:outline-none focus:ring-1 focus:ring-rust"
                      />
                    </td>
                    <td className="p-1 text-center">
                      <button
                        onClick={() => deleteContactRow(idx)}
                        className="p-1.5 hover:bg-red-500 hover:text-white text-charcoal/40 transition-colors cursor-pointer"
                        title="Delete stakeholder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
