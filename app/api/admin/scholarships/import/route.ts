import { ApiError, handler, ok, requireAdmin } from "@/lib/api";
import { CSV_TEMPLATE, parseScholarshipCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import { scholarshipData } from "@/lib/scholarships";
import { slugify } from "@/lib/utils";

const MAX_BYTES = 2 * 1024 * 1024;

/** Download the CSV template. */
export const GET = handler(async () => {
  await requireAdmin();
  return new Response(CSV_TEMPLATE, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="scholarships-template.csv"',
    },
  });
});

/**
 * Bulk import. Accepts multipart/form-data (field "file") or a raw text/csv body.
 * Valid rows are upserted by slug; invalid rows are reported without aborting the import.
 */
export const POST = handler(async (req) => {
  await requireAdmin();

  let text: string;
  if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
    const file = (await req.formData()).get("file");
    if (!(file instanceof File)) throw new ApiError(400, "BAD_REQUEST", 'Attach a CSV file in the "file" field');
    if (file.size > MAX_BYTES) throw new ApiError(400, "BAD_REQUEST", "CSV must be under 2 MB");
    text = await file.text();
  } else {
    text = await req.text();
    if (text.length > MAX_BYTES) throw new ApiError(400, "BAD_REQUEST", "CSV must be under 2 MB");
  }
  if (!text.trim()) throw new ApiError(400, "BAD_REQUEST", "CSV is empty");

  const { rows, errors } = parseScholarshipCsv(text);
  let created = 0;
  let updated = 0;

  for (const input of rows) {
    const { scholarship, rule } = scholarshipData(input);
    const slug = slugify(input.title);
    const existing = await prisma.scholarship.findUnique({ where: { slug }, select: { id: true } });
    await prisma.scholarship.upsert({
      where: { slug },
      create: { ...scholarship, slug, rule: { create: rule } },
      update: { ...scholarship, rule: { upsert: { create: rule, update: rule } } },
    });
    if (existing) updated++;
    else created++;
  }

  return ok({ created, updated, failed: errors.length, errors: errors.slice(0, 50) });
});
