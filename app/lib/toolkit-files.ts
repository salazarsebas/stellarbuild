import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export interface ToolkitFile {
  path: string;
  content: string;
}

const DEFAULT_ROOT = path.join(process.cwd(), "..", "toolkit");

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

export function getToolkitFiles(root: string = DEFAULT_ROOT): ToolkitFile[] {
  return walk(root)
    .map((absPath) => ({
      path: path.relative(root, absPath),
      content: readFileSync(absPath, "utf-8"),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}
