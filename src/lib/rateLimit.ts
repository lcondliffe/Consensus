/**
 * In-memory sliding-window rate limiter.
 *
 * This is a per-process store — it resets on restart and is not shared across
 * multiple server instances. It is sufficient for a single-server deployment
 * and can be swapped for a Redis-backed implementation (e.g. @upstash/ratelimit)
 * if horizontal scaling is introduced later.
 */

interface WindowEntry {
  /** Timestamps (ms) of requests within the current window */
  timestamps: number[];
}

// Keyed by `${userId}:${route}` or any arbitrary string
const store = new Map<string, WindowEntry>();

// Prune stale entries every 5 minutes to prevent unbounded memory growth
setInterval(() => {
  const cutoff = Date.now() - 60_000;
  for (const [key, entry] of store) {
    const active = entry.timestamps.filter((ts) => ts > cutoff);
    if (active.length === 0) {
      store.delete(key);
    } else {
      entry.timestamps = active;
    }
  }
}, 5 * 60 * 1000).unref?.(); // .unref() so the timer doesn't keep a Node process alive in tests

export interface RateLimitConfig {
  /** Size of the sliding window in milliseconds */
  windowMs: number;
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Requests remaining in the current window */
  remaining: number;
  /** Unix timestamp (ms) when the oldest in-window request expires */
  resetAt: number;
}

/**
 * Check whether `key` has exceeded the rate limit defined by `config`.
 * Mutates internal state — call once per inbound request.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Drop timestamps that have fallen outside the window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  if (entry.timestamps.length >= config.maxRequests) {
    // Oldest timestamp determines when a slot opens up again
    const resetAt = entry.timestamps[0] + config.windowMs;
    return { allowed: false, remaining: 0, resetAt };
  }

  entry.timestamps.push(now);
  const remaining = config.maxRequests - entry.timestamps.length;
  const resetAt = entry.timestamps[0] + config.windowMs;

  return { allowed: true, remaining, resetAt };
}

// ---------------------------------------------------------------------------
// Per-route limits (exported for use in route handlers)
// ---------------------------------------------------------------------------

/** /api/committee — fans out to N parallel OpenRouter requests; keep strict */
export const COMMITTEE_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 10,
};

/** /api/judge — single OpenRouter call; somewhat looser */
export const JUDGE_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 20,
};

/** /api/generate-criteria — single OpenRouter call, infrequent by design */
export const GENERATE_CRITERIA_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 10,
};
