import type { Category, Course, EducationLevel, Gender } from "@/lib/constants";

/** Student data the engine needs. Every field except the booleans may be unknown. */
export interface MatchProfile {
  country?: string | null;
  state?: string | null;
  educationLevel?: EducationLevel | null;
  course?: Course | null;
  marksPercent?: number | null;
  familyIncome?: number | null;
  category?: Category | null;
  isMinority?: boolean;
  gender?: Gender | null;
  disability?: boolean;
  age?: number | null;
}

/** Eligibility rules. Empty arrays / null mean "no restriction". */
export interface MatchRule {
  maxFamilyIncome?: number | null;
  minMarksPercent?: number | null;
  categories: Category[];
  minorityOnly: boolean;
  states: string[];
  genders: Gender[];
  courses: Course[];
  educationLevels: EducationLevel[];
  countries: string[];
  disabilityRequired: boolean;
  minAge?: number | null;
  maxAge?: number | null;
}

export interface MatchScholarship {
  id: string;
  amountInr: number;
  deadline: Date;
  rule: MatchRule | null;
}

export type CriterionKey =
  | "deadline"
  | "income"
  | "marks"
  | "category"
  | "minority"
  | "state"
  | "gender"
  | "course"
  | "level"
  | "country"
  | "disability"
  | "age";

/** pass = satisfied, fail = hard filter rejects, unknown = profile field missing. */
export type CriterionStatus = "pass" | "fail" | "unknown";

export interface CriterionResult {
  key: CriterionKey;
  label: string;
  status: CriterionStatus;
  message: string;
}

export type ScoreFactorKey = "fit" | "academic" | "need" | "value" | "timing";

export interface ScoreFactor {
  key: ScoreFactorKey;
  label: string;
  weight: number; // max points
  points: number; // earned points, 0..weight
}

/**
 * eligible   – every specified rule passes
 * likely     – nothing fails, but some rules can't be checked (missing profile data)
 * ineligible – at least one hard filter fails (incl. closed deadline)
 */
export type MatchStatus = "eligible" | "likely" | "ineligible";

export interface MatchResult {
  scholarshipId: string;
  status: MatchStatus;
  score: number; // 0..100
  reasons: string[]; // why you match
  missing: string[]; // what fails or what we still need from you
  criteria: CriterionResult[];
  breakdown: ScoreFactor[];
}
