import { handler, ok, readJson, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validators";

export const GET = handler(async () => {
  const user = await requireUser();
  const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id } });
  return ok(profile);
});

export const PUT = handler(async (req) => {
  const user = await requireUser();
  const { completeOnboarding, ...input } = profileSchema.parse(await readJson(req));

  const data = {
    ...input,
    state: input.country === "IN" ? (input.state ?? null) : null,
    educationLevel: input.educationLevel ?? null,
    course: input.course ?? null,
    marks: input.marks ?? null,
    familyIncome: input.familyIncome ?? null,
    category: input.category ?? null,
    gender: input.gender ?? null,
    dateOfBirth: input.dateOfBirth ?? null,
  };

  const existing = await prisma.studentProfile.findUnique({ where: { userId: user.id }, select: { onboardedAt: true } });
  const onboardedAt = existing?.onboardedAt ?? (completeOnboarding ? new Date() : null);

  const profile = await prisma.studentProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data, onboardedAt },
    update: { ...data, onboardedAt },
  });
  return ok(profile);
});
