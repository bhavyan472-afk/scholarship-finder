import { ApiError, clientIp, fail, handler, ok, readJson } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, SIGNUP_LIMIT } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/validators";

export const POST = handler(async (req) => {
  const limit = await rateLimit(`signup:${clientIp(req)}`, SIGNUP_LIMIT.limit, SIGNUP_LIMIT.windowMs);
  if (!limit.ok) {
    return fail(429, "RATE_LIMITED", `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSec / 60)} min.`, undefined, {
      "Retry-After": String(limit.retryAfterSec),
    });
  }

  const { name, email, password } = signupSchema.parse(await readJson(req));

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new ApiError(409, "CONFLICT", "An account with this email already exists");

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password) },
    select: { id: true, name: true, email: true },
  });
  return ok(user, { status: 201 });
});
