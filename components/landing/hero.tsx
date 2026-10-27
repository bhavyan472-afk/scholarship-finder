"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatchRing } from "@/components/scholarships/match-ring";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero({ activeCount }: { activeCount: number }) {
  return (
    <section className="relative overflow-hidden">
      <div className="mesh pointer-events-none absolute inset-0" aria-hidden />
      <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />

      <div className="container relative grid items-center gap-14 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:pb-28 lg:pt-24">
        <div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
            <Link
              href="/scholarships?deadlineWithin=14"
              className="group inline-flex items-center gap-2 rounded-full border bg-background/70 py-1 pl-1 pr-3 text-xs font-medium shadow-soft backdrop-blur transition-colors hover:border-primary/30"
            >
              <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">Live</span>
              <span className="text-muted-foreground">
                <span className="font-mono text-foreground tabular">{activeCount}</span> scholarships open right now
              </span>
              <ArrowRight className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.05 }}
            className="mt-6 text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-6xl lg:text-[4.1rem]"
          >
            Stop searching.
            <br />
            <span className="bg-gradient-to-r from-primary via-[hsl(258_70%_58%)] to-primary bg-clip-text text-transparent">
              Start qualifying.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.12 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
          >
            Tell us about you once. ScholarSphere checks every government, private and international scholarship against your
            profile, scores each match from 0 to 100, and explains exactly why you fit — or what you&apos;re missing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.18 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Button asChild size="lg">
              <Link href="/signup">
                Find my scholarships <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-background/60 backdrop-blur">
              <Link href="/scholarships">Browse without an account</Link>
            </Button>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground"
          >
            {["Free for students", "Takes 2 minutes", "Deadline reminders by email"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="size-4 text-success" aria-hidden /> {t}
              </li>
            ))}
          </motion.ul>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

/** A stylised "match report" — shows the product's core idea at a glance. */
function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.8, ease, delay: 0.2 }}
      className="relative mx-auto w-full max-w-md lg:mx-0"
      aria-hidden
    >
      <div className="absolute -inset-6 rounded-[28px] bg-gradient-to-br from-primary/15 via-transparent to-accent/15 blur-2xl" />
      <div className="relative rounded-2xl border bg-card/90 p-5 shadow-lift backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-accent" /> Match report
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">Ananya · B.Tech · KA</span>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <MatchRing score={92} status="eligible" size={72} stroke={6} />
          <div className="min-w-0">
            <p className="font-semibold leading-snug">AICTE Pragati Scholarship for Girls</p>
            <p className="mt-0.5 text-sm text-muted-foreground">₹50,000 / year · closes in 6 days</p>
          </div>
        </div>

        <ul className="mt-5 space-y-2 text-[13px]">
          {[
            "Family income ₹2.2L is within the ₹8L limit",
            "Covers Engineering · Undergraduate",
            "For female students",
          ].map((r) => (
            <li key={r} className="flex items-start gap-2">
              <Check className="mt-0.5 size-3.5 shrink-0 text-success" /> {r}
            </li>
          ))}
        </ul>

        <div className="mt-5 grid grid-cols-5 gap-1.5">
          {[
            ["Fit", 38, 40],
            ["Marks", 17, 20],
            ["Need", 13, 15],
            ["Value", 12, 15],
            ["Time", 10, 10],
          ].map(([label, pts, max]) => (
            <div key={label as string}>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${((pts as number) / (max as number)) * 100}%` }} />
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease, delay: 0.55 }}
        className="relative -mt-3 ml-8 rounded-xl border bg-card/95 p-4 shadow-lift backdrop-blur-xl sm:ml-16"
      >
        <div className="flex items-center gap-3">
          <MatchRing score={34} status="ineligible" size={40} stroke={4} />
          <div className="min-w-0 text-[13px]">
            <p className="font-medium">Kotak Kanya Scholarship</p>
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <X className="size-3.5 text-destructive" /> Requires at least 85% — you have 82%
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
