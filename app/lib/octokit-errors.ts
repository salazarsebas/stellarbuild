export function hasStatus(err: unknown, status: number): boolean {
  return typeof err === "object" && err !== null && "status" in err && (err as { status?: unknown }).status === status;
}
