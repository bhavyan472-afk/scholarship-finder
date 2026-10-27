import { Building2, CalendarClock, Globe2, Landmark, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { LABELS, type ProviderType } from "@/lib/constants";
import type { MatchStatus } from "@/lib/matching/types";
import { cn, daysUntil, deadlineLabel } from "@/lib/utils";

const providerIcon: Record<ProviderType, LucideIcon> = {
  GOVERNMENT: Landmark,
  PRIVATE: Building2,
  INTERNATIONAL: Globe2,
};

export function ProviderBadge({ type }: { type: ProviderType }) {
  const Icon = providerIcon[type];
  return (
    <Badge variant="neutral">
      <Icon aria-hidden /> {LABELS.providerType[type]}
    </Badge>
  );
}

export function DeadlinePill({ deadline, className }: { deadline: string | Date; className?: string }) {
  const d = daysUntil(deadline);
  const urgent = d <= 7;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium tabular",
        urgent ? "text-destructive" : "text-muted-foreground",
        className,
      )}
    >
      <CalendarClock className="size-3.5" aria-hidden />
      {deadlineLabel(deadline)}
    </span>
  );
}

export function StatusBadge({ status }: { status: MatchStatus }) {
  if (status === "eligible") return <Badge variant="success">Eligible</Badge>;
  if (status === "likely") return <Badge variant="accent">Likely eligible</Badge>;
  return <Badge variant="neutral">Not eligible</Badge>;
}
