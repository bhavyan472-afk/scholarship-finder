import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <circle cx="16" cy="16" r="6.5" className="fill-primary-foreground" opacity="0.95" />
      <ellipse
        cx="16"
        cy="16"
        rx="11"
        ry="4.2"
        transform="rotate(-24 16 16)"
        fill="none"
        className="stroke-primary-foreground"
        strokeWidth="1.6"
        opacity="0.55"
      />
      <circle cx="25.4" cy="11.2" r="2.2" className="fill-accent" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 rounded-md font-semibold tracking-tight", className)}>
      <LogoMark />
      <span className="text-[15px]">
        Scholar<span className="text-primary">Sphere</span>
      </span>
    </Link>
  );
}
