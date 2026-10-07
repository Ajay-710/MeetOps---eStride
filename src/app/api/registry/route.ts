import { NextRequest, NextResponse } from "next/server";
import {
  getRegistryData,
  saveRegistryData,
  syncFromGoogleSheets,
  resetRegistryToDefaults,
  parseExcelWorkbook,
  DEFAULT_SHEET_ID,
} from "@/lib/registryStore";

export async function GET(req: NextRequest) {
  try {
    const data = getRegistryData();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load registry." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, registry, sheetId } = body;

    if (action === "sync_sheets") {
      const synced = await syncFromGoogleSheets(sheetId || DEFAULT_SHEET_ID);
      return NextResponse.json({
        success: true,
        message: `Successfully synchronized from Google Sheets (${synced.projects.length} projects loaded)`,
        data: synced,
      });
    }

    if (action === "reset") {
      const defaults = resetRegistryToDefaults();
      return NextResponse.json({
        success: true,
        message: "Registry reset to defaults.",
        data: defaults,
      });
    }

    // Default: Save manual edits
    if (registry) {
      const updated = saveRegistryData(registry, "Manual Edit");
      return NextResponse.json({
        success: true,
        message: "Registry saved successfully.",
        data: updated,
      });
    }

    return NextResponse.json({ error: "Invalid action or payload." }, { status: 400 });
  } catch (err: any) {
    console.error("Registry API error:", err);
    return NextResponse.json({ error: err.message || "Failed to update registry." }, { status: 500 });
  }
}

// Upload Excel file
export async function PUT(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const imported = parseExcelWorkbook(buffer);

    return NextResponse.json({
      success: true,
      message: `Successfully imported Excel registry (${imported.projects.length} projects loaded)`,
      data: imported,
    });
  } catch (err: any) {
    console.error("Registry upload error:", err);
    return NextResponse.json({ error: err.message || "Failed to parse Excel file." }, { status: 500 });
  }
}
