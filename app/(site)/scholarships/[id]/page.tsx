import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft, CircleCheck, FileText, Info, ShieldCheck, Sparkles } from "lucide-react";
import { DbUnavailable } from "@/components/errors/db-unavailable";
import { PageTransition } from "@/components/motion";
import { DeadlinePill, ProviderBadge } from "@/components/scholarships/bits";
import { Countdown } from "@/components/scholarships/countdown";
import { MatchBreakdown } from "@/components/scholarships/match-breakdown";
import { SaveButton } from "@/components/scholarships/save-button";
import { ScholarshipCard } from "@/components/scholarships/scholarship-card";
import { ApplyButton } from "@/components/scholarships/track-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { authOptions } from "@/lib/auth";
import { COUNTRIES, INDIAN_STATES, LABELS } from "@/lib/constants";
import { matchScholarship, toMatchScholarship } from "@/lib/matching";
import type { MatchRule } from "@/lib/matching/types";
import { prisma, withDbFallback } from "@/lib/prisma";
import { getMatchProfile, getScholarship, serializeScholarship } from "@/lib/scholarships";
import { formatDate, formatInr, formatInrCompact } from "@/lib/utils";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await withDbFallback(() => getScholarship(params.id), "unavailable" as const);
  if (s === "unavailable") return { title: "Scholarship" };
  if (!s) return { title: "Scholarship not found" };
  const description = `${s.provider} · ${s.amountLabel ?? formatInrCompact(s.amountInr)} · Apply by ${formatDate(s.deadline)}. ${s.description.slice(0, 120)}`;
  return {
    title: s.title,
    description,
    alternates: { canonical: `/scholarships/${s.slug}` },
    openGraph: { title: s.title, description, type: "article" },
  };
}

function eligibilityList(rule: MatchRule | null): Array<[string, string]> {
  if (!rule) return [["Eligibility", "Open to all students"]];
  const join = (xs: string[], dict: Record<string, string>) => xs.map((x) => dict[x] ?? x).join(", ");
  const rows: Array<[string, string | null]> = [
    ["Nationality", rule.countries.length ? join(rule.countries, COUNTRIES) : null],
    ["Education level", rule.educationLevels.length ? join(rule.educationLevels, LABELS.educationLevel) : null],
    ["Course", rule.courses.length ? join(rule.courses, LABELS.course) : null],
    ["Minimum marks", rule.minMarksPercent != null ? `${rule.minMarksPercent}%` : null],
    ["Family income", rule.maxFamilyIncome != null ? `Up to ${formatInr(rule.maxFamilyIncome)} / year` : null],
    ["Category", rule.categories.length ? join(rule.categories, LABELS.category) : null],
    ["State", rule.states.length ? join(rule.states, INDIAN_STATES) : null],
    ["Gender", rule.genders.length ? join(rule.genders, LABELS.gender) : null],
    ["Minority", rule.minorityOnly ? "Notified minority communities only" : null],
    ["Disability", rule.disabilityRequired ? "Benchmark disability (40%+) required" : null],
    [
      "Age",
      rule.minAge != null || rule.maxAge != null ? `${rule.minAge ?? 0}–${rule.maxAge ?? "no upper limit"} years` : null,
    ],
  ];
  const list = rows.filter((r): r is [string, string] => r[1] !== null);
  return list.length ? list : [["Eligibility", "Open to all students"]];
}

export default async function ScholarshipDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const result = await withDbFallback(async () => {
    const row = await getScholarship(params.id);
    if (!row || !row.isActive) return null;
    const related = await Promise.all([
      getMatchProfile(userId),
      userId
        ? prisma.savedScholarship.findUnique({ where: { userId_scholarshipId: { userId, scholarshipId: row.id } } })
        : null,
      prisma.scholarship.findMany({
        where: { providerType: row.providerType, isActive: true, deadline: { gte: new Date() }, id: { not: row.id } },
        include: { rule: true },
        orderBy: { deadline: "asc" },
        take: 3,
      }),
    ]);
    return { row, related };
  }, "unavailable" as const);

  if (result === "unavailable") {
    return (
      <div className="container py-8 sm:py-12">
        <DbUnavailable retryHref={`/scholarships/${encodeURIComponent(params.id)}`} />
      </div>
    );
  }
  if (!result) notFound();
  const {
    row,
    related: [profile, saved, similarRows],
  } = result;

  const s = serializeScholarship(row);
  const match = profile ? matchScholarship(profile, toMatchScholarship(row)) : null;
  const closed = new Date(s.deadline).getTime() < Date.now();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MonetaryGrant",
    name: s.title,
    funder: { "@type": "Organization", name: s.provider },
    amount: { "@type": "MonetaryAmount", currency: "INR", value: s.amountInr },
    description: s.description,
    url: s.applyUrl,
  };

  return (
    <PageTransition className="container py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
        <Link href="/scholarships">
          <ArrowLeft /> All scholarships
        </Link>
      </Button>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ProviderBadge type={s.providerType} />
            {s.tags.slice(0, 4).map((t) => (
              <Badge key={t} variant="outline">
                {t}
              </Badge>
            ))}
          </div>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{s.title}</h1>
          <p className="mt-2 text-muted-foreground">{s.provider}</p>
          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <ShieldCheck className={s.lastVerifiedAt ? "size-4 text-success" : "size-4"} aria-hidden />
            {s.lastVerifiedAt ? (
              <>
                Last verified on <time dateTime={s.lastVerifiedAt}>{formatDate(s.lastVerifiedAt)}</time>
              </>
            ) : (
              "Not yet verified by our team"
            )}
          </p>

          <div className="mt-8 grid gap-4 rounded-xl border bg-card p-5 shadow-soft sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Award</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight tabular">{formatInrCompact(s.amountInr)}</p>
              {s.amountLabel && <p className="mt-1 text-sm text-muted-foreground">{s.amountLabel}</p>}
            </div>
            <div className="sm:border-l sm:pl-8">
              <p className="mb-2 flex items-center justify-between gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                Closes {formatDate(s.deadline)} <DeadlinePill deadline={s.deadline} className="normal-case tracking-normal" />
              </p>
              <Countdown deadline={s.deadline} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <ApplyButton scholarshipId={s.id} applyUrl={s.applyUrl} closed={closed} />
            <SaveButton scholarshipId={s.id} title={s.title} initialSaved={Boolean(saved)} size="lg" />
          </div>

          <section className="mt-12" aria-labelledby="about">
            <h2 id="about" className="text-lg font-semibold">
              About this scholarship
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{s.description}</p>
            {s.benefits.length > 0 && (
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {s.benefits.map((b) => (
                  <li key={b} className="flex gap-2 text-sm">
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> {b}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-12" aria-labelledby="eligibility">
            <h2 id="eligibility" className="text-lg font-semibold">
              Eligibility
            </h2>
            <dl className="mt-4 divide-y rounded-xl border bg-card shadow-soft">
              {eligibilityList(s.rule).map(([k, v]) => (
                <div key={k} className="grid gap-1 px-5 py-3.5 text-sm sm:grid-cols-[180px_1fr]">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-12" aria-labelledby="documents">
            <h2 id="documents" className="text-lg font-semibold">
              Documents required
            </h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {s.documents.map((d) => (
                <li key={d} className="flex items-start gap-3 rounded-lg border bg-card p-3 text-sm">
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden /> {d}
                </li>
              ))}
            </ul>
          </section>

          <p className="mt-10 flex gap-2 rounded-lg bg-muted/60 p-4 text-xs leading-relaxed text-muted-foreground">
            <Info className="size-4 shrink-0" aria-hidden />
            <span>
              Details are summarised for discovery and may change
              {s.lastVerifiedAt ? ` after they were last checked on ${formatDate(s.lastVerifiedAt)}` : ""}. Always confirm
              eligibility, amounts and deadlines on the official website before applying.{" "}
              <Link href="/disclaimer" className="underline underline-offset-2 hover:text-foreground">
                Disclaimer
              </Link>
            </span>
          </p>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {match ? (
            <MatchBreakdown match={match} />
          ) : (
            <div className="rounded-xl border bg-card p-6 shadow-soft">
              <Sparkles className="size-5 text-accent" aria-hidden />
              <h2 className="mt-3 font-semibold">{session ? "Complete your profile" : "See if you qualify"}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {session
                  ? "Add your details to get a match score and a rule-by-rule eligibility check."
                  : "Create a free profile to get your match score and a rule-by-rule eligibility check."}
              </p>
              <Button asChild className="mt-5 w-full">
                <Link href={session ? "/onboarding" : `/signup?callbackUrl=/scholarships/${s.slug}`}>
                  {session ? "Complete profile" : "Check my eligibility"}
                </Link>
              </Button>
            </div>
          )}
        </aside>
      </div>

      {similarRows.length > 0 && (
        <section className="mt-20" aria-labelledby="similar">
          <h2 id="similar" className="text-lg font-semibold">
            More {LABELS.providerType[s.providerType].toLowerCase()} scholarships
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similarRows.map((r) => (
              <ScholarshipCard key={r.id} item={{ ...serializeScholarship(r), match: null, saved: false }} />
            ))}
          </div>
        </section>
      )}
    </PageTransition>
  );
}
