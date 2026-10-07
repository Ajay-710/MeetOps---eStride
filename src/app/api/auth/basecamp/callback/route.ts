import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;
  const redirectUri = process.env.BASECAMP_REDIRECT_URI || `${origin}/api/auth/basecamp/callback`;

  if (error || !code) {
    return NextResponse.redirect(
      `${origin}/?basecamp_error=${encodeURIComponent(error || "Authorization code missing")}`
    );
  }

  const clientId = process.env.BASECAMP_CLIENT_ID;
  const clientSecret = process.env.BASECAMP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${origin}/?basecamp_error=${encodeURIComponent(
        "BASECAMP_CLIENT_ID or BASECAMP_CLIENT_SECRET not configured on server"
      )}`
    );
  }

  try {
    const tokenUrl = "https://launchpad.37signals.com/authorization/token";
    const tokenParams = new URLSearchParams({
      type: "web_server",
      client_id: clientId,
      redirect_uri: redirectUri,
      client_secret: clientSecret,
      code: code,
    });

    const tokenRes = await fetch(`${tokenUrl}?${tokenParams.toString()}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "User-Agent": "MeetOps Studio (support@estride.digital)",
      },
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return NextResponse.redirect(
        `${origin}/?basecamp_error=${encodeURIComponent(`Token exchange failed: ${errText}`)}`
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    // Set secure cookie for Basecamp token
    const cookieStore = await cookies();
    cookieStore.set("basecamp_access_token", accessToken, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: tokenData.expires_in || 60 * 60 * 24 * 14, // 14 days
      sameSite: "lax",
    });

    if (refreshToken) {
      cookieStore.set("basecamp_refresh_token", refreshToken, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
      });
    }

    return NextResponse.redirect(`${origin}/?basecamp_connected=true`);
  } catch (err: any) {
    return NextResponse.redirect(
      `${origin}/?basecamp_error=${encodeURIComponent(err.message || "Failed to exchange token")}`
    );
  }
}
