import { Check, X } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

// Scattered "tabs" for the messy side. Positions are fixed so the layout never shifts.
const TABS: Array<{ label: string; note?: string; className: string }> = [
  { label: "Central portal — login expired", className: "left-[4%] top-[6%] -rotate-3" },
  { label: "State scheme notice.pdf", note: "Page 14 of 38", className: "right-[3%] top-[14%] rotate-2" },
  { label: "Foundation site", note: "Last updated 2022", className: "left-[10%] top-[34%] rotate-1" },
  { label: "Forwarded many times", className: "right-[8%] top-[42%] -rotate-2" },
  { label: "404 — Page not found", className: "left-[2%] top-[60%] -rotate-1" },
  { label: "Eligibility: see annexure B", className: "right-[4%] top-[70%] rotate-3" },
  { label: "Deadline: ?", className: "left-[28%] top-[84%] -rotate-2" },
];

const RANKED: Array<[string, string, number]> = [
  ["AICTE Pragati Scholarship", "₹50,000 / yr · 6 days left", 92],
  ["Central Sector Scheme", "₹12,000 / yr · 34 days left", 84],
  ["State Post-Matric Scholarship", "Full fees · 21 days left", 76],
];

export function BeforeAfter() {
  return (
    <section aria-labelledby="compare-title" className="border-t bg-muted/40">
      <div className="container py-24 sm:py-32">
        <SectionHeading id="compare-title" overline="Before & after" title={<>Forty tabs, <em>or one list.</em></>} />

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <Reveal className="flex flex-col rounded-[20px] border bg-background p-7 sm:p-9">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <X className="size-4 text-destructive" aria-hidden /> Before
            </p>
            <h3 className="mt-3 font-serif text-3xl tracking-[-0.01em]">Searching 40 websites</h3>
            <div aria-hidden className="relative mt-8 h-[300px] flex-1 overflow-hidden rounded-2xl border border-dashed">
              {TABS.map((t) => (
                <div
                  key={t.label}
                  className={`absolute max-w-[62%] rounded-lg border bg-card px-3 py-2 text-[12px] opacity-80 shadow-sm ${t.className}`}
                >
                  <p className="truncate font-medium line-through decoration-muted-foreground/50">{t.label}</p>
                  {t.note && <p className="truncate text-muted-foreground">{t.note}</p>}
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Scattered portals, outdated PDFs, eligibility buried in annexures, and deadlines you find out about too late.
            </p>
          </Reveal>

          <Reveal delay={0.12} className="flex flex-col rounded-[20px] border bg-card p-7 sm:p-9">
            <p className="flex items-center gap-2 text-sm text-primary">
              <Check className="size-4" aria-hidden /> After
            </p>
            <h3 className="mt-3 font-serif text-3xl tracking-[-0.01em]">One profile, ranked matches</h3>
            <ol aria-hidden className="mt-8 flex h-[300px] flex-1 flex-col justify-center divide-y rounded-2xl border bg-background">
              {RANKED.map(([title, meta, score], i) => (
                <li key={title} className="flex items-center gap-4 px-5 py-5">
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{title}</p>
                    <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{meta}</p>
                  </div>
                  <span className="font-serif text-3xl tabular text-primary">{score}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Every eligible scholarship in one place, scored against your profile, with reasons and deadlines up front.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
