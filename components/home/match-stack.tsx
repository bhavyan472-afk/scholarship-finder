"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { Check } from "lucide-react";
import type { HomeTeaser } from "@/lib/home-data";
import { ScoreRing } from "./score-ring";

// Used only when the catalogue is empty or unreachable, so the illustration never renders blank.
// Titles mirror schemes in the seed catalogue (prisma/data/scholarships.ts).
const SAMPLE: HomeTeaser[] = [
  {
    title: "AICTE Pragati Scholarship for Girls",
    provider: "All India Council for Technical Education",
    amount: "₹50,000 / year",
    deadline: "",
    reasons: ["Family income within the ₹8L limit", "Open to Undergraduate · Diploma", "For female students"],
  },
  {
    title: "Central Sector Scheme of Scholarships",
    provider: "Ministry of Education",
    amount: "₹12,000 / year",
    deadline: "",
    reasons: [],
  },
  {
    title: "Post Matric Scholarship for Minorities",
    provider: "Ministry of Minority Affairs",
    amount: "Fees + allowance",
    deadline: "",
    reasons: [],
  },
];

const BREAKDOWN: Array<[string, number]> = [
  ["Fit", 0.95],
  ["Marks", 0.85],
  ["Need", 0.87],
  ["Value", 0.8],
  ["Time", 1],
];

function daysLeft(iso: string) {
  if (!iso) return null;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

/** Signature visual: three match cards that fan apart as the section scrolls into view. */
export function MatchStack({ teasers }: { teasers: HomeTeaser[] }) {
  const [main, left, right] = teasers.length >= 3 ? teasers : SAMPLE;
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const p = useSpring(scrollYProgress, { stiffness: 60, damping: 24, mass: 0.6 });

  const leftX = useTransform(p, [0, 1], ["-4%", "-62%"]);
  const rightX = useTransform(p, [0, 1], ["4%", "62%"]);
  const leftR = useTransform(p, [0, 1], [-1, -7]);
  const rightR = useTransform(p, [0, 1], [1, 7]);
  const sideY = useTransform(p, [0, 1], [8, 44]);
  const mainY = useTransform(p, [0, 1], [24, 0]);
  const days = daysLeft(main.deadline);

  return (
    <section aria-label="Example match report" className="container relative overflow-x-clip pb-24 pt-4 sm:pb-32">
      <div ref={ref} className="relative mx-auto flex max-w-[440px] justify-center">
        {[
          { item: left, x: leftX, rotate: leftR, score: 84, origin: "bottom right", end: { x: "-62%", rotate: -7 } },
          { item: right, x: rightX, rotate: rightR, score: 76, origin: "bottom left", end: { x: "62%", rotate: 7 } },
        ].map(({ item, x, rotate, score, origin, end }) => (
          <motion.div
            key={item.title}
            aria-hidden
            style={reduce ? { ...end, y: 44, transformOrigin: origin } : { x, rotate, y: sideY, transformOrigin: origin }}
            className="absolute inset-x-0 top-0 hidden md:block"
          >
            <div className="rounded-[20px] border bg-card/95 p-6 shadow-[0_1px_2px_hsl(var(--shadow)/0.04),0_30px_60px_-30px_hsl(var(--shadow)/0.25)]">
              <div className="flex items-center gap-4">
                <ScoreRing score={score} size={56} stroke={3.5} delay={0.5} />
                <div className="min-w-0">
                  <p className="line-clamp-2 font-serif text-xl leading-tight">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.amount}</p>
                </div>
              </div>
              <div className="mt-6 h-24 rounded-xl bg-muted/60" />
            </div>
          </motion.div>
        ))}

        <motion.figure
          style={{ y: reduce ? 0 : mainY }}
          className="relative w-full rounded-[20px] border bg-card p-6 shadow-[0_1px_2px_hsl(var(--shadow)/0.05),0_40px_80px_-32px_hsl(var(--shadow)/0.32)] sm:p-7"
        >
          <figcaption className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="eyebrow">Match report</span>
            <span className="font-mono">Ananya · B.Tech · KA</span>
          </figcaption>

          <div className="mt-6 flex items-center gap-5">
            <ScoreRing score={92} size={92} />
            <div className="min-w-0">
              <p className="font-serif text-2xl leading-[1.1] tracking-[-0.01em]">{main.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {main.amount}
                {days !== null && (
                  <span suppressHydrationWarning>
                    {" "}
                    · closes in {days} {days === 1 ? "day" : "days"}
                  </span>
                )}
              </p>
            </div>
          </div>

          <ul className="mt-6 space-y-2.5 border-t pt-5 text-sm">
            {main.reasons.map((r) => (
              <li key={r} className="flex items-start gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {r}
              </li>
            ))}
          </ul>

          <div className="mt-6 grid grid-cols-5 gap-2" aria-hidden>
            {BREAKDOWN.map(([label, v]) => (
              <div key={label}>
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: reduce ? `${v * 100}%` : 0 }}
                    whileInView={{ width: `${v * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </motion.figure>
      </div>
    </section>
  );
}
