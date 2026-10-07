import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("basecamp_access_token")?.value || process.env.BASECAMP_ACCESS_TOKEN;

  const clientIdConfigured = Boolean(process.env.BASECAMP_CLIENT_ID);
  const clientSecretConfigured = Boolean(process.env.BASECAMP_CLIENT_SECRET);

  return NextResponse.json({
    connected: Boolean(token),
    accountId: process.env.BASECAMP_ACCOUNT_ID || "5463662",
    hasConfig: clientIdConfigured && clientSecretConfigured,
  });
}

export async function POST(req: NextRequest) {
  // Disconnect / Clear Token
  const cookieStore = await cookies();
  cookieStore.delete("basecamp_access_token");
  cookieStore.delete("basecamp_refresh_token");

  return NextResponse.json({ success: true, connected: false });
}
