import { hasStatus } from "./octokit-errors";
import { refreshAccessToken } from "./oauth";
import type { SessionData } from "./session";

type RefreshableSession = SessionData & { save: () => Promise<void> };

export async function withTokenRefresh<T>(
  session: RefreshableSession,
  attempt: (accessToken: string) => Promise<T>,
  credentials: { clientId?: string; clientSecret?: string }
): Promise<T> {
  const currentToken = session.accessToken;
  if (!currentToken) {
    throw new Error("withTokenRefresh requires an existing session.accessToken");
  }

  try {
    return await attempt(currentToken);
  } catch (err) {
    if (!hasStatus(err, 401) || !session.refreshToken || !credentials.clientId || !credentials.clientSecret) {
      throw err;
    }

    const refreshed = await refreshAccessToken({
      refreshToken: session.refreshToken,
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
    });
    session.accessToken = refreshed.accessToken;
    if (refreshed.refreshToken) {
      session.refreshToken = refreshed.refreshToken;
    }
    await session.save();

    return await attempt(session.accessToken);
  }
}
