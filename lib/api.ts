import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { authOptions } from "@/lib/auth";
import { ipFromHeaders } from "@/lib/ip";
import { prisma } from "@/lib/prisma";

// Consistent JSON contract:
//   success → { data: T }
//   error   → { error: { code, message, details? } }

export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json({ data }, init);

export const fail = (status: number, code: ErrorCode, message: string, details?: unknown, headers?: HeadersInit) =>
  NextResponse.json({ error: { code, message, ...(details ? { details } : {}) } }, { status, headers });

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wrap a route handler: maps ApiError/ZodError/unknown errors to the error contract. */
export function handler<C = unknown>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      // Let Next.js control-flow errors (dynamic usage, redirect, notFound) propagate.
      const digest = (err as { digest?: unknown })?.digest;
      if (typeof digest === "string" && /^(DYNAMIC_SERVER_USAGE|NEXT_REDIRECT|NEXT_NOT_FOUND)/.test(digest)) throw err;
      if (err instanceof ApiError) return fail(err.status, err.code, err.message, err.details);
      if (err instanceof ZodError)
        return fail(400, "VALIDATION_ERROR", "Invalid input", err.flatten());
      if (err instanceof SyntaxError) return fail(400, "BAD_REQUEST", "Malformed JSON body");
      console.error("[api]", err);
      return fail(500, "INTERNAL_ERROR", "Something went wrong");
    }
  };
}

export async function readJson(req: Request): Promise<unknown> {
  const text = await req.text();
  if (!text) throw new ApiError(400, "BAD_REQUEST", "Request body is required");
  return JSON.parse(text);
}

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new ApiError(401, "UNAUTHORIZED", "Please sign in to continue");
  return session.user;
}

/**
 * The JWT role can be up to 30 days stale (it refreshes on sign-in / session.update()),
 * so admin access is re-checked against the database on every request.
 */
export async function requireAdmin() {
  const user = await requireUser();
  if (!(await isAdmin(user.id))) throw new ApiError(403, "FORBIDDEN", "Admin access required");
  return user;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const db = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return db?.role === "ADMIN";
}

export const clientIp = (req: Request) => ipFromHeaders((name) => req.headers.get(name));
