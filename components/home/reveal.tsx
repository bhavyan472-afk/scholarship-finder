"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

/** Slow, editorial easing — long tail, no overshoot. */
export const ease = [0.16, 1, 0.3, 1] as const;

/** Fade + gentle rise when scrolled into view. Reduced motion is handled by MotionConfig. */
export function Reveal({ delay = 0, y = 18, ...props }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 1, ease, delay }}
      {...props}
    />
  );
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const child = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, ease } } };

/** Parent for staggered reveals; wrap each child in <StaggerItem>. */
export function Stagger({ as = "div", ...props }: HTMLMotionProps<"div"> & { as?: "div" | "ol" | "ul" }) {
  const Comp = motion[as] as typeof motion.div;
  return <Comp variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} {...props} />;
}

export function StaggerItem({ as = "div", ...props }: HTMLMotionProps<"div"> & { as?: "div" | "li" }) {
  const Comp = motion[as] as typeof motion.div;
  return <Comp variants={child} {...props} />;
}
