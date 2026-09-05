import { Octokit as OctokitCore } from "@octokit/core";
import { restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods";

const UserOctokit = OctokitCore.plugin(restEndpointMethods);

export interface InstallationRef {
  id: number;
  login: string;
  type: "User" | "Organization";
  avatarUrl: string;
}

export function getUserOctokit(accessToken: string) {
  return new UserOctokit({ auth: accessToken });
}

interface UserInstallationsOctokit {
  rest: {
    apps: {
      listInstallationsForAuthenticatedUser: () => Promise<{
        data: {
          installations: Array<{
            id: number;
            account: { login?: string; slug?: string; type?: string; avatar_url: string } | null;
          }>;
        };
      }>;
    };
  };
}

export async function listUserInstallations(
  octokit: UserInstallationsOctokit
): Promise<InstallationRef[]> {
  const { data } = await octokit.rest.apps.listInstallationsForAuthenticatedUser();
  return data.installations.map((inst) => ({
    id: inst.id,
    login: inst.account?.login ?? inst.account?.slug ?? "unknown",
    type: inst.account?.type === "Organization" ? "Organization" : "User",
    avatarUrl: inst.account?.avatar_url ?? "",
  }));
}
