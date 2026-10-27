import type { MatchStatus } from "@/lib/matching/types";
import { cn } from "@/lib/utils";

const tone = (score: number, status?: MatchStatus) =>
  status === "ineligible"
    ? "text-muted-foreground"
    : score >= 75
      ? "text-success"
      : score >= 55
        ? "text-primary"
        : "text-warning dark:text-accent";

/** Circular match-score gauge. */
export function MatchRing({
  score,
  status,
  size = 52,
  stroke = 5,
  className,
}: {
  score: number;
  status?: MatchStatus;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      className={cn("relative grid shrink-0 place-items-center", tone(score, status), className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Match score ${score} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.14} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute font-mono text-[13px] font-semibold tabular text-foreground" style={{ fontSize: size * 0.26 }}>
        {score}
      </span>
    </div>
  );
}
