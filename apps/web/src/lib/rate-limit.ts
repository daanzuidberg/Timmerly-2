import 'server-only';

/**
 * Eenvoudige token-bucket per sleutel (ip + actie) in procesgeheugen. Genoeg
 * voor één instance; bij horizontaal schalen vervangt een Redis-implementatie
 * deze module met dezelfde signatuur.
 */
const buckets = new Map<string, { tokens: number; updatedAt: number }>();

export function rateLimit(key: string, opts: { capacity: number; refillPerMinute: number }): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: opts.capacity, updatedAt: now };
  const refill = ((now - b.updatedAt) / 60_000) * opts.refillPerMinute;
  b.tokens = Math.min(opts.capacity, b.tokens + refill);
  b.updatedAt = now;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return { ok: false, retryAfterSec: Math.ceil((1 - b.tokens) / (opts.refillPerMinute / 60)) };
  }
  b.tokens -= 1;
  buckets.set(key, b);
  if (buckets.size > 50_000) buckets.clear(); // geheugenplafond
  return { ok: true, retryAfterSec: 0 };
}
