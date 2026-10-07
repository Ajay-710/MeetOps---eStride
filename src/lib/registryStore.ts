import {
  ProjectEntity,
  ProjectAlias,
  MeetingAlias,
  ContactEntity,
  ProjectStatus,
} from "./types";
import {
  INITIAL_PROJECTS,
  INITIAL_PROJECT_ALIASES,
  INITIAL_MEETING_ALIASES,
  INITIAL_CONTACTS,
} from "./defaultRegistry";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

export interface RegistryData {
  projects: ProjectEntity[];
  projectAliases: ProjectAlias[];
  meetingAliases: MeetingAlias[];
  contacts: ContactEntity[];
  lastSynced?: string;
  source?: "Google Sheets" | "Manual Edit" | "Excel Import" | "Default";
}

export const DEFAULT_SHEET_ID = "16oVrez0Qd1gUWv9ggu6D43T_vk6gDByc2s2wXo9nS9Q";

const GOOGLE_SHEET_GIDS = {
  projects: "0",
  aliases: "1628510278",
  meetings: "1331724392",
  contacts: "523168760",
};

// Global in-memory cache for server execution
let inMemoryRegistry: RegistryData | null = null;

const DATA_FILE_PATH = path.join(process.cwd(), "registry_data.json");

function loadStoredFromFile(): RegistryData | null {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, "utf8");
      return JSON.parse(content);
    }
  } catch (e) {
    console.warn("Could not read registry_data.json from disk:", e);
  }
  return null;
}

function persistToFile(data: RegistryData) {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    // Vercel serverless filesystem is read-only outside /tmp; in-memory cache preserves state during invocation
    console.warn("Disk write skipped or failed (safe on serverless):", e);
  }
}

export function getRegistryData(): RegistryData {
  if (inMemoryRegistry) return inMemoryRegistry;

  const onDisk = loadStoredFromFile();
  if (onDisk && Array.isArray(onDisk.projects) && onDisk.projects.length > 0) {
    inMemoryRegistry = onDisk;
    return onDisk;
  }

  inMemoryRegistry = {
    projects: [...INITIAL_PROJECTS],
    projectAliases: [...INITIAL_PROJECT_ALIASES],
    meetingAliases: [...INITIAL_MEETING_ALIASES],
    contacts: [...INITIAL_CONTACTS],
    lastSynced: new Date().toISOString(),
    source: "Default",
  };
  return inMemoryRegistry;
}

export function saveRegistryData(
  data: Partial<RegistryData>,
  source: RegistryData["source"] = "Manual Edit"
): RegistryData {
  const current = getRegistryData();
  const updated: RegistryData = {
    projects: data.projects || current.projects,
    projectAliases: data.projectAliases || current.projectAliases,
    meetingAliases: data.meetingAliases || current.meetingAliases,
    contacts: data.contacts || current.contacts,
    lastSynced: new Date().toISOString(),
    source: source || current.source,
  };

  inMemoryRegistry = updated;
  persistToFile(updated);
  return updated;
}

export function resetRegistryToDefaults(): RegistryData {
  const defaults: RegistryData = {
    projects: [...INITIAL_PROJECTS],
    projectAliases: [...INITIAL_PROJECT_ALIASES],
    meetingAliases: [...INITIAL_MEETING_ALIASES],
    contacts: [...INITIAL_CONTACTS],
    lastSynced: new Date().toISOString(),
    source: "Default",
  };
  inMemoryRegistry = defaults;
  persistToFile(defaults);
  return defaults;
}

// ==========================================
// SYNC FROM GOOGLE SHEETS VIA PUBLIC CSV EXPORT
// ==========================================
export async function syncFromGoogleSheets(
  sheetId: string = DEFAULT_SHEET_ID
): Promise<RegistryData> {
  const fetchCsv = async (gid: string): Promise<string> => {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to fetch sheet tab (gid: ${gid}): ${res.statusText}`);
    }
    return res.text();
  };

  const [projCsv, aliasCsv, meetCsv, contactCsv] = await Promise.all([
    fetchCsv(GOOGLE_SHEET_GIDS.projects),
    fetchCsv(GOOGLE_SHEET_GIDS.aliases),
    fetchCsv(GOOGLE_SHEET_GIDS.meetings),
    fetchCsv(GOOGLE_SHEET_GIDS.contacts),
  ]);

  const parseCsvRows = (csv: string): any[] => {
    const wb = XLSX.read(csv, { type: "string" });
    const firstSheetName = wb.SheetNames[0];
    return XLSX.utils.sheet_to_json(wb.Sheets[firstSheetName]);
  };

  const rawProjects = parseCsvRows(projCsv);
  const rawAliases = parseCsvRows(aliasCsv);
  const rawMeetings = parseCsvRows(meetCsv);
  const rawContacts = parseCsvRows(contactCsv);

  const projects: ProjectEntity[] = rawProjects
    .map((r: any) => ({
      entity_name: String(r.entity_name || r.Entity || r.project_name || "").trim(),
      relationship_type: String(r.relationship_type || r.Relationship || "").trim(),
      parent_relationship: r.parent_relationship ? String(r.parent_relationship).trim() : null,
      status: (r.status === "Pipeline" || r.status === "Inactive" ? r.status : "Active") as ProjectStatus,
      basecamp_project_name: r.basecamp_project_name ? String(r.basecamp_project_name).trim() : null,
      basecamp_project_id: r.basecamp_project_id ? String(r.basecamp_project_id).trim() : null,
      list_routing_profile: r.list_routing_profile ? String(r.list_routing_profile).trim() : null,
      notes: r.notes ? String(r.notes).trim() : null,
    }))
    .filter((p) => Boolean(p.entity_name));

  const projectAliases: ProjectAlias[] = rawAliases
    .map((r: any) => ({
      entity_name: String(r.entity_name || r.Entity || "").trim(),
      alias: String(r.alias || r.Alias || "").trim(),
      alias_type: r.alias_type ? String(r.alias_type).trim() : "Variant",
    }))
    .filter((a) => Boolean(a.alias && a.entity_name));

  const meetingAliases: MeetingAlias[] = rawMeetings
    .map((r: any) => ({
      meeting_alias: String(r.meeting_alias || r.Title || "").trim(),
      entity_name: String(r.entity_name || r.Entity || "").trim(),
      meeting_context: (r.meeting_context || "External - Single Project") as any,
    }))
    .filter((m) => Boolean(m.meeting_alias && m.entity_name));

  const contacts: ContactEntity[] = rawContacts
    .map((r: any) => ({
      full_name: String(r.full_name || r.Name || "").trim(),
      name_alias: String(r.name_alias || r.Alias || "").trim(),
      entity_name: String(r.entity_name || r.Entity || "").trim(),
      notes: r.notes ? String(r.notes).trim() : null,
    }))
    .filter((c) => Boolean(c.name_alias || c.full_name));

  return saveRegistryData(
    {
      projects: projects.length > 0 ? projects : INITIAL_PROJECTS,
      projectAliases: projectAliases.length > 0 ? projectAliases : INITIAL_PROJECT_ALIASES,
      meetingAliases: meetingAliases.length > 0 ? meetingAliases : INITIAL_MEETING_ALIASES,
      contacts: contacts.length > 0 ? contacts : INITIAL_CONTACTS,
    },
    "Google Sheets"
  );
}

// ==========================================
// PARSE UPLOADED EXCEL (.XLSX) WORKBOOK
// ==========================================
export function parseExcelWorkbook(buffer: ArrayBuffer): RegistryData {
  const wb = XLSX.read(buffer, { type: "array" });

  const getSheetData = (namePattern: string): any[] => {
    const sheetName = wb.SheetNames.find((n) =>
      n.toLowerCase().includes(namePattern.toLowerCase())
    );
    if (!sheetName) return [];
    return XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
  };

  const rawProjects = getSheetData("Projects");
  const rawAliases = getSheetData("Project Aliases") || getSheetData("Aliases");
  const rawMeetings = getSheetData("Meeting Aliases") || getSheetData("Meetings");
  const rawContacts = getSheetData("Contacts") || getSheetData("Stakeholders");

  const projects: ProjectEntity[] = (rawProjects.length > 0 ? rawProjects : INITIAL_PROJECTS).map(
    (r: any) => ({
      entity_name: String(r.entity_name || r.Entity || "").trim(),
      relationship_type: String(r.relationship_type || r.Relationship || "").trim(),
      parent_relationship: r.parent_relationship ? String(r.parent_relationship).trim() : null,
      status: (r.status === "Pipeline" || r.status === "Inactive" ? r.status : "Active") as ProjectStatus,
      basecamp_project_name: r.basecamp_project_name ? String(r.basecamp_project_name).trim() : null,
      basecamp_project_id: r.basecamp_project_id ? String(r.basecamp_project_id).trim() : null,
      list_routing_profile: r.list_routing_profile ? String(r.list_routing_profile).trim() : null,
      notes: r.notes ? String(r.notes).trim() : null,
    })
  ).filter(p => Boolean(p.entity_name));

  const projectAliases: ProjectAlias[] = (rawAliases.length > 0 ? rawAliases : INITIAL_PROJECT_ALIASES).map(
    (r: any) => ({
      entity_name: String(r.entity_name || r.Entity || "").trim(),
      alias: String(r.alias || r.Alias || "").trim(),
      alias_type: r.alias_type ? String(r.alias_type).trim() : "Variant",
    })
  ).filter(a => Boolean(a.alias && a.entity_name));

  const meetingAliases: MeetingAlias[] = (rawMeetings.length > 0 ? rawMeetings : INITIAL_MEETING_ALIASES).map(
    (r: any) => ({
      meeting_alias: String(r.meeting_alias || r.Title || "").trim(),
      entity_name: String(r.entity_name || r.Entity || "").trim(),
      meeting_context: (r.meeting_context || "External - Single Project") as any,
    })
  ).filter(m => Boolean(m.meeting_alias && m.entity_name));

  const contacts: ContactEntity[] = (rawContacts.length > 0 ? rawContacts : INITIAL_CONTACTS).map(
    (r: any) => ({
      full_name: String(r.full_name || r.Name || "").trim(),
      name_alias: String(r.name_alias || r.Alias || "").trim(),
      entity_name: String(r.entity_name || r.Entity || "").trim(),
      notes: r.notes ? String(r.notes).trim() : null,
    })
  ).filter(c => Boolean(c.name_alias || c.full_name));

  return saveRegistryData(
    {
      projects,
      projectAliases,
      meetingAliases,
      contacts,
    },
    "Excel Import"
  );
}
