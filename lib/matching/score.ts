import type { CriterionResult, MatchProfile, MatchScholarship, ScoreFactor } from "./types";

// Soft scoring. Weights sum to 100; each factor yields a 0..1 ratio.
export const WEIGHTS = {
  fit: 40, // how well the student satisfies the rule set (and how targeted it is)
  academic: 20, // headroom above the marks bar
  need: 15, // financial-need alignment with the income limit
  value: 15, // award size
  timing: 10, // enough time left to apply comfortably
} as const;

/** Ineligible scholarships still get a score for sorting, but never above this. */
export const INELIGIBLE_CAP = 35;

const DAY = 86_400_000;
const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

export function fitRatio(criteria: CriterionResult[]): number {
  // The deadline is a gate, not a measure of fit.
  const rules = criteria.filter((c) => c.key !== "deadline");
  if (rules.length === 0) return 0.6; // open-to-all: fine, but not tailored to you
  const pass = rules.filter((c) => c.status === "pass").length;
  const unknown = rules.filter((c) => c.status === "unknown").length;
  const ratio = (pass + 0.4 * unknown) / rules.length;
  const targeted = Math.min(rules.length, 4) / 4; // more specific rules you meet = stronger signal
  return ratio * (0.75 + 0.25 * targeted);
}

export function academicRatio(p: MatchProfile, s: MatchScholarship): number {
  if (p.marksPercent == null) return 0.4;
  const min = s.rule?.minMarksPercent;
  if (min != null) {
    if (p.marksPercent < min) return 0;
    const headroom = min >= 100 ? 1 : (p.marksPercent - min) / (100 - min);
    return 0.6 + 0.4 * clamp(headroom);
  }
  return clamp((p.marksPercent - 40) / 55);
}

export function needRatio(p: MatchProfile, s: MatchScholarship): number {
  if (p.familyIncome == null) return 0.4;
  const max = s.rule?.maxFamilyIncome;
  if (max != null) {
    if (p.familyIncome > max) return 0;
    return 0.5 + 0.5 * clamp(1 - p.familyIncome / max);
  }
  return 0.6;
}

export function valueRatio(s: MatchScholarship): number {
  // Log scale: ₹5K → 0, ₹10L+ → 1.
  if (s.amountInr <= 5_000) return 0;
  return clamp(Math.log10(s.amountInr / 5_000) / Math.log10(1_000_000 / 5_000));
}

export function timingRatio(s: MatchScholarship, now: Date): number {
  const days = (s.deadline.getTime() - now.getTime()) / DAY;
  if (days < 0) return 0;
  if (days <= 2) return 0.3;
  if (days <= 7) return 0.7;
  if (days <= 60) return 1;
  if (days <= 120) return 0.85;
  return 0.7;
}

export function scoreFactors(
  p: MatchProfile,
  s: MatchScholarship,
  criteria: CriterionResult[],
  now: Date,
): ScoreFactor[] {
  const factor = (key: ScoreFactor["key"], label: string, ratio: number): ScoreFactor => ({
    key,
    label,
    weight: WEIGHTS[key],
    points: Math.round(WEIGHTS[key] * clamp(ratio) * 10) / 10,
  });
  return [
    factor("fit", "Eligibility fit", fitRatio(criteria)),
    factor("academic", "Academic strength", academicRatio(p, s)),
    factor("need", "Financial need", needRatio(p, s)),
    factor("value", "Award value", valueRatio(s)),
    factor("timing", "Time to apply", timingRatio(s, now)),
  ];
}
