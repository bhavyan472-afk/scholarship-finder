import Link from "next/link";
import { Check } from "lucide-react";
import type { ScholarshipListItem } from "@/types";
import { formatInrCompact } from "@/lib/utils";
import { DeadlinePill, ProviderBadge, StatusBadge } from "./bits";
import { MatchRing } from "./match-ring";
import { SaveButton } from "./save-button";

export function ScholarshipCard({ item }: { item: ScholarshipListItem }) {
  return (
    <article className="group relative flex h-full flex-col rounded-xl border bg-card p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <ProviderBadge type={item.providerType} />
          {item.match && <StatusBadge status={item.match.status} />}
        </div>
        <SaveButton compact scholarshipId={item.id} title={item.title} initialSaved={item.saved} className="relative z-10 -mr-1.5 -mt-1.5" />
      </div>

      <div className="mt-4 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold leading-snug">
            <Link href={`/scholarships/${item.slug}`} className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none">
              {item.title}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{item.provider}</p>
        </div>
        {item.match && <MatchRing score={item.match.score} status={item.match.status} size={48} />}
      </div>

      {item.match && item.match.reasons.length > 0 && (
        <ul className="mt-4 space-y-1.5" aria-label="Why you match">
          {item.match.reasons.slice(0, 2).map((r) => (
            <li key={r} className="flex gap-2 text-[13px] leading-snug text-muted-foreground">
              <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
              <span className="line-clamp-1">{r}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="min-h-5 flex-1" />
      <div className="flex items-end justify-between gap-3 border-t border-dashed pt-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Award</p>
          <p className="text-lg font-semibold tracking-tight tabular">{formatInrCompact(item.amountInr)}</p>
        </div>
        <DeadlinePill deadline={item.deadline} />
      </div>
    </article>
  );
}
