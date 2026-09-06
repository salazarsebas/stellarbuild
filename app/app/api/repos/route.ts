import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserOctokit, listUserInstallations } from "@/lib/user-installations";
import { getInstallationOctokit } from "@/lib/github-app";
import { listInstallationRepos } from "@/lib/list-repos";
import { assertOwnsInstallation } from "@/lib/authorize-installation";
import { errorResponse } from "@/lib/http-errors";

export async function GET(req: NextRequest) {
  const installationId = Number(req.nextUrl.searchParams.get("installation_id"));
  if (!installationId) {
    return NextResponse.json({ error: "installation_id is required" }, { status: 400 });
  }

  const session = await getSession();
  if (!session.accessToken) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const userOctokit = getUserOctokit(session.accessToken);
    const installations = await listUserInstallations(userOctokit);
    assertOwnsInstallation(installationId, installations);

    const octokit = await getInstallationOctokit(installationId);
    const repos = await listInstallationRepos(octokit);
    return NextResponse.json({ repos });
  } catch (err) {
    return errorResponse(err, "Failed to list repositories");
  }
}
