"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import {
  INITIAL_PROJECTS,
  INITIAL_PROJECT_ALIASES,
  INITIAL_MEETING_ALIASES,
  INITIAL_CONTACTS,
} from "@/lib/defaultRegistry";
import { Database, Search, FolderGit2, Users, Tag, Calendar, ExternalLink } from "lucide-react";

export default function RegistryPage() {
  const [activeTab, setActiveTab] = useState<"projects" | "aliases" | "meetings" | "contacts">("projects");
  const [search, setSearch] = useState("");

  const filteredProjects = INITIAL_PROJECTS.filter((p) =>
    p.entity_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.relationship_type && p.relationship_type.toLowerCase().includes(search.toLowerCase())) ||
    (p.status && p.status.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredProjectAliases = INITIAL_PROJECT_ALIASES.filter((a) =>
    a.alias.toLowerCase().includes(search.toLowerCase()) ||
    a.entity_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMeetingAliases = INITIAL_MEETING_ALIASES.filter((m) =>
    m.meeting_alias.toLowerCase().includes(search.toLowerCase()) ||
    m.entity_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredContacts = INITIAL_CONTACTS.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.name_alias.toLowerCase().includes(search.toLowerCase()) ||
    c.entity_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Banner */}
        <div className="mb-8 border-b-2 border-charcoal/20 dark:border-foreground/20 pb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs font-bold uppercase tracking-widest px-2 py-0.5 bg-paper-cool dark:bg-card border border-charcoal dark:border-foreground">
              MASTER DATA REGISTRY
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-black text-charcoal dark:text-foreground tracking-tight">
            Project & Entity Registry<span className="text-rust">.</span>
          </h1>
        </div>

        {/* Tab Selector & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
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
              <span>Projects ({INITIAL_PROJECTS.length})</span>
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
              <span>Project Aliases ({INITIAL_PROJECT_ALIASES.length})</span>
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
              <span>Meeting Aliases ({INITIAL_MEETING_ALIASES.length})</span>
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
              <span>Stakeholders ({INITIAL_CONTACTS.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/50 dark:text-foreground/50" />
            <input
              type="text"
              placeholder="Search registry records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-card border-2 border-charcoal dark:border-foreground font-mono text-xs text-charcoal dark:text-foreground focus:outline-none focus:ring-1 focus:ring-rust"
            />
          </div>
        </div>

        {/* Tab 1: Projects Table */}
        {activeTab === "projects" && (
          <div className="border-2 border-charcoal dark:border-foreground bg-card shadow-brutal overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-paper-cool dark:bg-background border-b-2 border-charcoal dark:border-foreground">
                <tr>
                  <th className="p-3">Entity Name</th>
                  <th className="p-3">Relationship</th>
                  <th className="p-3">Parent</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Basecamp Project</th>
                  <th className="p-3">Basecamp ID</th>
                  <th className="p-3">Routing Profile</th>
                  <th className="p-3">Routing Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/15 dark:divide-foreground/15">
                {filteredProjects.map((p, idx) => (
                  <tr key={idx} className="hover:bg-paper-cool/40 dark:hover:bg-paper-cool/10 transition-colors">
                    <td className="p-3 font-bold text-charcoal dark:text-foreground flex items-center gap-1.5">
                      <span>{p.entity_name}</span>
                    </td>
                    <td className="p-3 text-charcoal/80 dark:text-foreground/80">{p.relationship_type}</td>
                    <td className="p-3 text-charcoal/60 dark:text-foreground/60">{p.parent_relationship || "—"}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold border border-charcoal ${
                          p.status === "Active"
                            ? "bg-lime text-charcoal"
                            : p.status === "Pipeline"
                            ? "bg-purple-200 text-purple-900"
                            : "bg-stone-300 text-stone-800"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 font-bold">{p.basecamp_project_name || "eStride (Default)"}</td>
                    <td className="p-3 text-charcoal/60 dark:text-foreground/60">{p.basecamp_project_id || "5463662"}</td>
                    <td className="p-3 text-rust font-bold">{p.list_routing_profile || "Standard"}</td>
                    <td className="p-3 font-sans text-xs max-w-xs">{p.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Project Aliases Table */}
        {activeTab === "aliases" && (
          <div className="border-2 border-charcoal dark:border-foreground bg-card shadow-brutal overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-paper-cool dark:bg-background border-b-2 border-charcoal dark:border-foreground">
                <tr>
                  <th className="p-3">Alias Pattern / Token</th>
                  <th className="p-3">Resolved Entity Name</th>
                  <th className="p-3">Alias Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/15 dark:divide-foreground/15">
                {filteredProjectAliases.map((a, idx) => (
                  <tr key={idx} className="hover:bg-paper-cool/40 dark:hover:bg-paper-cool/10 transition-colors">
                    <td className="p-3 font-bold text-rust">"{a.alias}"</td>
                    <td className="p-3 font-bold text-charcoal dark:text-foreground">{a.entity_name}</td>
                    <td className="p-3 text-charcoal/70 dark:text-foreground/70">{a.alias_type || "Variant"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Meeting Aliases Table */}
        {activeTab === "meetings" && (
          <div className="border-2 border-charcoal dark:border-foreground bg-card shadow-brutal overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-paper-cool dark:bg-background border-b-2 border-charcoal dark:border-foreground">
                <tr>
                  <th className="p-3">Meeting Title Pattern</th>
                  <th className="p-3">Resolved Entity</th>
                  <th className="p-3">Meeting Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/15 dark:divide-foreground/15">
                {filteredMeetingAliases.map((m, idx) => (
                  <tr key={idx} className="hover:bg-paper-cool/40 dark:hover:bg-paper-cool/10 transition-colors">
                    <td className="p-3 font-bold text-charcoal dark:text-foreground">{m.meeting_alias}</td>
                    <td className="p-3 font-bold text-rust">{m.entity_name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-paper-cool dark:bg-background border border-charcoal text-[10px] font-bold">
                        {m.meeting_context}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Stakeholders Table */}
        {activeTab === "contacts" && (
          <div className="border-2 border-charcoal dark:border-foreground bg-card shadow-brutal overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-paper-cool dark:bg-background border-b-2 border-charcoal dark:border-foreground">
                <tr>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Transcript Alias</th>
                  <th className="p-3">Entity Affiliation</th>
                  <th className="p-3">Routing Disambiguation Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/15 dark:divide-foreground/15">
                {filteredContacts.map((c, idx) => (
                  <tr key={idx} className="hover:bg-paper-cool/40 dark:hover:bg-paper-cool/10 transition-colors">
                    <td className="p-3 font-bold text-charcoal dark:text-foreground">{c.full_name}</td>
                    <td className="p-3 font-bold text-rust">"{c.name_alias}"</td>
                    <td className="p-3 font-bold">{c.entity_name}</td>
                    <td className="p-3 font-sans text-xs">{c.notes || "—"}</td>
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
