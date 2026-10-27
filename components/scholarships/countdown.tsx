"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function parts(deadline: number, now: number) {
  const ms = Math.max(0, deadline - now);
  return {
    closed: ms === 0,
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms / 3_600_000) % 24),
    minutes: Math.floor((ms / 60_000) % 60),
  };
}

export function Countdown({ deadline }: { deadline: string }) {
  const target = new Date(deadline).getTime();
  // Render nothing time-dependent until mounted to avoid hydration mismatch.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const p = now == null ? null : parts(target, now);
  const urgent = p != null && !p.closed && p.days < 7;

  if (p?.closed) return <p className="font-medium text-destructive">Applications closed</p>;

  return (
    <div className="flex gap-2" role="timer" aria-label={p ? `${p.days} days ${p.hours} hours ${p.minutes} minutes left` : "Loading countdown"}>
      {(["days", "hours", "minutes"] as const).map((unit) => (
        <div
          key={unit}
          className={cn(
            "min-w-[64px] rounded-lg border bg-background px-3 py-2 text-center",
            urgent && "border-destructive/30 bg-destructive/[0.04]",
          )}
        >
          <p className={cn("font-mono text-2xl font-semibold tabular", urgent && "text-destructive")}>
            {p ? String(p[unit]).padStart(2, "0") : "––"}
          </p>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{unit}</p>
        </div>
      ))}
    </div>
  );
}
