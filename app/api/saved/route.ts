import { ApiError, handler, ok, readJson, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serializeScholarship } from "@/lib/scholarships";
import { savedSchema } from "@/lib/validators";

export const GET = handler(async () => {
  const user = await requireUser();
  const rows = await prisma.savedScholarship.findMany({
    where: { userId: user.id },
    include: { scholarship: { include: { rule: true } } },
    orderBy: { scholarship: { deadline: "asc" } },
  });
  return ok(rows.map((r) => ({ savedAt: r.createdAt.toISOString(), scholarship: serializeScholarship(r.scholarship) })));
});

/** Save a scholarship. Also places it in the tracker's "Saved" column if not tracked yet. */
export const POST = handler(async (req) => {
  const user = await requireUser();
  const { scholarshipId } = savedSchema.parse(await readJson(req));

  const exists = await prisma.scholarship.findFirst({ where: { id: scholarshipId, isActive: true }, select: { id: true } });
  if (!exists) throw new ApiError(404, "NOT_FOUND", "Scholarship not found");

  const key = { userId_scholarshipId: { userId: user.id, scholarshipId } };
  await prisma.$transaction([
    prisma.savedScholarship.upsert({ where: key, create: { userId: user.id, scholarshipId }, update: {} }),
    prisma.application.upsert({ where: key, create: { userId: user.id, scholarshipId, status: "SAVED" }, update: {} }),
  ]);
  return ok({ scholarshipId, saved: true }, { status: 201 });
});

/** Unsave. Removes the tracker card only if it never progressed past "Saved". */
export const DELETE = handler(async (req) => {
  const user = await requireUser();
  const fromQuery = new URL(req.url).searchParams.get("scholarshipId");
  const { scholarshipId } = savedSchema.parse(fromQuery ? { scholarshipId: fromQuery } : await readJson(req));

  await prisma.$transaction([
    prisma.savedScholarship.deleteMany({ where: { userId: user.id, scholarshipId } }),
    prisma.application.deleteMany({ where: { userId: user.id, scholarshipId, status: "SAVED" } }),
  ]);
  return ok({ scholarshipId, saved: false });
});
