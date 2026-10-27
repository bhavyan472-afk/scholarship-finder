import { Suspense } from "react";
import { Check } from "lucide-react";
import { PageTransition } from "@/components/motion";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="mesh pointer-events-none absolute inset-x-0 top-0 h-[480px] opacity-70" aria-hidden />
      <div className="container relative grid min-h-[calc(100dvh-4rem)] items-center gap-12 py-12 lg:grid-cols-2">
        <PageTransition className="mx-auto w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">
            <Suspense>{children}</Suspense>
          </div>
        </PageTransition>
        <aside className="hidden rounded-2xl border bg-card/70 p-10 shadow-soft backdrop-blur lg:block">
          <p className="text-sm font-semibold text-primary">Why students use ScholarSphere</p>
          <ul className="mt-6 space-y-5">
            {[
              ["Only what you qualify for", "Hard eligibility filters remove the noise before you ever see a result."],
              ["Explained scores", "Every 0–100 score lists why you match and what's missing."],
              ["One tracker, every deadline", "Kanban tracker, calendar and email reminders 7 days and 1 day out."],
            ].map(([h, b]) => (
              <li key={h} className="flex gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                  <Check className="size-3" aria-hidden />
                </span>
                <span>
                  <span className="block font-medium">{h}</span>
                  <span className="text-sm text-muted-foreground">{b}</span>
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
