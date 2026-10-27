import { getServerSession } from "next-auth";
import { handler, ok } from "@/lib/api";
import { authOptions } from "@/lib/auth";
import { searchScholarships } from "@/lib/scholarships";
import { scholarshipQuerySchema } from "@/lib/validators";

// Public. When signed in, results include personal match scores and saved state.
export const GET = handler(async (req) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const query = scholarshipQuerySchema.parse(params);
  const session = await getServerSession(authOptions);
  return ok(await searchScholarships(query, session?.user?.id));
});
