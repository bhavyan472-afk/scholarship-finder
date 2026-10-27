import { Prisma, PrismaClient } from "@prisma/client";

// Reuse one client across hot reloads in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// P1xxx: can't reach / authenticate / time out; P2021/P2022: table or column missing (migrations not applied).
const UNAVAILABLE_CODES = new Set(["P1000", "P1001", "P1002", "P1003", "P1008", "P1010", "P1017", "P2021", "P2022"]);

/**
 * True when the error means the database itself is unusable (bad/missing DATABASE_URL, server down,
 * schema not migrated) rather than a problem with one query. Callers show a "data unavailable" state
 * instead of crashing the page.
 */
export function isDbUnavailable(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) return true;
  if (err instanceof Prisma.PrismaClientRustPanicError) return true;
  if (err instanceof Prisma.PrismaClientKnownRequestError) return UNAVAILABLE_CODES.has(err.code);
  return false;
}

/** Run a DB read; on database-unavailable errors log server-side and return `fallback` instead of throwing. */
export async function withDbFallback<T, F>(read: () => Promise<T>, fallback: F): Promise<T | F> {
  try {
    return await read();
  } catch (err) {
    if (!isDbUnavailable(err)) throw err;
    console.error("[db] unavailable:", err instanceof Error ? err.message : err);
    return fallback;
  }
}

/** Postgres `contains` is case-sensitive by default. */
export const insensitive = { mode: "insensitive" } as const;
