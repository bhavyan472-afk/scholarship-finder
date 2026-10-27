// Turns a free-text self-description ("B.Tech, Telangana, 82%") into onboarding prefill values,
// carried as URL search params from the landing page to /onboarding. Pure; safe on client and server.

import {
  CATEGORIES,
  COURSES,
  EDUCATION_LEVELS,
  GENDERS,
  INDIAN_STATES,
  STATE_CODES,
  type Category,
  type Course,
  type EducationLevel,
  type Gender,
  type StateCode,
} from "@/lib/constants";
import type { ProfileValues } from "@/lib/profile";

export interface ProfilePrefill {
  level?: EducationLevel;
  course?: Course;
  state?: StateCode;
  marks?: number;
  marksType?: "PERCENT" | "CGPA";
  gender?: Gender;
  category?: Category;
  income?: number;
}

// Degree tokens map to a level and (where implied) a course. Checked in order; first hit wins.
const DEGREES: Array<[RegExp, EducationLevel, Course | undefined]> = [
  [/\bph\.?\s?d\b|\bdoctoral\b/, "PHD", undefined],
  [/\bm\.?\s?tech\b|\bm\.?\s?e\b(?!\w)/, "PG", "ENGINEERING"],
  [/\bmba\b|\bpgdm\b/, "PG", "MANAGEMENT"],
  [/\bm\.?\s?sc\b/, "PG", "SCIENCE"],
  [/\bm\.?\s?com\b/, "PG", "COMMERCE"],
  [/\bllm\b/, "PG", "LAW"],
  [/\bm\.?\s?a\b(?!\w)/, "PG", "ARTS"],
  [/\bb\.?\s?tech\b|\bb\.?\s?e\b(?!\w)/, "UG", "ENGINEERING"],
  [/\bmbbs\b|\bbds\b|\bbams\b|\bbhms\b|\bb\.?\s?pharm\w*|\bnursing\b/, "UG", "MEDICAL"],
  [/\bbba\b|\bbms\b/, "UG", "MANAGEMENT"],
  [/\bllb\b/, "UG", "LAW"],
  [/\bb\.?\s?sc\b/, "UG", "SCIENCE"],
  [/\bb\.?\s?com\b/, "UG", "COMMERCE"],
  [/\bb\.?\s?a\b(?!\w)/, "UG", "ARTS"],
  [/\bdiploma\b|\bpolytechnic\b/, "DIPLOMA", undefined],
  [/\b(?:class|std|grade)\s?12\b|\b12th\b|\bintermediate\b|\binter\b|\bhsc\b|\bpuc\b/, "CLASS_12", undefined],
  [/\b(?:class|std|grade)\s?10\b|\b10th\b|\bssc\b|\bmatric\b/, "CLASS_10", undefined],
  [/\bpost\s?grad\w*|\bmasters?\b|\bpg\b/, "PG", undefined],
  [/\bunder\s?grad\w*|\bbachelors?\b|\bug\b|\bdegree\b/, "UG", undefined],
];

const COURSE_WORDS: Array<[RegExp, Course]> = [
  [/\bengineer\w*|\bcse\b|\bece\b|\bmechanical\b|\bcivil\b|\bcomputer science\b/, "ENGINEERING"],
  [/\bmedic\w*|\bdoctor\b|\bdental\b|\bpharm\w*/, "MEDICAL"],
  [/\bscience\b|\bphysics\b|\bchemistry\b|\bmaths?\b|\bbiology\b/, "SCIENCE"],
  [/\bcommerce\b|\baccount\w*|\bca\b|\bfinance\b/, "COMMERCE"],
  [/\barts?\b|\bhumanities\b|\bhistory\b|\benglish\b|\beconomics\b/, "ARTS"],
  [/\blaw\b|\blegal\b/, "LAW"],
  [/\bmanagement\b|\bbusiness\b/, "MANAGEMENT"],
  [/\bagri\w*|\bhorticulture\b|\bveterinary\b/, "AGRICULTURE"],
];

const STATE_ALIASES: Record<string, StateCode> = {
  orissa: "OR",
  bengal: "WB",
  pondicherry: "PY",
  "j&k": "JK",
  kashmir: "JK",
  bombay: "MH",
  "new delhi": "DL",
};

export function parseProfileText(input: string): ProfilePrefill {
  let text = ` ${input.toLowerCase().replace(/\s+/g, " ")} `;
  const out: ProfilePrefill = {};

  for (const [re, level, course] of DEGREES) {
    const m = text.match(re);
    if (!m) continue;
    out.level = level;
    if (course) out.course = course;
    // Remove the degree so "B.Sc" can't later read as category "SC".
    text = text.replace(re, " ");
    break;
  }
  if (!out.course) out.course = COURSE_WORDS.find(([re]) => re.test(text))?.[1];

  // Longest names first so "Andhra Pradesh" wins over a partial match.
  const states = [
    ...STATE_CODES.map((code) => [INDIAN_STATES[code].toLowerCase().replace(" & ", " and "), code] as const),
    ...STATE_CODES.map((code) => [INDIAN_STATES[code].toLowerCase(), code] as const),
    ...Object.entries(STATE_ALIASES),
  ].sort((a, b) => b[0].length - a[0].length);
  const state = states.find(([name]) => text.includes(name));
  if (state) out.state = state[1] as StateCode;

  const cgpa = text.match(/(\d{1,2}(?:\.\d{1,2})?)\s*(?:\/\s*10\s*)?(?:cgpa|gpa|cpi|sgpa)\b|\b(?:cgpa|gpa|cpi|sgpa)\s*:?\s*(\d{1,2}(?:\.\d{1,2})?)/);
  const percent = text.match(/(\d{2,3}(?:\.\d{1,2})?)\s*(?:%|percent\b|per cent\b)/);
  if (cgpa) {
    const value = Number(cgpa[1] ?? cgpa[2]);
    if (value >= 0 && value <= 10) Object.assign(out, { marks: value, marksType: "CGPA" });
  } else if (percent) {
    const value = Number(percent[1]);
    if (value >= 0 && value <= 100) Object.assign(out, { marks: value, marksType: "PERCENT" });
  }

  const income = text.match(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|lpa|l)\b/);
  if (income) out.income = Math.round(Number(income[1]) * 100_000);

  if (/\b(?:girl|female|woman|women|she)\b/.test(text)) out.gender = "FEMALE";
  else if (/\b(?:boy|male|man|he)\b/.test(text)) out.gender = "MALE";

  const category = text.match(/(?<![.\w])(sc|st|obc|ews|general)\b/);
  if (category) out.category = category[1].toUpperCase() as Category;

  return out;
}

/** Prefill → URL search params for /onboarding. */
export function prefillToParams(p: ProfilePrefill): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(p)) if (value !== undefined) params.set(key, String(value));
  return params;
}

const pick = <T extends string>(values: readonly T[], v: unknown): T | undefined =>
  typeof v === "string" && (values as readonly string[]).includes(v) ? (v as T) : undefined;

/** Untrusted search params → validated prefill. Anything unrecognised is dropped. */
export function prefillFromParams(params: Record<string, string | string[] | undefined>): ProfilePrefill {
  const get = (k: string) => (Array.isArray(params[k]) ? params[k]?.[0] : params[k]);
  const marksType = pick(["PERCENT", "CGPA"] as const, get("marksType")) ?? "PERCENT";
  const marks = Number(get("marks"));
  const income = Number(get("income"));
  return {
    level: pick(EDUCATION_LEVELS, get("level")),
    course: pick(COURSES, get("course")),
    state: pick(STATE_CODES, get("state")),
    gender: pick(GENDERS, get("gender")),
    category: pick(CATEGORIES, get("category")),
    ...(get("marks") && marks >= 0 && marks <= (marksType === "CGPA" ? 10 : 100) ? { marks, marksType } : {}),
    ...(get("income") && Number.isInteger(income) && income >= 0 && income <= 1_000_000_000 ? { income } : {}),
  };
}

/** Fill only the form fields the student hasn't already answered. */
export function applyPrefill(values: ProfileValues, p: ProfilePrefill): ProfileValues {
  const next = { ...values };
  if (p.level && !next.educationLevel) next.educationLevel = p.level;
  if (p.course && !next.course) next.course = p.course;
  if (p.state && !next.state && next.country === "IN") next.state = p.state;
  if (p.gender && !next.gender) next.gender = p.gender;
  if (p.category && !next.category) next.category = p.category;
  if (p.marks !== undefined && next.marks === "") {
    next.marks = String(p.marks);
    next.marksType = p.marksType ?? "PERCENT";
  }
  if (p.income !== undefined && next.familyIncome === "") next.familyIncome = String(p.income);
  return next;
}
