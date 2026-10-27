import type { Metadata } from "next";
import { Suspense } from "react";
import { ResultsSkeleton, ScholarshipExplorer } from "@/components/scholarships/explorer";

export const metadata: Metadata = {
  title: "Browse scholarships",
  description:
    "Search government, state, private and international scholarships. Filter by amount, deadline, level and state — and sort by your personal match score.",
  alternates: { canonical: "/scholarships" },
};

export default function ScholarshipsPage() {
  return (
    <div className="container py-10 sm:py-14">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Scholarships</h1>
        <p className="mt-2 text-muted-foreground">
          Every open scheme in one place. Sign in and we&apos;ll rank them by how well you match.
        </p>
      </header>
      <Suspense fallback={<ResultsSkeleton />}>
        <ScholarshipExplorer />
      </Suspense>
    </div>
  );
}
