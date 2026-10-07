import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { syncTaskToBasecamp } from "@/lib/basecamp";
import { ActionItem } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tasks, accessToken } = body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: "No tasks provided to sync." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("basecamp_access_token")?.value;
    const token = accessToken || cookieToken || process.env.BASECAMP_ACCESS_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Basecamp Access Token missing. Click 'Connect Basecamp' or provide your credentials to post directly to Basecamp.",
          missingToken: true,
        },
        { status: 401 }
      );
    }

    const results = [];
    for (const task of tasks as ActionItem[]) {
      if (task.is_client_commitment || task.sync_status === "IGNORED") continue;
      const res = await syncTaskToBasecamp(task, { accessToken: token });
      results.push({
        taskId: task.id,
        ...res,
      });
    }

    return NextResponse.json({
      success: true,
      syncedCount: results.length,
      results,
    });
  } catch (err: any) {
    console.error("API /api/basecamp error:", err);
    return NextResponse.json({ error: err.message || "Basecamp sync failed." }, { status: 500 });
  }
}
