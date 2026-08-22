import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowSeconds: number;
};

export async function enforceRateLimit({
  key,
  limit,
  windowSeconds,
}: RateLimitOptions) {
  const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
  const boundary = nowSeconds - BigInt(windowSeconds);

  const records = await db.$queryRaw<Array<{ count: number; lastRequest: bigint }>>(Prisma.sql`
    INSERT INTO "RateLimit" (id, key, count, "lastRequest")
    VALUES (${randomUUID()}, ${key}, 1, ${nowSeconds})
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN "RateLimit"."lastRequest" < ${boundary} THEN 1
        ELSE "RateLimit".count + 1
      END,
      "lastRequest" = ${nowSeconds}
    RETURNING count, "lastRequest"
  `);
  const record = records[0];
  if (!record) throw new Error("Rate limiter did not return a counter.");

  if (record.count > limit) {
    throw new RateLimitError(windowSeconds);
  }

  return {
    remaining: Math.max(0, limit - record.count),
    resetAt: new Date((Number(record.lastRequest) + windowSeconds) * 1000),
  };
}

export class RateLimitError extends Error {
  readonly retryAfter: number;

  constructor(retryAfter: number) {
    super("Too many requests. Please try again shortly.");
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}
