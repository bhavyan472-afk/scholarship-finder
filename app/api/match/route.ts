import { z } from "zod";
import { ApiError, handler, ok, requireUser } from "@/lib/api";
import { getMatchesForUser } from "@/lib/scholarships";

const querySchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50) });

/** Ranked eligible/likely matches for the signed-in student. */
export const GET = handler(async (req) => {
  const user = await requireUser();
  const { limit } = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const { profile, matches } = await getMatchesForUser(user.id, limit);
  if (!profile) throw new ApiError(400, "BAD_REQUEST", "Complete your profile to see matches");
  return ok({ matches, total: matches.length });
});
