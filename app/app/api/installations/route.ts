import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserOctokit, listUserInstallations } from "@/lib/user-installations";
import { withTokenRefresh } from "@/lib/with-token-refresh";
import { errorResponse } from "@/lib/http-errors";

export async function GET() {
  const session = await getSession();
  if (!session.accessToken) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  try {
    const installations = await withTokenRefresh(
      session,
      (accessToken) => listUserInstallations(getUserOctokit(accessToken)),
      { clientId: process.env.GITHUB_OAUTH_CLIENT_ID, clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET }
    );
    return NextResponse.json({ installations });
  } catch (err) {
    return errorResponse(err, "Failed to list installations");
  }
}
