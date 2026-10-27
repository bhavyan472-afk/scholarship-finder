import { toList } from "@/lib/json";
import type { ScholarshipInput } from "@/lib/validators";

/** Prisma data for create/update from a validated admin payload. */
export function scholarshipData(input: ScholarshipInput) {
  const { rule, documents, benefits, tags, ...rest } = input;
  return {
    scholarship: {
      ...rest,
      amountLabel: rest.amountLabel ?? null,
      documents: toList(documents),
      benefits: toList(benefits),
      tags: toList(tags),
    },
    rule: {
      maxFamilyIncome: rule.maxFamilyIncome ?? null,
      minMarksPercent: rule.minMarksPercent ?? null,
      categories: toList(rule.categories),
      minorityOnly: rule.minorityOnly,
      states: toList(rule.states),
      genders: toList(rule.genders),
      courses: toList(rule.courses),
      educationLevels: toList(rule.educationLevels),
      countries: toList(rule.countries),
      disabilityRequired: rule.disabilityRequired,
      minAge: rule.minAge ?? null,
      maxAge: rule.maxAge ?? null,
    },
  };
}
