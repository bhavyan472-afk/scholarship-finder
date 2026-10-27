import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SITE } from "@/lib/site";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DAY = 86_400_000;

/** ₹2,40,000 → "₹2.4L"; ₹1,20,00,000 → "₹1.2Cr" (Indian numbering). */
export function formatInrCompact(amount: number): string {
  if (amount >= 1e7) return `₹${trim(amount / 1e7)}Cr`;
  if (amount >= 1e5) return `₹${trim(amount / 1e5)}L`;
  if (amount >= 1e3) return `₹${trim(amount / 1e3)}K`;
  return `₹${amount}`;
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function trim(n: number) {
  return n.toFixed(n >= 10 ? 0 : 1).replace(/\.0$/, "");
}

export function daysUntil(date: Date | string, now: Date = new Date()): number {
  return Math.ceil((new Date(date).getTime() - now.getTime()) / DAY);
}

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  });
}

export function deadlineLabel(date: Date | string, now: Date = new Date()): string {
  const d = daysUntil(date, now);
  if (d < 0) return "Closed";
  if (d === 0) return "Closes today";
  if (d === 1) return "1 day left";
  return `${d} days left`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 80);
}

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE.url).toString();
}
