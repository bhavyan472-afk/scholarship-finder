import "server-only";
import type { Prisma } from "@prisma/client";
import type { ApplicationStatus, Outcome, ProviderType } from "@/lib/constants";
import { parseList } from "@/lib/json";
import {
  matchScholarship,
  toMatchProfile,
  toMatchScholarship,
  type MatchProfile,
  type MatchResult,
} from "@/lib/matching";
import { toMatchRule } from "@/lib/matching/adapters";
import { insensitive, prisma } from "@/lib/prisma";
import type { ScholarshipQuery } from "@/lib/validators";
import type { ApplicationDTO, MatchSummary, Paginated, ScholarshipDTO, ScholarshipListItem } from "@/types";

// Shared data access for scholarships — used by API routes and server components alike.

export type ScholarshipWithRule = Prisma.ScholarshipGetPayload<{ include: { rule: true } }>;

export function serializeScholarship(s: ScholarshipWithRule): ScholarshipDTO {
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    provider: s.provider,
    providerType: s.providerType as ProviderType,
    description: s.description,
    amountInr: s.amountInr,
    amountLabel: s.amountLabel,
    deadline: s.deadline.toISOString(),
    applyUrl: s.applyUrl,
    documents: parseList(s.documents),
    benefits: parseList(s.benefits),
    tags: parseList(s.tags),
    featured: s.featured,
    isActive: s.isActive,
    lastVerifiedAt: s.lastVerifiedAt?.toISOString() ?? null,
    rule: toMatchRule(s.rule),
  };
}

export const applicationInclude = { scholarship: { include: { rule: true } } } as const;
type ApplicationWithScholarship = Prisma.ApplicationGetPayload<{ include: typeof applicationInclude }>;

export function serializeApplication(a: ApplicationWithScholarship): ApplicationDTO {
  return {
    id: a.id,
    status: a.status as ApplicationStatus,
    outcome: a.outcome as Outcome | null,
    notes: a.notes,
    updatedAt: a.updatedAt.toISOString(),
    scholarship: serializeScholarship(a.scholarship),
  };
}

export const summarize = (m: MatchResult): MatchSummary => ({
  score: m.score,
  status: m.status,
  reasons: m.reasons.slice(0, 3),
  missing: m.missing.slice(0, 3),
});

export async function getMatchProfile(userId: string | undefined): Promise<MatchProfile | null> {
  if (!userId) return null;
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  return profile ? toMatchProfile(profile) : null;
}

async function savedIds(userId: string | undefined): Promise<Set<string>> {
  if (!userId) return new Set();
  const rows = await prisma.savedScholarship.findMany({ where: { userId }, select: { scholarshipId: true } });
  return new Set(rows.map((r) => r.scholarshipId));
}

/** Matches JSON-list columns that either contain `value` or are unrestricted ("[]"). */
const listAllows = (field: "educationLevels" | "states", value: string): Prisma.EligibilityRuleWhereInput => ({
  OR: [{ [field]: { contains: `"${value}"` } }, { [field]: "[]" }],
});

export async function searchScholarships(
  query: ScholarshipQuery,
  userId?: string,
  now: Date = new Date(),
): Promise<Paginated<ScholarshipListItem>> {
  const and: Prisma.ScholarshipWhereInput[] = [{ isActive: true }, { deadline: { gte: now } }];

  if (query.q) {
    and.push({
      OR: [
        { title: { contains: query.q, ...insensitive } },
        { provider: { contains: query.q, ...insensitive } },
        { description: { contains: query.q, ...insensitive } },
        { tags: { contains: query.q, ...insensitive } },
      ],
    });
  }
  if (query.providerType.length) and.push({ providerType: { in: query.providerType } });
  if (query.minAmount != null) and.push({ amountInr: { gte: query.minAmount } });
  if (query.maxAmount != null) and.push({ amountInr: { lte: query.maxAmount } });
  if (query.deadlineWithin) {
    and.push({ deadline: { lte: new Date(now.getTime() + query.deadlineWithin * 86_400_000) } });
  }
  if (query.level.length) {
    and.push({ OR: [{ rule: { is: null } }, { rule: { OR: query.level.map((l) => listAllows("educationLevels", l)) } }] });
  }
  if (query.state) {
    and.push({ OR: [{ rule: { is: null } }, { rule: listAllows("states", query.state) }] });
  }

  // The catalogue is small (hundreds of rows), so match scoring and sorting happen in memory.
  // For very large catalogues, precompute scores per user into a table instead.
  const [rows, profile, saved] = await Promise.all([
    prisma.scholarship.findMany({ where: { AND: and }, include: { rule: true }, take: 1000 }),
    getMatchProfile(userId),
    savedIds(userId),
  ]);

  let items: ScholarshipListItem[] = rows.map((row) => ({
    ...serializeScholarship(row),
    match: profile ? summarize(matchScholarship(profile, toMatchScholarship(row), now)) : null,
    saved: saved.has(row.id),
  }));

  if (query.eligibleOnly && profile) items = items.filter((i) => i.match?.status !== "ineligible");

  const byDeadline = (a: ScholarshipListItem, b: ScholarshipListItem) => a.deadline.localeCompare(b.deadline);
  if (query.sort === "amount") items.sort((a, b) => b.amountInr - a.amountInr || byDeadline(a, b));
  else if (query.sort === "match" && profile)
    items.sort((a, b) => (b.match?.score ?? 0) - (a.match?.score ?? 0) || byDeadline(a, b));
  else items.sort(byDeadline);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const start = (query.page - 1) * query.pageSize;
  return { items: items.slice(start, start + query.pageSize), total, page: query.page, pageSize: query.pageSize, totalPages };
}

export async function getScholarship(idOrSlug: string) {
  return prisma.scholarship.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: { rule: true },
  });
}

/** Ranked matches for a user (eligible + likely). */
export async function getMatchesForUser(userId: string, limit = 50, now: Date = new Date()) {
  const [profile, rows, saved] = await Promise.all([
    getMatchProfile(userId),
    prisma.scholarship.findMany({ where: { isActive: true, deadline: { gte: now } }, include: { rule: true } }),
    savedIds(userId),
  ]);
  if (!profile) return { profile: null, matches: [] as Array<ScholarshipListItem & { match: MatchSummary }> };

  const matches = rows
    .map((row) => ({ row, match: matchScholarship(profile, toMatchScholarship(row), now) }))
    .filter((m) => m.match.status !== "ineligible")
    .sort((a, b) => b.match.score - a.match.score || a.row.deadline.getTime() - b.row.deadline.getTime())
    .slice(0, limit)
    .map(({ row, match }) => ({ ...serializeScholarship(row), match: summarize(match), saved: saved.has(row.id) }));

  return { profile, matches };
}

export { scholarshipData } from "@/lib/scholarship-data";
