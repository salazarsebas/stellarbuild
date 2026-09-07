export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
}

async function requestToken(body: Record<string, string>, fallbackErrorMessage: string): Promise<TokenResponse> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(data.error_description ?? fallbackErrorMessage);
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}

export async function exchangeCodeForToken(params: {
  code: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
}): Promise<TokenResponse> {
  return requestToken(
    {
      client_id: params.clientId,
      client_secret: params.clientSecret,
      code: params.code,
      redirect_uri: params.redirectUri,
    },
    "Failed to obtain access token"
  );
}

export async function refreshAccessToken(params: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<TokenResponse> {
  return requestToken(
    {
      client_id: params.clientId,
      client_secret: params.clientSecret,
      grant_type: "refresh_token",
      refresh_token: params.refreshToken,
    },
    "Failed to refresh access token"
  );
}
