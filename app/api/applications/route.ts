import { ApiError, handler, ok, readJson, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { applicationInclude as include, serializeApplication as toDTO } from "@/lib/scholarships";
import { createApplicationSchema, updateApplicationSchema } from "@/lib/validators";

export const GET = handler(async () => {
  const user = await requireUser();
  const rows = await prisma.application.findMany({
    where: { userId: user.id },
    include,
    orderBy: [{ scholarship: { deadline: "asc" } }],
  });
  return ok(rows.map(toDTO));
});

export const POST = handler(async (req) => {
  const user = await requireUser();
  const { scholarshipId, status } = createApplicationSchema.parse(await readJson(req));

  const exists = await prisma.scholarship.findUnique({ where: { id: scholarshipId }, select: { id: true } });
  if (!exists) throw new ApiError(404, "NOT_FOUND", "Scholarship not found");

  const row = await prisma.application.upsert({
    where: { userId_scholarshipId: { userId: user.id, scholarshipId } },
    create: { userId: user.id, scholarshipId, status, appliedAt: status === "APPLIED" ? new Date() : null },
    update: { status },
    include,
  });
  return ok(toDTO(row), { status: 201 });
});

export const PATCH = handler(async (req) => {
  const user = await requireUser();
  const { id, status, outcome, notes } = updateApplicationSchema.parse(await readJson(req));

  // Scope by userId so users can only modify their own applications.
  const current = await prisma.application.findFirst({ where: { id, userId: user.id } });
  if (!current) throw new ApiError(404, "NOT_FOUND", "Application not found");

  const row = await prisma.application.update({
    where: { id },
    data: {
      status,
      outcome: status === "RESULT" ? (outcome ?? current.outcome) : null,
      ...(notes !== undefined ? { notes } : {}),
      appliedAt: status === "APPLIED" && !current.appliedAt ? new Date() : current.appliedAt,
    },
    include,
  });
  return ok(toDTO(row));
});
