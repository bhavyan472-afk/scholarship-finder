import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

// Fixed-window rate limiter backed by Postgres, so limits hold across serverless instances
// (an in-memory Map would reset per cold start and per instance). One atomic upsert per check.

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

export async function rateLimit(rawKey: string, limit: number, windowMs: number, now = new Date()): Promise<RateLimitResult> {
  // Keys contain IPs and emails; store only a hash.
  const key = createHash("sha256").update(rawKey).digest("hex");
  const resetAt = new Date(now.getTime() + windowMs);
  const [row] = await prisma.$queryRaw<Array<{ count: number; resetAt: Date }>>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN ${resetAt} ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"`;

  const ok = row.count <= limit;
  return {
    ok,
    remaining: Math.max(0, limit - row.count),
    retryAfterSec: ok ? 0 : Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000),
  };
}

/** Removes expired windows. Called from the daily cron. */
export const pruneRateLimits = (now = new Date()) => prisma.rateLimit.deleteMany({ where: { resetAt: { lte: now } } });

/** Per IP + email: brute force against one account. */
export const LOGIN_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 } as const;
/** Per IP across all emails: credential stuffing. */
export const LOGIN_IP_LIMIT = { limit: 30, windowMs: 15 * 60 * 1000 } as const;
/** Account creation per IP. */
export const SIGNUP_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 } as const;
