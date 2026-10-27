import { evaluateCriteria } from "./rules";
import { INELIGIBLE_CAP, scoreFactors } from "./score";
import type { MatchProfile, MatchResult, MatchScholarship, MatchStatus } from "./types";

export * from "./types";
export { WEIGHTS, INELIGIBLE_CAP } from "./score";
export { toMatchProfile, toMatchScholarship, marksToPercent, ageFrom } from "./adapters";

/** Match one student against one scholarship. Pure and deterministic given `now`. */
export function matchScholarship(
  profile: MatchProfile,
  scholarship: MatchScholarship,
  now: Date = new Date(),
): MatchResult {
  const criteria = evaluateCriteria(profile, scholarship, now);
  const failed = criteria.filter((c) => c.status === "fail");
  const unknown = criteria.filter((c) => c.status === "unknown");

  const status: MatchStatus = failed.length > 0 ? "ineligible" : unknown.length > 0 ? "likely" : "eligible";

  const breakdown = scoreFactors(profile, scholarship, criteria, now);
  let score = Math.round(breakdown.reduce((sum, f) => sum + f.points, 0));
  if (status === "ineligible") score = Math.min(score, INELIGIBLE_CAP);

  return {
    scholarshipId: scholarship.id,
    status,
    score,
    reasons: criteria.filter((c) => c.status === "pass" && c.key !== "deadline").map((c) => c.message),
    missing: [...failed, ...unknown].map((c) => c.message),
    criteria,
    breakdown,
  };
}

export interface RankOptions {
  now?: Date;
  includeIneligible?: boolean;
}

/** Rank scholarships for a student: eligible first, then by score, then nearest deadline. */
export function rankMatches<S extends MatchScholarship>(
  profile: MatchProfile,
  scholarships: S[],
  { now = new Date(), includeIneligible = false }: RankOptions = {},
): Array<{ scholarship: S; match: MatchResult }> {
  const order: Record<MatchStatus, number> = { eligible: 0, likely: 1, ineligible: 2 };
  return scholarships
    .map((scholarship) => ({ scholarship, match: matchScholarship(profile, scholarship, now) }))
    .filter((m) => includeIneligible || m.match.status !== "ineligible")
    .sort(
      (a, b) =>
        order[a.match.status] - order[b.match.status] ||
        b.match.score - a.match.score ||
        a.scholarship.deadline.getTime() - b.scholarship.deadline.getTime(),
    );
}
