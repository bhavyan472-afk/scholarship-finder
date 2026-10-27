import type { Category, Course, EducationLevel, Gender } from "@/lib/constants";
import { parseList } from "@/lib/json";
import type { MatchProfile, MatchRule, MatchScholarship } from "./types";

// Convert DB rows (strings + JSON lists) into the engine's typed shapes.
// Typed structurally so this module never imports Prisma.

/** CGPA on a 10-point scale → percentage (CBSE convention ×9.5). */
export function marksToPercent(marks: number | null | undefined, type: string | null | undefined) {
  if (marks == null) return null;
  return type === "CGPA" ? Math.min(100, Math.round(marks * 9.5 * 10) / 10) : marks;
}

export function ageFrom(dob: Date | null | undefined, now: Date = new Date()): number | null {
  if (!dob) return null;
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

interface ProfileRow {
  country: string | null;
  state: string | null;
  educationLevel: string | null;
  course: string | null;
  marks: number | null;
  marksType: string | null;
  familyIncome: number | null;
  category: string | null;
  isMinority: boolean;
  gender: string | null;
  disability: boolean;
  dateOfBirth: Date | null;
}

export function toMatchProfile(row: ProfileRow | null | undefined, now: Date = new Date()): MatchProfile {
  if (!row) return {};
  return {
    country: row.country,
    state: row.state,
    educationLevel: row.educationLevel as EducationLevel | null,
    course: row.course as Course | null,
    marksPercent: marksToPercent(row.marks, row.marksType),
    familyIncome: row.familyIncome,
    category: row.category as Category | null,
    isMinority: row.isMinority,
    gender: row.gender as Gender | null,
    disability: row.disability,
    age: ageFrom(row.dateOfBirth, now),
  };
}

interface RuleRow {
  maxFamilyIncome: number | null;
  minMarksPercent: number | null;
  categories: string;
  minorityOnly: boolean;
  states: string;
  genders: string;
  courses: string;
  educationLevels: string;
  countries: string;
  disabilityRequired: boolean;
  minAge: number | null;
  maxAge: number | null;
}

export function toMatchRule(row: RuleRow | null | undefined): MatchRule | null {
  if (!row) return null;
  return {
    maxFamilyIncome: row.maxFamilyIncome,
    minMarksPercent: row.minMarksPercent,
    categories: parseList<Category>(row.categories),
    minorityOnly: row.minorityOnly,
    states: parseList(row.states),
    genders: parseList<Gender>(row.genders),
    courses: parseList<Course>(row.courses),
    educationLevels: parseList<EducationLevel>(row.educationLevels),
    countries: parseList(row.countries),
    disabilityRequired: row.disabilityRequired,
    minAge: row.minAge,
    maxAge: row.maxAge,
  };
}

export function toMatchScholarship(row: {
  id: string;
  amountInr: number;
  deadline: Date;
  rule: RuleRow | null;
}): MatchScholarship {
  return { id: row.id, amountInr: row.amountInr, deadline: row.deadline, rule: toMatchRule(row.rule) };
}
