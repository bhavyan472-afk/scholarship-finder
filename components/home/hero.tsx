"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { INDIAN_STATES, LABELS } from "@/lib/constants";
import { parseProfileText, prefillToParams, type ProfilePrefill } from "@/lib/profile-prefill";
import { formatInrCompact } from "@/lib/utils";

const TRUST = ["Free", "2 minutes", "Email reminders"];

function describe(p: ProfilePrefill): string[] {
  return [
    p.level && LABELS.educationLevel[p.level],
    p.course && LABELS.course[p.course],
    p.state && INDIAN_STATES[p.state],
    p.marks !== undefined && (p.marksType === "CGPA" ? `${p.marks} CGPA` : `${p.marks}%`),
    p.category && LABELS.category[p.category],
    p.gender && LABELS.gender[p.gender],
    p.income !== undefined && `${formatInrCompact(p.income)} income`,
  ].filter(Boolean) as string[];
}

/** `openCount` is null when the database is unavailable; the live badge only shows for a positive count. */
export function Hero({ openCount }: { openCount: number | null }) {
  const router = useRouter();
  const { status } = useSession();
  const [text, setText] = useState("");
  const prefill = useMemo(() => parseProfileText(text), [text]);
  const detected = describe(prefill);

  // Gentle parallax: the hero copy drifts up and softens as the page scrolls away from it.
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.9], [1, reduce ? 1 : 0.2]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = prefillToParams(prefill).toString();
    const onboarding = `/onboarding${query ? `?${query}` : ""}`;
    router.push(status === "authenticated" ? onboarding : `/signup?callbackUrl=${encodeURIComponent(onboarding)}`);
  }

  // Entrance is CSS (see .hero-rise) so it plays on the server-rendered HTML without waiting for hydration.
  const rise = (delay: number) => ({ animationDelay: `${delay}s` });

  return (
    <section ref={ref} className="relative overflow-hidden" aria-labelledby="hero-title">
      {/* Soft emerald/gold wash behind the headline. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[720px] [background:radial-gradient(45%_55%_at_50%_0%,hsl(var(--primary)/0.10),transparent_70%),radial-gradient(30%_35%_at_78%_18%,hsl(var(--gold)/0.08),transparent_70%)]"
      />

      <motion.div style={{ y, opacity }} className="container relative flex flex-col items-center pb-16 pt-16 text-center sm:pt-24 lg:pb-20 lg:pt-28">
        {openCount !== null && openCount > 0 && (
          <div className="hero-rise" style={rise(0)}>
            <Link
              href="/scholarships?deadlineWithin=14"
              className="group mb-8 inline-flex items-center gap-2 rounded-full border bg-card/60 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <span className="font-medium text-primary">Live</span>
              <span aria-hidden className="h-3 w-px bg-border" />
              <span>
                <span className="font-medium text-foreground tabular">{openCount.toLocaleString("en-IN")}</span> scholarships open
              </span>
              <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        )}

        <p style={rise(0.05)} className="hero-rise eyebrow">
          For Indian students · Free forever
        </p>

        <h1
          id="hero-title"
          style={rise(0.12)}
          className="hero-rise display mt-6 max-w-5xl text-[clamp(3.5rem,9vw,7rem)] leading-[0.92] tracking-[-0.035em]"
        >
          Your education, <em className="whitespace-nowrap text-highlight">fully funded.</em>
        </h1>

        <p style={rise(0.2)} className="hero-rise mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          One profile. Every scholarship you qualify for — ranked, explained and tracked to the deadline.
        </p>

        <form style={rise(0.28)} onSubmit={onSubmit} className="hero-rise mt-11 w-full max-w-2xl" role="search" aria-label="Find matching scholarships">
          <div className="flex flex-col gap-2 rounded-[20px] border bg-card p-2 shadow-[0_1px_2px_hsl(var(--shadow)/0.04),0_24px_48px_-24px_hsl(var(--shadow)/0.18)] transition-[border-color,box-shadow] focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/15 sm:flex-row sm:items-center">
            <label htmlFor="hero-describe" className="sr-only">
              Describe yourself
            </label>
            <input
              id="hero-describe"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe yourself: B.Tech, Telangana, 82%…"
              autoComplete="off"
              aria-describedby="hero-detected"
              className="h-12 min-w-0 flex-1 rounded-xl bg-transparent px-4 text-base outline-none placeholder:text-muted-foreground/80 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <button
              type="submit"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-[14px] bg-primary px-6 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              Find matches <ArrowUpRight className="size-4" aria-hidden />
            </button>
          </div>
          <p id="hero-detected" aria-live="polite" className="mt-3 min-h-5 text-left text-[13px] text-muted-foreground sm:px-4">
            {detected.length > 0 ? (
              <>
                <span className="text-foreground/80">We&apos;ll prefill:</span> {detected.join(" · ")}
              </>
            ) : (
              <span className="sr-only">Type your course, state and marks, then press Find matches.</span>
            )}
          </p>
        </form>

        <ul style={rise(0.36)} className="hero-rise mt-6 flex items-center gap-3 text-sm text-muted-foreground" aria-label="What you get">
          {TRUST.map((t, i) => (
            <li key={t} className="flex items-center gap-3">
              {i > 0 && <span aria-hidden className="text-gold">·</span>}
              {t}
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}
