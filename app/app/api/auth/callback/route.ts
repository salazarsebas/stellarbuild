import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { exchangeCodeForToken } from "@/lib/oauth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const session = await getSession();

  if (!code || !state || state !== session.oauthState) {
    return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 });
  }

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET must be set" },
      { status: 500 }
    );
  }

  try {
    const { accessToken, refreshToken } = await exchangeCodeForToken({
      code,
      redirectUri: `${req.nextUrl.origin}/api/auth/callback`,
      clientId,
      clientSecret,
    });
    session.accessToken = accessToken;
    if (refreshToken) {
      session.refreshToken = refreshToken;
    }
    delete session.oauthState;
    await session.save();
  } catch (err) {
    const message = err instanceof Error ? err.message : "OAuth exchange failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
}
