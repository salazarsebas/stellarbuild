import { NextRequest, NextResponse } from "next/server";
import { getInstallationOctokit } from "@/lib/github-app";
import { addToolkitToRepo } from "@/lib/add-toolkit";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const installationId = body?.installation_id;
  const owner = body?.owner;
  const repo = body?.repo;
  if (!installationId || !owner || !repo) {
    return NextResponse.json(
      { error: "installation_id, owner and repo are required" },
      { status: 400 }
    );
  }
  const octokit = await getInstallationOctokit(Number(installationId));
  const result = await addToolkitToRepo(octokit, owner, repo);
  return NextResponse.json(result);
}
