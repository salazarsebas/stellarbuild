#!/usr/bin/env node
// Bakes ../toolkit into a JSON file the app imports statically, so the
// deployed serverless function bundles it (dynamic fs reads at runtime
// aren't picked up by Vercel's file tracer). Re-run this after editing
// toolkit/.claude/skills content, and commit the regenerated file.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOLKIT_ROOT = path.join(__dirname, "..", "..", "toolkit");
const OUTPUT_PATH = path.join(__dirname, "..", "lib", "toolkit-content.generated.json");

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

const files = walk(TOOLKIT_ROOT)
  .map((absPath) => ({
    path: path.relative(TOOLKIT_ROOT, absPath),
    content: readFileSync(absPath, "utf-8"),
  }))
  .sort((a, b) => a.path.localeCompare(b.path));

writeFileSync(OUTPUT_PATH, JSON.stringify(files));
console.log(`Wrote ${files.length} files to ${OUTPUT_PATH}`);
