# stellar-build

Add the [stellar-build](https://github.com/salazarsebas/stellar-build-toolkit) Claude Code skills toolkit to a Stellar/Soroban project in a couple of clicks, no CLI or Claude Code plugin required.

Two ways to get the toolkit:

- **Starting a new project**: use GitHub's native "Use this template" button on [stellar-build-toolkit](https://github.com/salazarsebas/stellar-build-toolkit) to generate a repo pre-loaded with the skills under `.claude/skills/`.
- **Adding it to an existing repo**: install the stellar-build GitHub App from this project's landing page. It opens a Pull Request that adds the same skills to your repo.

## How it works

This repo has two parts:

- `toolkit/`: the curated set of skills (Stellar/Soroban development, smart contracts, wallets, assets, and the process/agent skills that go with them) that gets distributed. It's the single source of truth: `scripts/sync-template-repo.sh` mirrors it onto the template repo, and the GitHub App reads it directly when building a Pull Request.
- `app/`: a Next.js app, a landing page with the two entry points above, and the API routes backing the GitHub App (creates a branch, commits the toolkit files, and opens the PR via the GitHub REST API). The UI is available in English, Spanish, and Portuguese (`app/messages/`), with English served unprefixed (`/`, `/dashboard`) and the other two under `/es` and `/pt`.

## Development

```bash
cd app
bun install
bun run dev        # http://localhost:3000
bun run test       # Vitest
bun run test:e2e   # Playwright, against a production build
```

## Deployment

Deployed on Vercel with **Root Directory** set to `app` and "Include files outside the root directory in the Build Step" enabled (the app reads `toolkit/`, which lives outside `app/`).

Required environment variables (see `app/.env.example`):

| Variable | Purpose |
|---|---|
| `GITHUB_APP_ID` | GitHub App ID, used to authenticate as the app |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App private key (PEM) |
| `GITHUB_APP_SLUG` | App slug, used to build the installation URL |
| `NEXT_PUBLIC_GITHUB_APP_SLUG` | Same slug, exposed to the landing page |

## Updating the toolkit

Edit `toolkit/.claude/skills/`, then run:

```bash
./scripts/sync-template-repo.sh
```

This pushes the current content to the template repo. New Pull Requests opened by the GitHub App always reflect the latest committed content in `toolkit/`.
