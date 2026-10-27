import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageTransition } from "@/components/motion";
import { ScholarshipCard } from "@/components/scholarships/scholarship-card";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";
import { getMatchesForUser } from "@/lib/scholarships";

export const metadata: Metadata = { title: "Your matches" };

export default async function MatchesPage() {
  const session = (await getServerSession(authOptions))!;
  const { matches } = await getMatchesForUser(session.user.id, 100);
  const eligible = matches.filter((m) => m.match.status === "eligible");
  const likely = matches.filter((m) => m.match.status === "likely");

  return (
    <PageTransition className="grid gap-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your matches</h1>
        <p className="mt-1 text-muted-foreground">Ranked by match score. Ineligible scholarships are hidden.</p>
      </header>

      {matches.length === 0 && (
        <EmptyState
          icon={Sparkles}
          title="No matches yet"
          description="Fill in more of your profile so we can check eligibility rules."
          action={
            <Button asChild>
              <Link href="/dashboard/profile">Complete profile</Link>
            </Button>
          }
        />
      )}

      {[
        { title: "Eligible", description: "You meet every rule.", items: eligible },
        { title: "Likely eligible", description: "Add the missing profile details to confirm.", items: likely },
      ]
        .filter((g) => g.items.length > 0)
        .map((g) => (
          <section key={g.title} aria-label={g.title}>
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="font-semibold">{g.title}</h2>
              <span className="font-mono text-sm text-muted-foreground">{g.items.length}</span>
              <span className="text-sm text-muted-foreground">· {g.description}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {g.items.map((m) => (
                <ScholarshipCard key={m.id} item={m} />
              ))}
            </div>
          </section>
        ))}
    </PageTransition>
  );
}
