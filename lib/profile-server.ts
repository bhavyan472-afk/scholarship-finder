import "server-only";
import { prisma } from "@/lib/prisma";
import { EMPTY_PROFILE, type ProfileValues } from "@/lib/profile";

/** Load a profile row and shape it for ProfileForm. */
export async function getProfileFormValues(userId: string): Promise<ProfileValues> {
  const p = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!p) return EMPTY_PROFILE;
  return {
    country: p.country,
    state: p.state ?? "",
    gender: p.gender ?? "",
    dateOfBirth: p.dateOfBirth ? p.dateOfBirth.toISOString().slice(0, 10) : "",
    educationLevel: p.educationLevel ?? "",
    course: p.course ?? "",
    marksType: p.marksType === "CGPA" ? "CGPA" : "PERCENT",
    marks: p.marks == null ? "" : String(p.marks),
    familyIncome: p.familyIncome == null ? "" : String(p.familyIncome),
    category: p.category ?? "",
    isMinority: p.isMinority,
    disability: p.disability,
    emailReminders: p.emailReminders,
  };
}
