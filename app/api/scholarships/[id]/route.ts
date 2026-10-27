import { getServerSession } from "next-auth";
import { ApiError, handler, ok } from "@/lib/api";
import { authOptions } from "@/lib/auth";
import { matchScholarship, toMatchScholarship } from "@/lib/matching";
import { getMatchProfile, getScholarship, serializeScholarship } from "@/lib/scholarships";

type Ctx = { params: { id: string } };

export const GET = handler<Ctx>(async (_req, { params }) => {
  const row = await getScholarship(params.id);
  if (!row || !row.isActive) throw new ApiError(404, "NOT_FOUND", "Scholarship not found");

  const session = await getServerSession(authOptions);
  const profile = await getMatchProfile(session?.user?.id);
  return ok({
    ...serializeScholarship(row),
    match: profile ? matchScholarship(profile, toMatchScholarship(row)) : null,
  });
});
