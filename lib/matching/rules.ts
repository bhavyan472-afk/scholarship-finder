import { COUNTRIES, INDIAN_STATES, LABELS } from "@/lib/constants";
import { formatDate, formatInrCompact } from "@/lib/utils";
import type { CriterionResult, MatchProfile, MatchRule, MatchScholarship } from "./types";

// Hard filters. Each returns null when the rule doesn't restrict that dimension.

type Check = (p: MatchProfile, r: MatchRule, s: MatchScholarship, now: Date) => CriterionResult | null;

const list = (values: readonly string[], dict: Record<string, string>) =>
  values.map((v) => dict[v] ?? v).join(", ");

const stateName = (code: string) => (INDIAN_STATES as Record<string, string>)[code] ?? code;
const countryName = (code: string) => (COUNTRIES as Record<string, string>)[code] ?? code;

const deadline: Check = (_p, _r, s, now) => {
  const open = s.deadline.getTime() >= now.getTime();
  return {
    key: "deadline",
    label: "Deadline",
    status: open ? "pass" : "fail",
    message: open
      ? `Applications open until ${formatDate(s.deadline)}`
      : `Applications closed on ${formatDate(s.deadline)}`,
  };
};

const income: Check = (p, r) => {
  if (r.maxFamilyIncome == null) return null;
  const limit = formatInrCompact(r.maxFamilyIncome);
  if (p.familyIncome == null)
    return { key: "income", label: "Family income", status: "unknown", message: `Add your family income to check the ${limit}/yr limit` };
  return p.familyIncome <= r.maxFamilyIncome
    ? { key: "income", label: "Family income", status: "pass", message: `Family income ${formatInrCompact(p.familyIncome)} is within the ${limit} limit` }
    : { key: "income", label: "Family income", status: "fail", message: `Family income must be under ${limit}/yr — yours is ${formatInrCompact(p.familyIncome)}` };
};

const marks: Check = (p, r) => {
  if (r.minMarksPercent == null) return null;
  const min = r.minMarksPercent;
  if (p.marksPercent == null)
    return { key: "marks", label: "Academic score", status: "unknown", message: `Add your marks to check the ${min}% minimum` };
  const you = Math.round(p.marksPercent * 10) / 10;
  return p.marksPercent >= min
    ? { key: "marks", label: "Academic score", status: "pass", message: `Your ${you}% clears the ${min}% minimum` }
    : { key: "marks", label: "Academic score", status: "fail", message: `Requires at least ${min}% — you have ${you}%` };
};

const category: Check = (p, r) => {
  if (r.categories.length === 0) return null;
  const allowed = list(r.categories, LABELS.category);
  if (!p.category)
    return { key: "category", label: "Category", status: "unknown", message: `Add your category — open to ${allowed}` };
  return r.categories.includes(p.category)
    ? { key: "category", label: "Category", status: "pass", message: `Reserved for ${allowed} students — you qualify` }
    : { key: "category", label: "Category", status: "fail", message: `Only for ${allowed} students` };
};

const minority: Check = (p, r) => {
  if (!r.minorityOnly) return null;
  return p.isMinority
    ? { key: "minority", label: "Minority community", status: "pass", message: "For minority-community students — you qualify" }
    : { key: "minority", label: "Minority community", status: "fail", message: "Only for notified minority communities" };
};

const state: Check = (p, r) => {
  if (r.states.length === 0) return null;
  const allowed = r.states.map(stateName).join(", ");
  if (!p.state)
    return { key: "state", label: "State", status: "unknown", message: `Add your state — open to residents of ${allowed}` };
  return r.states.includes(p.state)
    ? { key: "state", label: "State", status: "pass", message: `Open to residents of ${stateName(p.state)}` }
    : { key: "state", label: "State", status: "fail", message: `Only for residents of ${allowed}` };
};

const gender: Check = (p, r) => {
  if (r.genders.length === 0) return null;
  const allowed = list(r.genders, LABELS.gender).toLowerCase();
  if (!p.gender)
    return { key: "gender", label: "Gender", status: "unknown", message: `Add your gender — for ${allowed} students` };
  return r.genders.includes(p.gender)
    ? { key: "gender", label: "Gender", status: "pass", message: `For ${allowed} students` }
    : { key: "gender", label: "Gender", status: "fail", message: `Only for ${allowed} students` };
};

const course: Check = (p, r) => {
  if (r.courses.length === 0) return null;
  const allowed = list(r.courses, LABELS.course);
  if (!p.course)
    return { key: "course", label: "Course", status: "unknown", message: `Add your course — covers ${allowed}` };
  return r.courses.includes(p.course)
    ? { key: "course", label: "Course", status: "pass", message: `Covers ${LABELS.course[p.course]}` }
    : { key: "course", label: "Course", status: "fail", message: `Only for ${allowed}` };
};

const level: Check = (p, r) => {
  if (r.educationLevels.length === 0) return null;
  const allowed = list(r.educationLevels, LABELS.educationLevel);
  if (!p.educationLevel)
    return { key: "level", label: "Education level", status: "unknown", message: `Add your education level — for ${allowed}` };
  return r.educationLevels.includes(p.educationLevel)
    ? { key: "level", label: "Education level", status: "pass", message: `For ${LABELS.educationLevel[p.educationLevel]} students` }
    : { key: "level", label: "Education level", status: "fail", message: `Only for ${allowed}` };
};

const country: Check = (p, r) => {
  if (r.countries.length === 0) return null;
  const allowed = r.countries.map(countryName).join(", ");
  if (!p.country)
    return { key: "country", label: "Nationality", status: "unknown", message: `Add your nationality — open to ${allowed}` };
  return r.countries.includes(p.country)
    ? { key: "country", label: "Nationality", status: "pass", message: `Open to ${countryName(p.country)} nationals` }
    : { key: "country", label: "Nationality", status: "fail", message: `Only for nationals of ${allowed}` };
};

const disability: Check = (p, r) => {
  if (!r.disabilityRequired) return null;
  return p.disability
    ? { key: "disability", label: "Disability", status: "pass", message: "For students with disabilities — you qualify" }
    : { key: "disability", label: "Disability", status: "fail", message: "Only for students with benchmark disabilities (40%+)" };
};

const age: Check = (p, r) => {
  if (r.minAge == null && r.maxAge == null) return null;
  const range =
    r.minAge != null && r.maxAge != null
      ? `${r.minAge}–${r.maxAge}`
      : r.minAge != null
        ? `${r.minAge}+`
        : `up to ${r.maxAge}`;
  if (p.age == null)
    return { key: "age", label: "Age", status: "unknown", message: `Add your date of birth — age limit ${range}` };
  const ok = (r.minAge == null || p.age >= r.minAge) && (r.maxAge == null || p.age <= r.maxAge);
  return ok
    ? { key: "age", label: "Age", status: "pass", message: `Your age fits the ${range} limit` }
    : { key: "age", label: "Age", status: "fail", message: `Age limit is ${range} — you are ${p.age}` };
};

export const CHECKS: Check[] = [
  deadline,
  country,
  level,
  course,
  marks,
  income,
  category,
  minority,
  state,
  gender,
  disability,
  age,
];

export const EMPTY_RULE: MatchRule = {
  categories: [],
  minorityOnly: false,
  states: [],
  genders: [],
  courses: [],
  educationLevels: [],
  countries: [],
  disabilityRequired: false,
};

export function evaluateCriteria(
  profile: MatchProfile,
  scholarship: MatchScholarship,
  now: Date,
): CriterionResult[] {
  const rule = scholarship.rule ?? EMPTY_RULE;
  return CHECKS.map((check) => check(profile, rule, scholarship, now)).filter(
    (c): c is CriterionResult => c !== null,
  );
}
