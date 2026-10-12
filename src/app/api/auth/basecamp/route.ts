import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("client_id") || process.env.BASECAMP_CLIENT_ID;

  // Smart dynamic host & protocol detection for Vercel and local
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  // Allow query param override, or dynamic origin callback
  const redirectUri =
    searchParams.get("redirect_uri") ||
    process.env.BASECAMP_REDIRECT_URI ||
    `${origin}/api/auth/basecamp/callback`;

  if (!clientId) {
    return NextResponse.json(
      {
        error: "BASECAMP_CLIENT_ID is missing. Please configure it in .env.local or Vercel environment variables.",
      },
      { status: 400 }
    );
  }

  // Save the exact redirect_uri used so the token exchange callback uses the identical URI
  const cookieStore = await cookies();
  cookieStore.set("basecamp_oauth_redirect_uri", redirectUri, {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 15, // 15 mins
    sameSite: "lax",
  });

  const authUrl = `https://launchpad.37signals.com/authorization/new?type=web_server&client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(authUrl);
}
