import {
  ProjectEntity,
  ProjectAlias,
  MeetingAlias,
  ContactEntity,
  ActionItem,
  MeetingExtractionResult,
} from "./types";
import {
  INITIAL_PROJECTS,
  INITIAL_PROJECT_ALIASES,
  INITIAL_MEETING_ALIASES,
  INITIAL_CONTACTS,
  FOOGO_APPROVED_LISTS,
  TEAM_MEMBERS,
} from "./defaultRegistry";

export function getField(row: any, ...possibleNames: string[]): string | null {
  if (!row) return null;
  const cleanKeys: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    cleanKeys[k.toLowerCase().replace(/[^a-z0-9]/g, "")] = v;
  }
  for (const name of possibleNames) {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanKeys[cleanName] !== undefined && cleanKeys[cleanName] !== null && cleanKeys[cleanName] !== "") {
      return String(cleanKeys[cleanName]).trim();
    }
  }
  return null;
}

export function resolveDueDate(dueStr: string | null | undefined, meetingDateISO: string): string | null {
  if (!dueStr || typeof dueStr !== "string") return null;
  const str = dueStr.trim().toLowerCase();

  // If exact YYYY-MM-DD
  const match = str.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (match) return match[0];

  // Avoid false precision for vague dates (Spec §23)
  if (str.includes("next week") || str.includes("next month") || str.includes("later") || str.includes("soon")) {
    return null;
  }

  const baseDate = new Date(meetingDateISO);
  if (isNaN(baseDate.getTime())) return null;

  if (str.includes("today")) {
    return baseDate.toISOString().split("T")[0];
  }
  if (str.includes("tomorrow")) {
    baseDate.setDate(baseDate.getDate() + 1);
    return baseDate.toISOString().split("T")[0];
  }

  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  for (let dayIdx = 0; dayIdx < daysOfWeek.length; dayIdx++) {
    if (str.includes(daysOfWeek[dayIdx])) {
      const currentDay = baseDate.getDay();
      let diff = dayIdx - currentDay;
      if (diff <= 0) diff += 7;
      baseDate.setDate(baseDate.getDate() + diff);
      return baseDate.toISOString().split("T")[0];
    }
  }

  return null;
}

export function matchProjectFromText(
  text: string,
  aliases: ProjectAlias[],
  projects: ProjectEntity[]
): string | null {
  if (!text) return null;
  const t = text.toLowerCase();

  // 1. Check Project Aliases (e.g. 'FUCO Green', 'The Boldest', 'ATT')
  for (const pa of aliases) {
    const alias = (pa.alias || "").toLowerCase();
    if (!alias) continue;
    const regex = new RegExp("\\b" + alias.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + "\\b", "i");
    if (regex.test(t) || t.includes(alias)) {
      return pa.entity_name;
    }
  }

  // 2. Check Projects Master Table (entity_name or basecamp_project_name)
  for (const p of projects) {
    const pEntity = (p.entity_name || "").toLowerCase();
    const pName = (p.basecamp_project_name || "").toLowerCase();
    if ((pEntity && t.includes(pEntity)) || (pName && t.includes(pName))) {
      return p.entity_name;
    }
  }

  return null;
}

export function matchTeamMember(nameStr: string): string {
  if (!nameStr || typeof nameStr !== "string") return "Pradeep G";
  const n = nameStr.trim().toLowerCase();
  const cleanN = n.replace(/[^a-z0-9]/g, "");

  for (const member of TEAM_MEMBERS) {
    if (member.aliases.some((a) => a === n || a.replace(/[^a-z0-9]/g, "") === cleanN)) {
      return member.name;
    }
  }

  for (const member of TEAM_MEMBERS) {
    const mName = member.name.toLowerCase();
    if (mName.includes(n) || n.includes(mName)) {
      return member.name;
    }
  }

  return "Pradeep G"; // Fallback to Lead (Spec §20)
}

export function executeDeterministicRouting(
  extraction: MeetingExtractionResult,
  documentTitle: string = "Meeting Transcript",
  projects: ProjectEntity[] = INITIAL_PROJECTS,
  projectAliases: ProjectAlias[] = INITIAL_PROJECT_ALIASES,
  meetingAliases: MeetingAlias[] = INITIAL_MEETING_ALIASES,
  contacts: ContactEntity[] = INITIAL_CONTACTS
): ActionItem[] {
  const docLower = documentTitle.toLowerCase();
  let defaultEntity = extraction.default_project || null;
  let meetingContext = extraction.meeting_context;

  // 1. Check Meeting Aliases sheet
  for (const ma of meetingAliases) {
    if (ma.meeting_alias && docLower.includes(ma.meeting_alias.toLowerCase())) {
      defaultEntity = ma.entity_name;
      meetingContext = ma.meeting_context;
      break;
    }
  }

  // 2. Check title directly
  if (!defaultEntity) {
    const matched = matchProjectFromText(documentTitle, projectAliases, projects);
    if (matched) {
      defaultEntity = matched;
      if (!meetingContext) {
        meetingContext =
          matched !== "eStride Digital" && matched !== "eStride"
            ? "External - Single Project"
            : "Internal - Multi-Project";
      }
    }
  }

  if (!defaultEntity) {
    defaultEntity = "eStride Digital";
  }

  const isSingleProject = meetingContext.includes("Single Project");

  // 3. Process Action Items
  return extraction.action_items.map((item, idx) => {
    let taskTitle = item.task.trim();
    const taskText = (taskTitle + " " + (item.description || "") + " " + (item.project_override || "")).toLowerCase();

    // Check if client-owned commitment
    const isClient =
      item.is_client_commitment === true ||
      contacts.some(
        (c) =>
          (c.entity_name === "FOOGO Green" || c.entity_name === "Unifi") &&
          item.owners.some((o) => o.toLowerCase().includes(c.name_alias.toLowerCase()))
      );

    let targetEntity = defaultEntity;

    if (isSingleProject) {
      if (item.project_override) {
        const override = matchProjectFromText(item.project_override, projectAliases, projects);
        if (override) targetEntity = override;
      } else {
        const textEntity = matchProjectFromText(taskText, projectAliases, projects);
        if (textEntity && textEntity !== defaultEntity) {
          targetEntity = textEntity;
        }
      }
    } else {
      // Multi-project / Standup
      const textEntity = matchProjectFromText(taskText, projectAliases, projects);
      if (textEntity) {
        targetEntity = textEntity;
      } else {
        // BOLDEST work check
        if (
          taskText.includes("boldest") ||
          taskText.includes("website") ||
          taskText.includes("social media") ||
          taskText.includes("sow")
        ) {
          targetEntity = "BOLDEST";
        } else {
          targetEntity = "eStride Digital";
        }
      }
    }

    const regProj: ProjectEntity = projects.find((p) => p.entity_name === targetEntity) || {
      entity_name: targetEntity,
      relationship_type: "Unknown",
      status: "Active" as const,
      basecamp_project_name: targetEntity,
      basecamp_project_id: "5463662",
    };

    const isPipeline = regProj.status === "Pipeline" || !regProj.basecamp_project_name;
    const isInactive = regProj.status === "Inactive";

    let destinationBcProject = regProj.basecamp_project_name || "eStride";
    if (isPipeline) {
      destinationBcProject = "eStride";
      taskTitle = `[Pipeline: ${regProj.entity_name}] ${taskTitle}`;
    } else if (isInactive) {
      destinationBcProject = "eStride";
      taskTitle = `[Inactive Project: ${regProj.entity_name}] ${taskTitle}`;
    }

    // Resolve Assignee
    const resolvedOwners = item.owners
      .filter((o) => !contacts.some((c) => c.name_alias.toLowerCase() === o.toLowerCase()))
      .map(matchTeamMember);
    if (resolvedOwners.length === 0) resolvedOwners.push("Pradeep G");

    // FOOGO 8-list classification
    let todoList = item.todo_list_name || null;
    if (targetEntity === "FOOGO Green") {
      const match = FOOGO_APPROVED_LISTS.find(
        (l) => l.toLowerCase() === (item.todo_list_name || "").trim().toLowerCase()
      );
      todoList = match || "Requires Routing";
    }

    const calculatedDueDate = resolveDueDate(item.due_date, extraction.meeting_date);

    return {
      ...item,
      id: item.id || `task-${Date.now()}-${idx}`,
      task: taskTitle,
      owners: resolvedOwners,
      resolved_entity: targetEntity,
      resolved_bc_project: destinationBcProject,
      resolved_bc_project_id: regProj.basecamp_project_id || "5463662",
      todo_list_name: todoList,
      due_date: calculatedDueDate,
      is_client_commitment: isClient,
      is_pipeline: isPipeline,
      is_inactive: isInactive,
      sync_status: isClient ? "IGNORED" : "POST",
    };
  });
}
