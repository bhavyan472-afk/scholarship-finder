import Link from "next/link";
import { BellRing, Bookmark, GraduationCap, UserCheck, Users } from "lucide-react";
import { Stat } from "@/components/dashboard/stat";
import { PageTransition } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives";
import { getAdminStats } from "@/lib/admin";
import { requireAdminPage } from "@/lib/auth-guard";
import { APPLICATION_STATUSES, LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdminPage();
  const stats = await getAdminStats();
  const totalApps = Object.values(stats.applicationsByStatus).reduce((a, b) => a + b, 0) || 1;
  const maxSaves = Math.max(1, ...stats.topSaved.map((t) => t.saves));

  return (
    <PageTransition className="grid gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Overview</h1>
        <p className="mt-1 text-muted-foreground">Platform health at a glance.</p>
      </header>

      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat icon={Users} label="Users" value={String(stats.users)} hint={`+${stats.newUsers} this week`} />
        <Stat icon={UserCheck} label="Onboarded" value={String(stats.onboarded)} hint={`${Math.round((stats.onboarded / Math.max(1, stats.users)) * 100)}% of users`} />
        <Stat icon={GraduationCap} label="Live scholarships" value={String(stats.activeScholarships)} hint={`${stats.scholarships} total`} />
        <Stat icon={Bookmark} label="Saves" value={String(stats.saved)} />
        <Stat icon={BellRing} label="Reminders sent" value={String(stats.remindersSent)} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Application pipeline</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {APPLICATION_STATUSES.map((s) => {
              const n = stats.applicationsByStatus[s] ?? 0;
              return (
                <div key={s} className="grid gap-1.5">
                  <div className="flex justify-between text-sm">
                    <span>{LABELS.status[s]}</span>
                    <span className="font-mono tabular text-muted-foreground">{n}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(n / totalApps) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most saved</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topSaved.every((t) => t.saves === 0) ? (
              <p className="text-sm text-muted-foreground">No saves yet.</p>
            ) : (
              <ol className="grid gap-3">
                {stats.topSaved.map((t, i) => (
                  <li key={t.id} className="grid grid-cols-[20px_1fr_auto] items-center gap-3 text-sm">
                    <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>
                    <div className="min-w-0">
                      <Link href={`/admin/scholarships`} className="line-clamp-1 font-medium hover:text-primary">
                        {t.title}
                      </Link>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${(t.saves / maxSaves) * 100}%` }} />
                      </div>
                    </div>
                    <span className="font-mono tabular">{t.saves}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
