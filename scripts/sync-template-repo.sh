#!/usr/bin/env bash
set -euo pipefail

REPO_SLUG="salazarsebas/stellar-build-toolkit"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOOLKIT_DIR="$ROOT_DIR/toolkit"
WORK_DIR="$(mktemp -d)"

trap 'rm -rf "$WORK_DIR"' EXIT

git clone --depth 1 "https://github.com/$REPO_SLUG.git" "$WORK_DIR"

# Mirror toolkit/ onto the template repo, removing files no longer present.
rsync -a --delete --exclude '.git' "$TOOLKIT_DIR/" "$WORK_DIR/"

cd "$WORK_DIR"
git add -A
if git diff --cached --quiet; then
  echo "Template repo already up to date."
  exit 0
fi
git commit -m "sync: update toolkit content"
git push origin HEAD
