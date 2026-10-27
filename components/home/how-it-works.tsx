import { Bell, Check } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Stagger, StaggerItem } from "./reveal";

const STEPS = [
  {
    title: "Build your profile",
    body: "Education, marks, family income, category and state — a two-minute wizard asking only what eligibility rules actually check.",
    preview: <ProfilePreview />,
  },
  {
    title: "Get ranked matches",
    body: "We filter out what you can't get, score the rest from 0 to 100, and explain why you fit — or what you're missing.",
    preview: <RankPreview />,
  },
  {
    title: "Apply and track",
    body: "Save scholarships, move them from Applying to Result, and get an email seven days and one day before every deadline.",
    preview: <TrackPreview />,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-24 border-t">
      <div className="container py-24 sm:py-32">
        <SectionHeading id="how-title" overline="How it works" title={<>From profile to funded, <em>in three steps.</em></>} />
        <Stagger as="ol" className="mt-16 grid gap-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          {STEPS.map((s, i) => (
            <StaggerItem as="li" key={s.title} className="flex flex-col">
              <span aria-hidden className="font-serif text-[5.5rem] leading-none tracking-[-0.04em] text-gold">
                0{i + 1}
              </span>
              <h3 className="mt-6 border-t pt-6 text-xl font-medium tracking-tight">
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{s.body}</p>
              <div aria-hidden className="mt-8 flex-1 rounded-2xl border bg-card p-5">
                {s.preview}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function ProfilePreview() {
  const rows = [
    ["Course", "B.Tech · Engineering"],
    ["State", "Telangana"],
    ["Marks", "82%"],
    ["Family income", "₹3.2L / year"],
  ];
  return (
    <dl className="space-y-3 text-[13px]">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-3 border-b border-dashed pb-3 last:border-0 last:pb-0">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function RankPreview() {
  const rows: Array<[string, number]> = [
    ["AICTE Pragati", 92],
    ["Central Sector Scheme", 84],
    ["Telangana ePASS", 76],
  ];
  return (
    <ol className="space-y-3 text-[13px]">
      {rows.map(([t, score], i) => (
        <li key={t} className="flex items-center gap-3">
          <span className="w-4 font-mono text-[11px] text-muted-foreground">{i + 1}</span>
          <span className="flex-1 truncate font-medium">{t}</span>
          <span className="h-1 w-16 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
          </span>
          <span className="w-6 text-right font-serif text-base tabular">{score}</span>
        </li>
      ))}
    </ol>
  );
}

function TrackPreview() {
  const cols: Array<[string, string[]]> = [
    ["Applying", ["Pragati"]],
    ["Applied", ["CSS", "ePASS"]],
    ["Result", ["Awarded"]],
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        {cols.map(([label, cards]) => (
          <div key={label}>
            <p className="mb-2 text-muted-foreground">{label}</p>
            <div className="space-y-1.5">
              {cards.map((c) => (
                <p key={c} className="flex items-center gap-1 truncate rounded-md border bg-background px-2 py-1.5 font-medium">
                  {c === "Awarded" && <Check className="size-3 shrink-0 text-primary" />}
                  {c}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="flex items-center gap-2 rounded-lg bg-muted/70 px-3 py-2 text-[12px]">
        <Bell className="size-3.5 text-gold-ink" /> Pragati closes in 7 days
      </p>
    </div>
  );
}
