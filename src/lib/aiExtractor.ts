import { GoogleGenerativeAI } from "@google/generative-ai";
import { MeetingExtractionResult } from "./types";

export const SYSTEM_PROMPT = `
MEETOPS BUSINESS RULES & EXTRACTION INSTRUCTIONS (v1.1):
You are an expert executive meeting intelligence system for eStride Digital.
Given a raw meeting transcript and document title, extract structured JSON meeting data following these strict rules:

1. Meeting Date: Extract the actual meeting date (YYYY-MM-DD) from the transcript header or metadata. If absent, fall back to today's date.
2. Meeting Context & Audience Matrix (Spec v1.1):
   Classify meeting_context into one of the 4 valid combinations:
   - "External - Single Project" (e.g. Client x eStride weekly governance sync)
   - "External - Multi-Project" (e.g. BOLDEST partner call covering multiple end-clients)
   - "Internal - Single Project" (e.g. FOOGO Green blog planning with eStride team only, or marked [Internal])
   - "Internal - Multi-Project" (e.g. eStride Daily Standup)
   Title rules: If title contains "[Internal]", or if "eStride" is the only entity mentioned in title, classify audience as Internal.
   Set default_project to the primary client/entity name (e.g. "FOOGO Green", "Unifi", "eStride Digital").
   Set meeting_type to "External" if client/external attendees participated, or "Internal" if eStride team only.

3. Action Items vs Ideas vs Decisions:
   - Extract ONLY genuine commitments. Do NOT extract questions, hypothetical ideas, or general discussion points.
   - Latest instruction governs: discard any action that was superseded or cancelled later in the conversation.
   - For each action item, identify the assigned eStride team members in owners (e.g. Kannan, Govind, Pradeep, Hari, Karthik, Praveen, Sydney, Freya). Unclear internal owner -> Pradeep.
   - External client commitments (e.g. "Divya will send pricing"): set is_client_commitment = true.
   - Relative due dates (e.g. "tomorrow", "Friday"): calculate exact YYYY-MM-DD relative to Meeting Date. If vague ("next week", "later"), leave due_date empty.
   - If an action clearly belongs to an alternate project (e.g. an eFin proposal discussed during a FOOGO meeting), specify project_override.

4. Basecamp To-do List Routing for FOOGO Green (Profile v1.0):
   For FOOGO Green, classify each action item by its PRIMARY DELIVERABLE expected from the assignee into one of the 8 approved lists:
   - "Marketing Automation": Klaviyo flows, lifecycle email/SMS, customer journeys, abandoned cart, win-back series.
   - "Paid Media": Planning, launching & optimising paid campaigns (Google Ads, Meta Ads, Shopping, PMax, ad budgets, creatives).
   - "Website": Platform changes & UX development (Shopify store changes, page creation, navigation, PDP updates, development bugs).
   - "Content": Creation of NEW content assets (new blogs, buying guides, landing page copy, product copy, social posts).
   - "SEO & AEO": Improving search & AI visibility of EXISTING pages/assets (metadata, schema, internal linking, technical SEO, indexing).
   - "Analytics & Reporting": GA4, performance analysis, dashboards, weekly/monthly metric reports, profitability analysis.
   - "Operations": Governance meetings, monthly reviews, SOW renewal, scope coordination, dependency tracking, approvals.
   - "Requires Routing": Safe fallback for ambiguous, unusual, or genuinely cross-functional actions (e.g. "Improve B2B strategy").

Return pure valid JSON matching this schema:
{
  "summary": "Executive summary paragraph",
  "meeting_date": "YYYY-MM-DD",
  "meeting_context": "External - Single Project" | "External - Multi-Project" | "Internal - Single Project" | "Internal - Multi-Project",
  "default_project": "String",
  "meeting_type": "External" | "Internal",
  "decisions": ["string"],
  "participants": ["string"],
  "action_items": [
    {
      "task": "Concise task title",
      "owners": ["string"],
      "is_client_commitment": false,
      "due_date": "YYYY-MM-DD" or null,
      "project_override": "string" or null,
      "todo_list_name": "string" or null,
      "description": "Rich context"
    }
  ]
}
`;

export async function extractWithGemini(
  transcript: string,
  docTitle: string,
  apiKey?: string
): Promise<MeetingExtractionResult> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });

  const prompt = `${SYSTEM_PROMPT}\n\nDocument Title: ${docTitle}\nTranscript:\n${transcript}`;
  const response = await model.generateContent(prompt);
  const text = response.response.text();
  return JSON.parse(text);
}

export async function extractWithOllama(
  transcript: string,
  docTitle: string,
  endpoint: string = "http://localhost:11434"
): Promise<MeetingExtractionResult> {
  const prompt = `${SYSTEM_PROMPT}\n\nDocument Title: ${docTitle}\nTranscript:\n${transcript}\n\nReturn JSON:`;

  const res = await fetch(`${endpoint}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "qwen2.5:3b",
      prompt,
      stream: false,
      format: "json",
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama error: ${res.statusText}`);
  }

  const data = await res.json();
  return JSON.parse(data.response);
}

// Built-in Smart Demo Sample for instant testing without API keys
export function getMockExtraction(docTitle: string): MeetingExtractionResult {
  const isFoogo = docTitle.toLowerCase().includes("foogo");
  const isStandup = docTitle.toLowerCase().includes("standup");

  if (isFoogo) {
    return {
      summary:
        "Bi-weekly governance and growth review for FOOGO Green. Discussed Shopify catalog performance, Black Friday Meta ad campaigns, compostable plates blog asset, and wholesale form integrations.",
      meeting_date: new Date().toISOString().split("T")[0],
      meeting_context: "External - Single Project",
      default_project: "FOOGO Green",
      meeting_type: "External",
      decisions: [
        "Approved Q4 Black Friday budget increase by 20% on Meta ads.",
        "Decided to prioritize organic buying guide for compostable tableware.",
        "Agreed to fix the mobile navigation drawer bug before next Monday.",
      ],
      participants: ["Divya Sudalaikkan", "Pradeep G", "Hari Prasad", "Kannan K", "Govind S"],
      action_items: [
        {
          id: "act-1",
          task: "Fix mobile navigation drawer on Shopify store",
          owners: ["Kannan K"],
          is_client_commitment: false,
          due_date: "Friday",
          project_override: null,
          todo_list_name: "Website",
          description: "Resolve the CSS z-index and drawer transition glitch on mobile viewport.",
        },
        {
          id: "act-2",
          task: "Write comprehensive buying guide on compostable party plates",
          owners: ["Freya"],
          is_client_commitment: false,
          due_date: "next week",
          project_override: null,
          todo_list_name: "Content",
          description: "New 1,500-word editorial buying guide targeting commercial catering buyers.",
        },
        {
          id: "act-3",
          task: "Optimize existing palm leaf plates article for search & AI",
          owners: ["Govind S"],
          is_client_commitment: false,
          due_date: "tomorrow",
          project_override: null,
          todo_list_name: "SEO & AEO",
          description: "Update schema.org Product markup, rewrite meta title and refresh internal linking.",
        },
        {
          id: "act-4",
          task: "Set up Meta ads campaign targeting eco-conscious event planners",
          owners: ["Hari Prasad"],
          is_client_commitment: false,
          due_date: "Friday",
          project_override: null,
          todo_list_name: "Paid Media",
          description: "Configure Advantage+ catalog campaign with new autumn creative sets.",
        },
        {
          id: "act-5",
          task: "Share updated wholesale pricing tier sheet with eStride team",
          owners: ["Divya Sudalaikkan"],
          is_client_commitment: true,
          due_date: null,
          project_override: null,
          todo_list_name: null,
          description: "Client action: Divya to send the verified tier pricing PDF.",
        },
      ],
    };
  }

  // Standup fallback
  return {
    summary:
      "eStride internal daily standup reviewing cross-client deliverables across Unifi, Shopware, BOLDEST, and eFin pipeline opportunities.",
    meeting_date: new Date().toISOString().split("T")[0],
    meeting_context: "Internal - Multi-Project",
    default_project: "eStride Digital",
    meeting_type: "Internal",
    decisions: [
      "Keep eFin pipeline tasks tagged under eStride until SOW approval.",
      "Sync with Scott on BOLDEST corporate website hero banner refresh.",
    ],
    participants: ["Pradeep G", "Hari Prasad", "Govind S", "Karthik R", "Praveen Kumar"],
    action_items: [
      {
        id: "act-s1",
        task: "Update Unifi mutual fund portfolio breakdown component",
        owners: ["Govind S"],
        is_client_commitment: false,
        due_date: "tomorrow",
        project_override: "Unifi",
        todo_list_name: "Website",
        description: "Integrate latest fund fact-sheet metrics on Unifi dashboard.",
      },
      {
        id: "act-s2",
        task: "Draft SOW architecture proposal for eFin opportunity",
        owners: ["Pradeep G"],
        is_client_commitment: false,
        due_date: "Friday",
        project_override: "eFin",
        todo_list_name: null,
        description: "Pipeline proposal for BOLDEST partner lead Dilip.",
      },
      {
        id: "act-s3",
        task: "Refresh hero banner and typography on theboldest.ai",
        owners: ["Kannan K"],
        is_client_commitment: false,
        due_date: null,
        project_override: "BOLDEST",
        todo_list_name: null,
        description: "Direct work for BOLDEST brand website requested by Dilip.",
      },
    ],
  };
}
