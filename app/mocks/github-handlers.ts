import { http, HttpResponse } from "msw";

export const FAKE_USER_INSTALLATION_ID = 1001;
export const FAKE_ORG_LOGIN = "acme-labs";
export const FAKE_REPO_NAME = "widgets";
export const FAKE_EMPTY_REPO_NAME = "empty-repo";

export const handlers = [
  http.post("https://github.com/login/oauth/access_token", () =>
    HttpResponse.json({ access_token: "fake-user-access-token", token_type: "bearer" })
  ),

  http.post("https://api.github.com/app/installations/:installationId/access_tokens", () =>
    HttpResponse.json({
      token: "fake-installation-token",
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      permissions: {},
    })
  ),

  http.get("https://api.github.com/user/installations", () =>
    HttpResponse.json({
      installations: [
        {
          id: FAKE_USER_INSTALLATION_ID,
          account: {
            login: FAKE_ORG_LOGIN,
            type: "Organization",
            avatar_url: "https://example.com/avatar.png",
          },
        },
      ],
    })
  ),

  http.get("https://api.github.com/installation/repositories", () =>
    HttpResponse.json({
      repositories: [
        { name: FAKE_REPO_NAME, owner: { login: FAKE_ORG_LOGIN } },
        { name: FAKE_EMPTY_REPO_NAME, owner: { login: FAKE_ORG_LOGIN } },
      ],
    })
  ),

  http.get("https://api.github.com/repos/:owner/:repo", () =>
    HttpResponse.json({ default_branch: "main" })
  ),

  http.patch("https://api.github.com/repos/:owner/:repo", () => HttpResponse.json({})),

  http.get("https://api.github.com/repos/:owner/:repo/git/ref/*", ({ params }) => {
    if (params.repo === FAKE_EMPTY_REPO_NAME) {
      return HttpResponse.json({ message: "Git Repository is empty." }, { status: 409 });
    }
    return HttpResponse.json({ object: { sha: "base-sha" } });
  }),

  http.post("https://api.github.com/repos/:owner/:repo/git/trees", () =>
    HttpResponse.json({ sha: "tree-sha" })
  ),

  http.post("https://api.github.com/repos/:owner/:repo/git/commits", () =>
    HttpResponse.json({ sha: "commit-sha" })
  ),

  http.post("https://api.github.com/repos/:owner/:repo/git/refs", () =>
    HttpResponse.json({}, { status: 201 })
  ),

  http.post("https://api.github.com/repos/:owner/:repo/pulls", () =>
    HttpResponse.json({ html_url: `https://github.com/${FAKE_ORG_LOGIN}/${FAKE_REPO_NAME}/pull/42` })
  ),
];
