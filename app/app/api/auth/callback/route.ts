import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { exchangeCodeForToken } from "@/lib/oauth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const session = await getSession();

  if (!code || !state || state !== session.oauthState) {
    return NextResponse.redirect(new URL("/dashboard?authError=invalid_state", req.nextUrl.origin));
  }

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/dashboard?authError=missing_config", req.nextUrl.origin));
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
  } catch {
    return NextResponse.redirect(new URL("/dashboard?authError=token_exchange_failed", req.nextUrl.origin));
  }

  return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
}
