import type { HomeTeaser } from "@/lib/home-data";

/** Slow, infinite strip of real scholarship names. CSS-only; pauses on hover, stops for reduced motion. */
export function Marquee({ items }: { items: HomeTeaser[] }) {
  if (items.length < 4) return null;
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((s) => (
        <li key={s.title} className="flex items-baseline gap-3 whitespace-nowrap px-8">
          <span className="font-serif text-2xl tracking-[-0.01em]">{s.title}</span>
          <span className="text-sm text-gold-ink tabular">{s.amount}</span>
          <span aria-hidden className="ml-5 text-border">/</span>
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-label="Scholarships in the catalogue" className="group border-y py-7">
      <div className="fade-x overflow-hidden motion-reduce:overflow-x-auto">
        <div
          className="marquee-track flex w-max animate-marquee group-hover:[animation-play-state:paused]"
          style={{ animationDuration: `${items.length * 8}s` }}
        >
          {row(false)}
          {row(true)}
        </div>
      </div>
    </section>
  );
}
