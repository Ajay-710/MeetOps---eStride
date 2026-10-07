export type ProjectStatus = "Active" | "Pipeline" | "Inactive";

export interface ProjectEntity {
  entity_name: string;
  relationship_type: string;
  parent_relationship?: string | null;
  status: ProjectStatus;
  basecamp_project_name?: string | null;
  basecamp_project_id?: string | null;
  list_routing_profile?: string | null;
  notes?: string | null;
}

export interface ProjectAlias {
  entity_name: string;
  alias: string;
  alias_type?: string;
}

export interface MeetingAlias {
  meeting_alias: string;
  entity_name: string;
  meeting_context: "External - Single Project" | "External - Multi-Project" | "Internal - Single Project" | "Internal - Multi-Project";
}

export interface ContactEntity {
  full_name: string;
  name_alias: string;
  entity_name: string;
  notes?: string | null;
}

export interface ActionItem {
  id: string;
  task: string;
  owners: string[];
  is_client_commitment?: boolean;
  due_date?: string | null;
  project_override?: string | null;
  todo_list_name?: string | null;
  description?: string;
  // Routing & Basecamp execution fields
  resolved_entity?: string;
  resolved_bc_project?: string;
  resolved_bc_project_id?: string;
  is_pipeline?: boolean;
  is_inactive?: boolean;
  sync_status?: "PENDING" | "POST" | "PUT" | "SYNCED" | "IGNORED";
  matched_todo_id?: string | null;
}

export interface MeetingExtractionResult {
  summary: string;
  meeting_date: string;
  meeting_context: "External - Single Project" | "External - Multi-Project" | "Internal - Single Project" | "Internal - Multi-Project";
  default_project: string;
  meeting_type: "External" | "Internal";
  decisions: string[];
  participants: string[];
  action_items: ActionItem[];
}
