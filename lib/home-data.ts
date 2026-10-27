import "server-only";
import { LABELS } from "@/lib/constants";
import { prisma, withDbFallback } from "@/lib/prisma";
import { serializeScholarship } from "@/lib/scholarships";
import { formatInrCompact } from "@/lib/utils";
import type { ScholarshipListItem } from "@/types";

// Everything the landing page shows that comes from the database, derived from one query over
// the open catalogue (small — hundreds of rows — so grouping happens in memory).

export interface HomeCategory {
  id: "government" | "private" | "international" | "women" | "merit";
  label: string;
  href: string;
  items: ScholarshipListItem[];
}

/** Compact shape for the decorative hero cards and the marquee. */
export interface HomeTeaser {
  title: string;
  provider: string;
  amount: string;
  deadline: string;
  reasons: string[];
}

export interface HomeData {
  openCount: number;
  totalValue: number;
  providerCount: number;
  teasers: HomeTeaser[];
  categories: HomeCategory[];
}

const PER_CATEGORY = 8;

function reasonsFor(s: ScholarshipListItem): string[] {
  const r = s.rule;
  const out: string[] = [];
  if (r?.maxFamilyIncome) out.push(`Family income within the ${formatInrCompact(r.maxFamilyIncome)} limit`);
  if (r?.educationLevels.length) out.push(`Open to ${r.educationLevels.map((l) => LABELS.educationLevel[l]).slice(0, 2).join(" · ")}`);
  if (r?.minMarksPercent) out.push(`Minimum ${r.minMarksPercent}% marks — met`);
  if (r?.genders.length === 1 && r.genders[0] === "FEMALE") out.push("For female students");
  if (out.length < 3) out.push(`${LABELS.providerType[s.providerType]} scheme`);
  return out.slice(0, 3);
}

async function queryHomeData(now: Date): Promise<HomeData> {
  const rows = await prisma.scholarship.findMany({
    where: { isActive: true, deadline: { gte: now } },
    include: { rule: true },
    orderBy: [{ featured: "desc" }, { deadline: "asc" }],
    take: 1000,
  });
  const items: ScholarshipListItem[] = rows.map((row) => ({ ...serializeScholarship(row), match: null, saved: false }));

  const group = (id: HomeCategory["id"], label: string, href: string, test: (s: ScholarshipListItem) => boolean): HomeCategory => ({
    id,
    label,
    href,
    items: items.filter(test).slice(0, PER_CATEGORY),
  });

  return {
    openCount: items.length,
    totalValue: items.reduce((sum, s) => sum + s.amountInr, 0),
    providerCount: new Set(items.map((s) => s.provider)).size,
    teasers: items.slice(0, 24).map((s) => ({
      title: s.title,
      provider: s.provider,
      amount: s.amountLabel && s.amountLabel.length <= 28 ? s.amountLabel : formatInrCompact(s.amountInr),
      deadline: s.deadline,
      reasons: reasonsFor(s),
    })),
    categories: [
      group("government", "Government", "/scholarships?providerType=GOVERNMENT", (s) => s.providerType === "GOVERNMENT"),
      group("private", "Private", "/scholarships?providerType=PRIVATE", (s) => s.providerType === "PRIVATE"),
      group("international", "International", "/scholarships?providerType=INTERNATIONAL", (s) => s.providerType === "INTERNATIONAL"),
      group("women", "For women", "/scholarships?q=women", (s) => s.rule?.genders.length === 1 && s.rule.genders[0] === "FEMALE"),
      group("merit", "Merit-based", "/scholarships?q=merit", (s) => (s.rule?.minMarksPercent ?? 0) >= 60 || s.tags.includes("merit")),
    ].filter((c) => c.items.length > 0),
  };
}

/** Null when the database is unreachable — the static parts of the page still render. */
export const getHomeData = (now: Date = new Date()) => withDbFallback(() => queryHomeData(now), null);
