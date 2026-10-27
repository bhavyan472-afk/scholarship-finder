import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowRight, Bookmark, CalendarClock, IndianRupee, Sparkles, UserRoundPen } from "lucide-react";
import { DeadlineCalendar } from "@/components/dashboard/deadline-calendar";
import { Stat } from "@/components/dashboard/stat";
import { EmptyState } from "@/components/empty-state";
import { DbUnavailable } from "@/components/errors/db-unavailable";
import { PageTransition } from "@/components/motion";
import { DeadlinePill } from "@/components/scholarships/bits";
import { ScholarshipCard } from "@/components/scholarships/scholarship-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Progress } from "@/components/ui/primitives";
import { authOptions } from "@/lib/auth";
import { LABELS, type ApplicationStatus } from "@/lib/constants";
import { prisma, withDbFallback } from "@/lib/prisma";
import { profileCompleteness } from "@/lib/profile";
import { getMatchesForUser } from "@/lib/scholarships";
import { formatDate, formatInrCompact } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = (await getServerSession(authOptions))!;
  const userId = session.user.id;

  const result = await withDbFallback(
    () =>
      Promise.all([
        getMatchesForUser(userId, 100),
        prisma.studentProfile.findUnique({ where: { userId } }),
        prisma.savedScholarship.findMany({
          where: { userId },
          include: { scholarship: true },
          orderBy: { scholarship: { deadline: "asc" } },
        }),
        prisma.application.groupBy({ by: ["status"], where: { userId }, _count: { _all: true } }),
      ]),
    null,
  );
  if (!result) {
    return (
      <DbUnavailable
        retryHref="/dashboard"
        title="Your dashboard can't load right now"
        description="We couldn't reach our database, so your matches and saved scholarships aren't available. Please try again in a moment."
      />
    );
  }
  const [{ matches }, profileRow, saved, applications] = result;

  const completeness = profileCompleteness(profileRow);
  const eligible = matches.filter((m) => m.match.status === "eligible");
  const potential = eligible.reduce((s, m) => s + m.amountInr, 0);
  const upcoming = saved.filter((s) => s.scholarship.deadline >= new Date());
  const next = upcoming[0]?.scholarship;
  const statusCounts = Object.fromEntries(applications.map((a) => [a.status, a._count._all])) as Partial<
    Record<ApplicationStatus, number>
  >;
  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <PageTransition className="grid gap-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Hi {firstName} 👋</h1>
          <p className="mt-1 text-muted-foreground">
            {eligible.length > 0
              ? `You're eligible for ${eligible.length} scholarships right now.`
              : "Complete your profile to unlock confident matches."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/scholarships">
            Browse all <ArrowRight />
          </Link>
        </Button>
      </header>

      <section aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Sparkles} label="Matches" value={String(matches.length)} hint={`${eligible.length} confirmed eligible`} />
        <Stat icon={IndianRupee} label="Potential value" value={formatInrCompact(potential)} hint="Sum of eligible awards" />
        <Stat icon={Bookmark} label="Tracking" value={String(saved.length)} hint={`${statusCounts.APPLIED ?? 0} applied · ${statusCounts.RESULT ?? 0} results`} />
        <Stat
          icon={CalendarClock}
          label="Next deadline"
          value={next ? formatDate(next.deadline, { year: undefined }) : "—"}
          hint={next?.title ?? "Save a scholarship to track it"}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section aria-labelledby="top-matches" className="min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="top-matches" className="font-semibold">
              Top matches
            </h2>
            <Link href="/dashboard/matches" className="text-sm font-medium text-primary hover:underline">
              See all {matches.length}
            </Link>
          </div>
          {matches.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No matches yet"
              description="Add your education level, course, marks and income so we can check eligibility."
              action={
                <Button asChild>
                  <Link href="/dashboard/profile">Complete profile</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {matches.slice(0, 4).map((m) => (
                <ScholarshipCard key={m.id} item={m} />
              ))}
            </div>
          )}
        </section>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Profile strength</CardTitle>
              <CardDescription>Complete profiles get more confident matches.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-semibold tabular">{completeness.percent}%</span>
                <span className="text-xs text-muted-foreground">{completeness.missing.length} fields missing</span>
              </div>
              <Progress value={completeness.percent} label="Profile completeness" className="mt-3" />
              {completeness.missing.length > 0 && (
                <>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {completeness.missing.map((m) => (
                      <li key={m} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        {m}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
                    <Link href="/dashboard/profile">
                      <UserRoundPen /> Complete profile
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Upcoming deadlines</CardTitle>
              <CardDescription>Saved scholarships on your calendar.</CardDescription>
            </CardHeader>
            <CardContent>
              <DeadlineCalendar
                events={upcoming.map((s) => ({
                  date: s.scholarship.deadline.toISOString(),
                  title: s.scholarship.title,
                  href: `/scholarships/${s.scholarship.slug}`,
                }))}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <section aria-labelledby="saved">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="saved" className="font-semibold">
            Saved & tracked
          </h2>
          <Link href="/dashboard/tracker" className="text-sm font-medium text-primary hover:underline">
            Open tracker
          </Link>
        </div>
        {saved.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="Nothing saved yet"
            description="Tap the bookmark on any scholarship to track it here and get deadline reminders."
          />
        ) : (
          <div className="divide-y rounded-xl border bg-card shadow-soft">
            {saved.slice(0, 6).map(({ scholarship: s }) => (
              <Link
                key={s.id}
                href={`/scholarships/${s.slug}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {s.provider} · {LABELS.providerType[s.providerType as keyof typeof LABELS.providerType]}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-semibold tabular">{formatInrCompact(s.amountInr)}</span>
                  <DeadlinePill deadline={s.deadline} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageTransition>
  );
}
