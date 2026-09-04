import { NextRequest, NextResponse } from "next/server";
import { getInstallationOctokit } from "@/lib/github-app";
import { listInstallationRepos } from "@/lib/list-repos";

export async function GET(req: NextRequest) {
  const installationId = req.nextUrl.searchParams.get("installation_id");
  if (!installationId) {
    return NextResponse.json({ error: "installation_id is required" }, { status: 400 });
  }
  const octokit = await getInstallationOctokit(Number(installationId));
  const repos = await listInstallationRepos(octokit as never);
  return NextResponse.json({ repos });
}
