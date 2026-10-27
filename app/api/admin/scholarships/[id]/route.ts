import { ApiError, handler, ok, readJson, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { scholarshipData, serializeScholarship } from "@/lib/scholarships";
import { scholarshipSchema } from "@/lib/validators";

type Ctx = { params: { id: string } };

async function findOrThrow(id: string) {
  const row = await prisma.scholarship.findUnique({ where: { id }, include: { rule: true } });
  if (!row) throw new ApiError(404, "NOT_FOUND", "Scholarship not found");
  return row;
}

export const GET = handler<Ctx>(async (_req, { params }) => {
  await requireAdmin();
  return ok(serializeScholarship(await findOrThrow(params.id)));
});

export const PUT = handler<Ctx>(async (req, { params }) => {
  await requireAdmin();
  await findOrThrow(params.id);
  const { scholarship, rule } = scholarshipData(scholarshipSchema.parse(await readJson(req)));
  // Slug stays stable on edit so shared links keep working.
  const row = await prisma.scholarship.update({
    where: { id: params.id },
    data: { ...scholarship, rule: { upsert: { create: rule, update: rule } } },
    include: { rule: true },
  });
  return ok(serializeScholarship(row));
});

export const DELETE = handler<Ctx>(async (_req, { params }) => {
  await requireAdmin();
  await findOrThrow(params.id);
  await prisma.scholarship.delete({ where: { id: params.id } });
  return ok({ id: params.id, deleted: true });
});
