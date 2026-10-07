import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("client_id") || process.env.BASECAMP_CLIENT_ID;
  
  // Dynamic host detection for redirect URI
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const defaultRedirectUri = `${protocol}://${host}/api/auth/basecamp/callback`;
  const redirectUri = process.env.BASECAMP_REDIRECT_URI || defaultRedirectUri;

  if (!clientId) {
    return NextResponse.json(
      {
        error: "BASECAMP_CLIENT_ID is missing. Please provide it in .env.local or via query parameter.",
      },
      { status: 400 }
    );
  }

  const authUrl = `https://launchpad.37signals.com/authorization/new?type=web_server&client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(authUrl);
}
