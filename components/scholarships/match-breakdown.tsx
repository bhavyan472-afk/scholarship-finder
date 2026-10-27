import { Check, CircleHelp, X } from "lucide-react";
import type { MatchResult } from "@/lib/matching/types";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./bits";
import { MatchRing } from "./match-ring";

const headline = {
  eligible: "You meet every eligibility rule.",
  likely: "Nothing rules you out — a few details are missing to confirm.",
  ineligible: "You don't meet one or more eligibility rules.",
};

export function MatchBreakdown({ match }: { match: MatchResult }) {
  return (
    <div className="rounded-xl border bg-card shadow-soft">
      <div className="flex items-center gap-4 border-b p-5">
        <MatchRing score={match.score} status={match.status} size={68} stroke={6} />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Your match</h2>
            <StatusBadge status={match.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{headline[match.status]}</p>
        </div>
      </div>

      <div className="grid gap-3 border-b p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Score breakdown</h3>
        {match.breakdown.map((f) => (
          <div key={f.key} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 text-sm">
            <span>{f.label}</span>
            <span className="font-mono text-xs tabular text-muted-foreground">
              {Math.round(f.points)}/{f.weight}
            </span>
            <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(f.points / f.weight) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <ul className="grid gap-2.5 p-5" aria-label="Eligibility checks">
        {match.criteria.map((c) => {
          const Icon = c.status === "pass" ? Check : c.status === "fail" ? X : CircleHelp;
          return (
            <li key={c.key} className="flex gap-2.5 text-sm">
              <span
                className={cn(
                  "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
                  c.status === "pass" && "bg-success/15 text-success",
                  c.status === "fail" && "bg-destructive/10 text-destructive",
                  c.status === "unknown" && "bg-accent/15 text-warning dark:text-accent",
                )}
              >
                <Icon className="size-3" aria-hidden />
              </span>
              <span>
                <span className="sr-only">{c.status === "pass" ? "Passed: " : c.status === "fail" ? "Failed: " : "Unknown: "}</span>
                <span className="font-medium">{c.label}</span>
                <span className="text-muted-foreground"> — {c.message}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
