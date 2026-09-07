interface Bucket {
  count: number;
  resetAt: number;
}

// In-memory and per-instance: on Vercel this resets on cold start and is not
// shared across concurrent instances, so it is a best-effort throttle rather
// than a hard distributed limit. Good enough to stop a runaway client or an
// accidental loop without adding external infrastructure.
const buckets = new Map<string, Bucket>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (bucket.count >= limit) {
    return true;
  }

  bucket.count += 1;
  return false;
}
