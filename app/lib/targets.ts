export type TargetKey = "claude" | "codex" | "grok" | "cursor" | "gemini" | "other";

export interface Target {
  key: TargetKey;
  label: string;
  folder: string;
}

export const TARGETS: Target[] = [
  { key: "claude", label: "Claude", folder: ".claude" },
  { key: "codex", label: "Codex", folder: ".codex" },
  { key: "grok", label: "Grok", folder: ".grok" },
  { key: "cursor", label: "Cursor", folder: ".cursor" },
  { key: "gemini", label: "Gemini CLI", folder: ".gemini" },
  { key: "other", label: "Others", folder: ".agents" },
];

const TARGET_KEYS = TARGETS.map((t) => t.key) as string[];

export function isTargetKey(value: string): value is TargetKey {
  return TARGET_KEYS.includes(value);
}
