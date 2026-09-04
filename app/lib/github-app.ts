import { App } from "@octokit/app";
import { Octokit as OctokitCore } from "@octokit/core";
import { restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods";

const OctokitWithRest = OctokitCore.plugin(restEndpointMethods);

let appInstance: App<{ Octokit: typeof OctokitWithRest }> | null = null;

function getApp() {
  if (!appInstance) {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
    if (!appId || !privateKey) {
      throw new Error("GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY must be set");
    }
    appInstance = new App({
      appId,
      privateKey: privateKey.replace(/\\n/g, "\n"),
      Octokit: OctokitWithRest,
    });
  }
  return appInstance;
}

export async function getInstallationOctokit(installationId: number) {
  const app = getApp();
  return app.getInstallationOctokit(installationId);
}
