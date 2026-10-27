import { z } from "zod";
import { ApiError, handler, ok, readJson, requireAdmin } from "@/lib/api";
import { insensitive, prisma } from "@/lib/prisma";
import { scholarshipData, serializeScholarship } from "@/lib/scholarships";
import { slugify } from "@/lib/utils";
import { scholarshipSchema } from "@/lib/validators";

const listSchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/** Admin list includes inactive and closed scholarships. */
export const GET = handler(async (req) => {
  await requireAdmin();
  const { q, page, pageSize } = listSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const where = q
    ? { OR: [{ title: { contains: q, ...insensitive } }, { provider: { contains: q, ...insensitive } }] }
    : {};
  const [rows, total] = await Promise.all([
    prisma.scholarship.findMany({
      where,
      include: { rule: true, _count: { select: { saved: true, applications: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.scholarship.count({ where }),
  ]);
  return ok({
    items: rows.map((r) => ({ ...serializeScholarship(r), savedCount: r._count.saved, applicationCount: r._count.applications })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

export const POST = handler(async (req) => {
  await requireAdmin();
  const input = scholarshipSchema.parse(await readJson(req));
  const { scholarship, rule } = scholarshipData(input);

  const slug = slugify(input.title);
  if (await prisma.scholarship.findUnique({ where: { slug }, select: { id: true } })) {
    throw new ApiError(409, "CONFLICT", "A scholarship with this title already exists");
  }
  const row = await prisma.scholarship.create({
    data: { ...scholarship, slug, rule: { create: rule } },
    include: { rule: true },
  });
  return ok(serializeScholarship(row), { status: 201 });
});
