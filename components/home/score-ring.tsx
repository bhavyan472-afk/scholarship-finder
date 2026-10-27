"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";

/** Match-score ring that counts up from 0 the first time it scrolls into view. */
export function ScoreRing({ score, size = 96, stroke = 5, delay = 0.2 }: { score: number; size?: number; stroke?: number; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const value = useMotionValue(reduce ? score : 0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = useTransform(value, (v) => c * (1 - v / 100));
  const label = useTransform(value, (v) => Math.round(v).toString());

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(value, score, { duration: 1.8, delay, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, reduce, score, delay, value]);

  return (
    <div ref={ref} className="relative grid shrink-0 place-items-center text-primary" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <span className="absolute flex flex-col items-center leading-none">
        <motion.span className="font-serif tabular text-foreground" style={{ fontSize: size * 0.36 }}>
          {label}
        </motion.span>
        <span className="sr-only">Match score {score} out of 100</span>
      </span>
    </div>
  );
}
