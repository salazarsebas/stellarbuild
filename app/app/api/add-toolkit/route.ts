import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserOctokit, listUserInstallations } from "@/lib/user-installations";
import { getInstallationOctokit } from "@/lib/github-app";
import { addToolkitToRepo } from "@/lib/add-toolkit";
import { assertOwnsInstallation } from "@/lib/authorize-installation";
import { withTokenRefresh } from "@/lib/with-token-refresh";
import { isRateLimited } from "@/lib/rate-limit";
import { errorResponse } from "@/lib/http-errors";
import { isTargetKey, type TargetKey } from "@/lib/targets";

export const maxDuration = 60;

function envNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const RATE_LIMIT = envNumber(process.env.ADD_TOOLKIT_RATE_LIMIT, 20);
const RATE_LIMIT_WINDOW_MS = envNumber(process.env.ADD_TOOLKIT_RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const installationId = Number(body?.installation_id);
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

  const session = await getSession();
  if (!session.accessToken) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  if (isRateLimited(session.accessToken, RATE_LIMIT, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  try {
    const installations = await withTokenRefresh(
      session,
      (accessToken) => listUserInstallations(getUserOctokit(accessToken)),
      { clientId: process.env.GITHUB_OAUTH_CLIENT_ID, clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET }
    );
    assertOwnsInstallation(installationId, installations);

    const octokit = await getInstallationOctokit(installationId);
    const result = await addToolkitToRepo(octokit, owner, repo, targets as TargetKey[]);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err, "Failed to add the toolkit");
  }
}
