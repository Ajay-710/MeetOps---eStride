import { ActionItem } from "./types";
import { TEAM_MEMBERS } from "./defaultRegistry";

export interface BasecampTodo {
  id: number;
  content: string;
  description: string;
  due_on?: string | null;
  parent?: { id: number; title: string };
  bucket?: { id: number; name: string };
}

// Map team member names to Basecamp person IDs
const TEAM_BASECAMP_IDS: Record<string, number> = {
  "pradeep g": 38921001,
  "pradeep": 38921001,
  "hari prasad": 38921002,
  "hari": 38921002,
  "praveen kumar": 38921003,
  "praveen": 38921003,
  "karthik r": 38921004,
  "karthik": 38921004,
  "govind s": 38921005,
  "govind": 38921005,
  "kannan k": 38921006,
  "kannan": 38921006,
  "freya": 38921007,
  "sydney": 38921008,
};

export function isTaskMatch(existingTitle: string, newTaskTitle: string): boolean {
  if (!existingTitle || !newTaskTitle) return false;
  const stripHtml = (s: string) => String(s).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const c1 = stripHtml(existingTitle).toLowerCase();
  const c2 = stripHtml(newTaskTitle).toLowerCase();
  if (c1 === c2) return true;

  const clean1 = c1.replace(/[^a-z0-9]/g, "");
  const clean2 = c2.replace(/[^a-z0-9]/g, "");
  if (clean1 && clean2 && clean1 === clean2) return true;

  const p1 = c1.split(":")[0].trim().replace(/[^a-z0-9]/g, "");
  const p2 = c2.split(":")[0].trim().replace(/[^a-z0-9]/g, "");
  if (p1 && p2 && p1.length > 5 && p1 === p2) return true;

  if (clean1.length > 8 && clean2.length > 8) {
    if (clean1.startsWith(clean2) || clean2.startsWith(clean1)) return true;
  }
  return false;
}

export function getAssigneeIds(owners: string[] = []): number[] {
  const ids: number[] = [];
  for (const o of owners) {
    const key = o.trim().toLowerCase();
    if (TEAM_BASECAMP_IDS[key]) {
      ids.push(TEAM_BASECAMP_IDS[key]);
    }
  }
  return ids;
}

export async function syncTaskToBasecamp(
  task: ActionItem,
  options: {
    accountId?: string;
    accessToken?: string;
  } = {}
): Promise<{ success: boolean; action: "CREATED" | "UPDATED"; id: string; message: string }> {
  const accountId = options.accountId || process.env.BASECAMP_ACCOUNT_ID || "5463662";
  const token = options.accessToken || process.env.BASECAMP_ACCESS_TOKEN;

  if (!token) {
    throw new Error(
      "Basecamp Access Token missing. Please set BASECAMP_ACCESS_TOKEN in .env.local to post directly to Basecamp."
    );
  }

  const projectId = task.resolved_bc_project_id || "5463662";
  const assigneeIds = getAssigneeIds(task.owners);

  // 1. If task already has a matched to-do ID, execute PUT to update it (same as n8n "Update Basecamp Task")
  if (task.matched_todo_id) {
    const updateUrl = `https://3.basecampapi.com/${accountId}/buckets/${projectId}/todos/${task.matched_todo_id}.json`;
    const res = await fetch(updateUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "MeetOps Studio (support@estride.digital)",
      },
      body: JSON.stringify({
        content: task.task,
        description: task.description || "",
        notify: true,
        ...(assigneeIds.length > 0 ? { assignee_ids: assigneeIds } : {}),
        ...(task.due_date ? { due_on: task.due_date } : {}),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Basecamp PUT failed (${res.status}): ${errText}`);
    }

    const updated = await res.json();
    return {
      success: true,
      action: "UPDATED",
      id: String(updated.id),
      message: `Updated existing to-do in [${task.resolved_bc_project}]`,
    };
  }

  // 2. Otherwise execute POST to create new to-do (same as n8n "Create Basecamp Task")
  // First, find or resolve the target to-do list inside the project todoset
  let targetTodoListId: string | null = null;

  try {
    // Get todoset dock for the project
    const projectDockUrl = `https://3.basecampapi.com/${accountId}/projects/${projectId}.json`;
    const dockRes = await fetch(projectDockUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "MeetOps Studio (support@estride.digital)",
      },
    });

    if (dockRes.ok) {
      const projData = await dockRes.json();
      const todosetDock = (projData.dock || []).find((d: any) => d.name === "todoset");
      if (todosetDock && todosetDock.id) {
        // Fetch to-do lists in this project
        const listsUrl = `https://3.basecampapi.com/${accountId}/buckets/${projectId}/todosets/${todosetDock.id}/todolists.json`;
        const listsRes = await fetch(listsUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "User-Agent": "MeetOps Studio (support@estride.digital)",
          },
        });

        if (listsRes.ok) {
          const lists = await listsRes.json();
          const targetListName = (task.todo_list_name || "").toLowerCase().trim();
          const found = lists.find((l: any) => l.name.toLowerCase().trim() === targetListName);
          if (found) {
            targetTodoListId = String(found.id);
          } else if (lists.length > 0) {
            targetTodoListId = String(lists[0].id);
          }
        }
      }
    }
  } catch (dockErr) {
    console.warn("Could not inspect Basecamp dock lists, falling back to direct todos endpoint:", dockErr);
  }

  // Construct creation URL: either specific to-do list or bucket todos
  const postUrl = targetTodoListId
    ? `https://3.basecampapi.com/${accountId}/buckets/${projectId}/todolists/${targetTodoListId}/todos.json`
    : `https://3.basecampapi.com/${accountId}/buckets/${projectId}/todos.json`;

  const res = await fetch(postUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "MeetOps Studio (support@estride.digital)",
    },
    body: JSON.stringify({
      content: task.task,
      description: task.description || "",
      notify: true,
      ...(assigneeIds.length > 0 ? { assignee_ids: assigneeIds } : {}),
      ...(task.due_date ? { due_on: task.due_date } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Basecamp POST failed (${res.status}): ${errText}`);
  }

  const created = await res.json();
  return {
    success: true,
    action: "CREATED",
    id: String(created.id),
    message: `Created in [${task.resolved_bc_project}] under list [${task.todo_list_name || "General"}]`,
  };
}
