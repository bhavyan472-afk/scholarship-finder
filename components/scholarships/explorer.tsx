"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { AlertTriangle, ChevronLeft, ChevronRight, Search, SearchX, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { listItem } from "@/components/motion";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Checkbox, Label, Skeleton } from "@/components/ui/primitives";
import { EDUCATION_LEVELS, INDIAN_STATES, LABELS, PROVIDER_TYPES } from "@/lib/constants";
import { api } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { Paginated, ScholarshipListItem } from "@/types";
import { ScholarshipCard } from "./scholarship-card";

const AMOUNTS = [
  { label: "Any amount", min: "", max: "" },
  { label: "Under ₹25K", min: "", max: "25000" },
  { label: "₹25K – ₹1L", min: "25000", max: "100000" },
  { label: "₹1L – ₹5L", min: "100000", max: "500000" },
  { label: "₹5L+", min: "500000", max: "" },
];

const DEADLINES = [
  { label: "Any time", value: "" },
  { label: "Next 7 days", value: "7" },
  { label: "Next 30 days", value: "30" },
  { label: "Next 90 days", value: "90" },
];

export function ScholarshipExplorer() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { status } = useSession();
  const signedIn = status === "authenticated";

  const [data, setData] = useState<Paginated<ScholarshipListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [retry, setRetry] = useState(0);
  const [q, setQ] = useState(params.get("q") ?? "");
  const resultsRef = useRef<HTMLDivElement>(null);

  const setParams = useCallback(
    (updates: Record<string, string | null>, { resetPage = true } = {}) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      if (resetPage) next.delete("page");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  // Debounce the search box into the URL.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) setParams({ q: q || null });
    }, 300);
    return () => clearTimeout(t);
  }, [q, params, setParams]);

  // Fetch whenever the URL (or auth state) changes.
  const query = params.toString();
  useEffect(() => {
    if (status === "loading") return;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    api<Paginated<ScholarshipListItem>>(`/api/scholarships?${query}`, { signal: ctrl.signal })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [query, status, retry]);

  const providerTypes = (params.get("providerType") ?? "").split(",").filter(Boolean);
  const levels = (params.get("level") ?? "").split(",").filter(Boolean);
  const amountIdx = Math.max(
    0,
    AMOUNTS.findIndex((a) => a.min === (params.get("minAmount") ?? "") && a.max === (params.get("maxAmount") ?? "")),
  );
  const sort = params.get("sort") ?? (signedIn ? "match" : "deadline");
  const page = Number(params.get("page") ?? 1);
  const activeFilters = providerTypes.length + levels.length + (amountIdx ? 1 : 0) + (params.get("deadlineWithin") ? 1 : 0) + (params.get("state") ? 1 : 0) + (params.get("eligibleOnly") ? 1 : 0);

  const toggleIn = (key: string, list: string[], value: string) =>
    setParams({ [key]: (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]).join(",") || null });

  const goToPage = (p: number) => {
    setParams({ page: p > 1 ? String(p) : null }, { resetPage: false });
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filters = (
    <div className="grid gap-7">
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-semibold">Provider</legend>
        {PROVIDER_TYPES.map((t) => (
          <Checkbox
            key={t}
            label={LABELS.providerType[t]}
            checked={providerTypes.includes(t)}
            onChange={() => toggleIn("providerType", providerTypes, t)}
            className="p-2.5"
          />
        ))}
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-semibold">Education level</legend>
        <div className="flex flex-wrap gap-1.5">
          {EDUCATION_LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={levels.includes(l)}
              onClick={() => toggleIn("level", levels, l)}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted",
                levels.includes(l) && "border-primary/50 bg-primary/[0.06] text-primary",
              )}
            >
              {LABELS.educationLevel[l]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-2">
        <Label htmlFor="f-amount">Award amount</Label>
        <Select
          id="f-amount"
          value={amountIdx}
          onChange={(e) => {
            const a = AMOUNTS[Number(e.target.value)];
            setParams({ minAmount: a.min || null, maxAmount: a.max || null });
          }}
        >
          {AMOUNTS.map((a, i) => (
            <option key={a.label} value={i}>
              {a.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="f-deadline">Deadline</Label>
        <Select id="f-deadline" value={params.get("deadlineWithin") ?? ""} onChange={(e) => setParams({ deadlineWithin: e.target.value || null })}>
          {DEADLINES.map((d) => (
            <option key={d.label} value={d.value}>
              {d.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="f-state">State</Label>
        <Select id="f-state" value={params.get("state") ?? ""} onChange={(e) => setParams({ state: e.target.value || null })}>
          <option value="">All states</option>
          {Object.entries(INDIAN_STATES).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </Select>
      </div>

      {signedIn && (
        <Checkbox
          label="Hide ones I'm not eligible for"
          checked={params.get("eligibleOnly") === "true"}
          onChange={(e) => setParams({ eligibleOnly: e.target.checked ? "true" : null })}
        />
      )}

      {activeFilters > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="justify-self-start"
          onClick={() => {
            setQ("");
            router.replace(pathname, { scroll: false });
          }}
        >
          <X /> Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="sticky top-24">{filters}</div>
      </aside>

      <div ref={resultsRef} className="min-w-0 scroll-mt-24">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, provider or keyword…"
              aria-label="Search scholarships"
              className="h-11 pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-11 lg:hidden" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}>
              <SlidersHorizontal /> Filters
              {activeFilters > 0 && (
                <span className="rounded-full bg-primary px-1.5 font-mono text-[11px] text-primary-foreground">{activeFilters}</span>
              )}
            </Button>
            <Select
              aria-label="Sort by"
              value={sort}
              onChange={(e) => setParams({ sort: e.target.value })}
              className="h-11 min-w-[170px]"
              containerClassName="flex-1 sm:flex-none"
            >
              <option value="match" disabled={!signedIn}>
                Best match{!signedIn ? " (sign in)" : ""}
              </option>
              <option value="deadline">Closing soonest</option>
              <option value="amount">Highest amount</option>
            </Select>
          </div>
        </div>

        {filtersOpen && <div className="mt-4 rounded-xl border bg-card p-5 shadow-soft lg:hidden">{filters}</div>}

        {!signedIn && status !== "loading" && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm">
              <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
              Sign in to see your personal match score and why you qualify.
            </p>
            <Button asChild size="sm">
              <Link href="/signup">Get my matches</Link>
            </Button>
          </div>
        )}

        <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
          {loading ? "Searching…" : data ? `${data.total} scholarship${data.total === 1 ? "" : "s"} found` : ""}
        </p>

        <div className="mt-4">
          {error ? (
            <EmptyState
              icon={AlertTriangle}
              title="We couldn't load scholarships"
              description={error}
              action={
                <Button variant="outline" onClick={() => setRetry((n) => n + 1)}>
                  Try again
                </Button>
              }
            />
          ) : loading && !data ? (
            <ResultsSkeleton />
          ) : data && data.items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No scholarships match these filters"
              description="Try widening the amount range, removing a level, or clearing your search."
              action={
                <Button variant="outline" onClick={() => router.replace(pathname)}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            data && (
              <div className={cn("grid gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-3", loading && "opacity-60")}>
                {data.items.map((item, i) => (
                  <motion.div key={item.id} custom={i} variants={listItem} initial="hidden" animate="show" className="h-full">
                    <ScholarshipCard item={item} />
                  </motion.div>
                ))}
              </div>
            )
          )}
        </div>

        {data && data.totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-10 flex items-center justify-between gap-4">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
              <ChevronLeft /> Previous
            </Button>
            <p className="text-sm text-muted-foreground">
              Page <span className="font-mono text-foreground">{data.page}</span> of {data.totalPages}
            </p>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => goToPage(page + 1)}>
              Next <ChevronRight />
            </Button>
          </nav>
        )}
      </div>
    </div>
  );
}

export function ResultsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading scholarships" role="status">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-5 h-5 w-4/5" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <Skeleton className="mt-5 h-3.5 w-full" />
          <Skeleton className="mt-2 h-3.5 w-3/4" />
          <div className="mt-6 flex justify-between border-t border-dashed pt-4">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-4 w-24 self-end" />
          </div>
        </div>
      ))}
    </div>
  );
}
