export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
}

export async function exchangeCodeForToken(params: {
  code: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
}): Promise<TokenResponse> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: params.clientId,
      client_secret: params.clientSecret,
      code: params.code,
      redirect_uri: params.redirectUri,
    }),
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(data.error_description ?? "Failed to obtain access token");
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}
