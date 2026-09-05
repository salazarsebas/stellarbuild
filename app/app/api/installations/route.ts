import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserOctokit, listUserInstallations } from "@/lib/user-installations";

export async function GET() {
  const session = await getSession();
  if (!session.accessToken) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const octokit = getUserOctokit(session.accessToken);
  const installations = await listUserInstallations(octokit);
  return NextResponse.json({ installations });
}
