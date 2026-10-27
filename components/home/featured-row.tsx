"use client";

import Link from "next/link";
import * as Tabs from "@radix-ui/react-tabs";
import { ArrowRight } from "lucide-react";
import type { HomeCategory } from "@/lib/home-data";
import { ScholarshipCard } from "@/components/scholarships/scholarship-card";
import { DbUnavailable } from "@/components/errors/db-unavailable";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

/** `categories` is null when the database is unreachable. */
export function FeaturedRow({ categories }: { categories: HomeCategory[] | null }) {
  return (
    <section aria-labelledby="featured-title" className="border-t">
      <div className="container py-24 sm:py-32">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading id="featured-title" overline="Featured" title={<>Worth your time, <em>closing soon.</em></>} />
          <Reveal>
            <Link
              href="/scholarships"
              className="group inline-flex items-center gap-2 border-b border-foreground/30 pb-1 text-sm font-medium transition-colors hover:border-foreground"
            >
              Browse all scholarships <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </Reveal>
        </div>

        {categories === null ? (
          <DbUnavailable retryHref="/" className="mt-12" />
        ) : categories.length === 0 ? (
          <p className="mt-12 rounded-[20px] border border-dashed p-10 text-center text-muted-foreground">
            New scholarships are being added. <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">Create your profile</Link> and we&apos;ll show your matches as soon as they&apos;re live.
          </p>
        ) : (
          <Reveal delay={0.1}>
            <Tabs.Root defaultValue={categories[0].id} className="mt-12">
              <Tabs.List aria-label="Scholarship categories" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
                {categories.map((c) => (
                  <Tabs.Trigger
                    key={c.id}
                    value={c.id}
                    className="shrink-0 rounded-full border border-transparent px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-foreground"
                  >
                    {c.label}
                    <span className="ml-2 text-xs text-muted-foreground tabular">{c.items.length}</span>
                  </Tabs.Trigger>
                ))}
              </Tabs.List>

              {categories.map((c) => (
                <Tabs.Content key={c.id} value={c.id} className="mt-8 focus-visible:outline-none">
                  <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 [scrollbar-width:thin] sm:mx-0 sm:scroll-px-0 sm:px-0">
                    {c.items.map((s) => (
                      <li key={s.id} className="w-[min(320px,85vw)] shrink-0 snap-start [&_article]:rounded-[20px] [&_article]:shadow-none">
                        <ScholarshipCard item={s} />
                      </li>
                    ))}
                    <li className="w-[min(240px,70vw)] shrink-0 snap-start">
                      <Link
                        href={c.href}
                        className="group flex h-full min-h-[220px] flex-col justify-between rounded-[20px] border border-dashed p-6 transition-colors hover:border-primary/50"
                      >
                        <span className="font-serif text-2xl leading-tight">
                          All {c.label.toLowerCase()} <em className="text-highlight">scholarships</em>
                        </span>
                        <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
                      </Link>
                    </li>
                  </ul>
                </Tabs.Content>
              ))}
            </Tabs.Root>
          </Reveal>
        )}
      </div>
    </section>
  );
}
