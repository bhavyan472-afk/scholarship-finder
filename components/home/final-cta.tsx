import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";

/** Full-bleed dark band. Uses fixed colours (not theme tokens) so it stays dark in both themes. */
export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="relative overflow-hidden bg-[#0F172A] text-[#F5F1EA] dark:border-y dark:border-white/10 dark:bg-[#111116]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(40%_60%_at_50%_0%,rgba(15,118,110,0.35),transparent_70%),radial-gradient(30%_40%_at_85%_100%,rgba(212,168,75,0.14),transparent_70%)]"
      />
      <Reveal className="container relative py-28 text-center sm:py-36">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#F5F1EA]/70">Free for every student</p>
        <h2 id="cta-title" className="display mx-auto mt-6 max-w-4xl text-[clamp(3rem,7vw,6rem)]">
          Stop searching. <em className="text-[#E0BC6A]">Start qualifying.</em>
        </h2>
        <p className="mx-auto mt-7 max-w-md text-lg text-[#F5F1EA]/75">
          Create your profile and see every scholarship you qualify for in under two minutes.
        </p>
        <Link
          href="/signup"
          className="group mt-11 inline-flex items-center gap-2 rounded-full bg-[#F5F1EA] px-8 py-4 text-[15px] font-medium text-[#0F172A] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0BC6A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A]"
        >
          Get my matches <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </Reveal>
    </section>
  );
}
