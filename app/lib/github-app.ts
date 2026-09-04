import { App } from "@octokit/app";

let appInstance: App | null = null;

function getApp(): App {
  if (!appInstance) {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
    if (!appId || !privateKey) {
      throw new Error("GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY must be set");
    }
    appInstance = new App({ appId, privateKey: privateKey.replace(/\\n/g, "\n") });
  }
  return appInstance;
}

export async function getInstallationOctokit(installationId: number) {
  const app = getApp();
  return app.getInstallationOctokit(installationId);
}
