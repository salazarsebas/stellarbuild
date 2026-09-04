import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import generatedContent from "./toolkit-content.generated.json";

export interface ToolkitFile {
  path: string;
  content: string;
}

function walk(dir: string, files: string[] = []): string[] {
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

// Production (no `root` argument) reads the JSON generated at build time by
// scripts/generate-toolkit-content.mjs, which gets bundled like any other
// static import. Vercel's serverless functions only include files the
// bundler can statically trace, and a runtime fs walk of a directory
// outside app/ isn't traceable, so reading ../toolkit directly at runtime
// works locally but 404s (ENOENT) once deployed. Tests pass an explicit
// `root` to point at a small fixture directory instead.
export function getToolkitFiles(root?: string): ToolkitFile[] {
  if (!root) {
    return generatedContent as ToolkitFile[];
  }
  return walk(root)
    .map((absPath) => ({
      path: path.relative(root, absPath),
      content: readFileSync(absPath, "utf-8"),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}
