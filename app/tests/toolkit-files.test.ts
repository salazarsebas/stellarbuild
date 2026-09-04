import { describe, expect, it } from "vitest";
import path from "node:path";
import { getToolkitFiles } from "@/lib/toolkit-files";

const FIXTURE_ROOT = path.resolve(__dirname, "fixtures/toolkit");

describe("getToolkitFiles", () => {
  it("returns every file under the root with paths relative to it", () => {
    const files = getToolkitFiles(FIXTURE_ROOT);
    expect(files).toEqual([
      {
        path: path.join(".claude", "skills", "example-skill", "SKILL.md"),
        content: expect.stringContaining("Example skill for tests."),
      },
    ]);
  });
});
