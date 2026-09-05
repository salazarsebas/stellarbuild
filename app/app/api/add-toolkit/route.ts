import { NextRequest, NextResponse } from "next/server";
import { getInstallationOctokit } from "@/lib/github-app";
import { addToolkitToRepo } from "@/lib/add-toolkit";
import { isTargetKey, type TargetKey } from "@/lib/targets";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const installationId = body?.installation_id;
  const owner = body?.owner;
  const repo = body?.repo;
  const targets = body?.targets;

  if (
    !installationId ||
    !owner ||
    !repo ||
    !Array.isArray(targets) ||
    targets.length === 0 ||
    !targets.every((t: unknown) => typeof t === "string" && isTargetKey(t))
  ) {
    return NextResponse.json(
      { error: "installation_id, owner, repo and a non-empty targets array of known keys are required" },
      { status: 400 }
    );
  }

  try {
    const octokit = await getInstallationOctokit(Number(installationId));
    const result = await addToolkitToRepo(octokit, owner, repo, targets as TargetKey[]);
    return NextResponse.json(result);
  } catch (err) {
    console.error("add-toolkit failed", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
