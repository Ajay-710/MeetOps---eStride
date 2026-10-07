import { NextRequest, NextResponse } from "next/server";
import { extractWithGemini, extractWithOllama, getMockExtraction } from "@/lib/aiExtractor";
import { executeDeterministicRouting } from "@/lib/routingEngine";
import { getRegistryData } from "@/lib/registryStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      transcript,
      docTitle = "Meeting Transcript",
      model = "gemini",
      apiKey,
      registry: clientRegistry,
    } = body;

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "Transcript text is required." }, { status: 400 });
    }

    let extraction;
    if (model === "gemini") {
      try {
        extraction = await extractWithGemini(transcript, docTitle, apiKey);
      } catch (err: any) {
        console.warn("Gemini extraction failed or no key, falling back to mock demo parser:", err.message);
        extraction = getMockExtraction(docTitle);
      }
    } else if (model === "ollama") {
      try {
        extraction = await extractWithOllama(transcript, docTitle);
      } catch (err: any) {
        console.warn("Ollama extraction failed, falling back to mock demo parser:", err.message);
        extraction = getMockExtraction(docTitle);
      }
    } else {
      extraction = getMockExtraction(docTitle);
    }

    // Read dynamic registry (from client or server store)
    const activeRegistry = clientRegistry || getRegistryData();

    // Run Deterministic Routing Engine with active registry
    const routedTasks = executeDeterministicRouting(
      extraction,
      docTitle,
      activeRegistry.projects,
      activeRegistry.projectAliases,
      activeRegistry.meetingAliases,
      activeRegistry.contacts
    );

    return NextResponse.json({
      success: true,
      extraction: {
        ...extraction,
        action_items: routedTasks,
      },
    });
  } catch (err: any) {
    console.error("API /api/extract error:", err);
    return NextResponse.json({ error: err.message || "Failed to process transcript." }, { status: 500 });
  }
}
