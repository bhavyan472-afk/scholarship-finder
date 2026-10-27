"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { Stagger, StaggerItem } from "./reveal";

type Format = "count" | "crore";

function formatValue(v: number, format: Format) {
  if (format === "crore") {
    // ₹ in crore below 100 Cr gets one decimal; lakh for small catalogues.
    if (v >= 1e7) return `₹${(v / 1e7).toFixed(v >= 1e9 ? 0 : 1).replace(/\.0$/, "")}Cr`;
    return `₹${Math.round(v / 1e5)}L`;
  }
  return Math.round(v).toLocaleString("en-IN");
}

function CountUp({ value, format }: { value: number; format: Format }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? value : 0);
  const text = useTransform(mv, (v) => formatValue(v, format));

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(mv, value, { duration: 2.2, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, reduce, value, mv]);

  return (
    <>
      <motion.span ref={ref} aria-hidden className="tabular">
        {text}
      </motion.span>
      <span className="sr-only">{formatValue(value, format)}</span>
    </>
  );
}

export function BigNumbers({ openCount, totalValue, providerCount }: { openCount: number; totalValue: number; providerCount: number }) {
  const stats: Array<{ value: number; format: Format; label: string }> = [
    { value: openCount, format: "count", label: "Open scholarships tracked" },
    { value: totalValue, format: "crore", label: "In annual awards indexed" },
    { value: providerCount, format: "count", label: "Government, CSR & global providers" },
  ];

  return (
    <section aria-label="ScholarSphere in numbers" className="container py-24 sm:py-32">
      <Stagger as="ul" className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {stats.map((s) => (
          <StaggerItem as="li" key={s.label} className="py-8 text-center sm:px-6 sm:py-2">
            <p className="font-serif text-[clamp(4rem,8vw,6.5rem)] leading-none tracking-[-0.03em]">
              <CountUp value={s.value} format={s.format} />
            </p>
            <p className="mt-4 text-sm text-muted-foreground">{s.label}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
