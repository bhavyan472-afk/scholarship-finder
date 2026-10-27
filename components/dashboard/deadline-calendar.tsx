"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CalendarEvent {
  date: string;
  title: string;
  href: string;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export function DeadlineCalendar({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(null);
  // Dates depend on the viewer's timezone, so render the grid only on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const byDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const k = key(new Date(e.date));
      m.set(k, [...(m.get(k) ?? []), e]);
    }
    return m;
  }, [events]);

  const days = useMemo(() => {
    const first = new Date(cursor);
    const offset = (first.getDay() + 6) % 7; // Monday-first
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: count }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)),
    ];
  }, [cursor]);

  const shift = (n: number) => {
    setSelected(null);
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));
  };

  const selectedEvents = selected ? (byDay.get(selected) ?? []) : [];
  if (!mounted) return <div className="aspect-[7/6.5] animate-pulse rounded-lg bg-muted" aria-hidden />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-medium" aria-live="polite">
          {cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => shift(-1)} aria-label="Previous month">
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => shift(1)} aria-label="Next month">
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center" role="grid" aria-label="Deadline calendar">
        {WEEKDAYS.map((d) => (
          <div key={d} role="columnheader" className="py-1 text-[11px] font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {days.map((d, i) => {
          if (!d) return <div key={`pad-${i}`} />;
          const k = key(d);
          const evts = byDay.get(k);
          const isToday = k === key(today);
          return (
            <button
              key={k}
              type="button"
              role="gridcell"
              disabled={!evts}
              onClick={() => setSelected(selected === k ? null : k)}
              aria-label={`${d.toDateString()}${evts ? `, ${evts.length} deadline${evts.length > 1 ? "s" : ""}` : ""}`}
              aria-selected={selected === k}
              className={cn(
                "relative grid aspect-square place-items-center rounded-md font-mono text-xs tabular transition-colors",
                evts ? "cursor-pointer font-semibold hover:bg-primary/10" : "text-muted-foreground",
                isToday && "ring-1 ring-inset ring-primary/40",
                selected === k && "bg-primary text-primary-foreground hover:bg-primary",
              )}
            >
              {d.getDate()}
              {evts && (
                <span
                  className={cn(
                    "absolute bottom-1 size-1 rounded-full",
                    selected === k ? "bg-primary-foreground" : "bg-accent",
                  )}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>

      {selectedEvents.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t pt-3">
          {selectedEvents.map((e) => (
            <li key={e.href}>
              <Link href={e.href} className="line-clamp-1 text-sm font-medium hover:text-primary">
                {e.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
