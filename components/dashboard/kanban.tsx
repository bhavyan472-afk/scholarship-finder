"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Award, Bookmark, CircleX, GripVertical, PenLine, Send } from "lucide-react";
import { toast } from "sonner";
import { DeadlinePill } from "@/components/scholarships/bits";
import { Select } from "@/components/ui/input";
import { APPLICATION_STATUSES, LABELS, type ApplicationStatus, type Outcome } from "@/lib/constants";
import { api } from "@/lib/fetcher";
import { cn, formatInrCompact } from "@/lib/utils";
import type { ApplicationDTO } from "@/types";

const COLUMN_META: Record<ApplicationStatus, { icon: typeof Bookmark; hint: string; tone: string }> = {
  SAVED: { icon: Bookmark, hint: "Shortlisted", tone: "bg-muted-foreground" },
  APPLYING: { icon: PenLine, hint: "Gathering documents", tone: "bg-accent" },
  APPLIED: { icon: Send, hint: "Submitted, awaiting result", tone: "bg-primary" },
  RESULT: { icon: Award, hint: "Decision received", tone: "bg-success" },
};

export function KanbanBoard({ initial }: { initial: ApplicationDTO[] }) {
  const [items, setItems] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<ApplicationStatus | null>(null);

  async function update(id: string, patch: { status: ApplicationStatus; outcome?: Outcome | null }) {
    const prev = items;
    const current = items.find((i) => i.id === id);
    if (!current || (current.status === patch.status && patch.outcome === undefined)) return;
    setItems((list) =>
      list.map((i) =>
        i.id === id ? { ...i, status: patch.status, outcome: patch.status === "RESULT" ? (patch.outcome ?? i.outcome) : null } : i,
      ),
    );
    try {
      await api("/api/applications", { method: "PATCH", json: { id, ...patch } });
      if (current.status !== patch.status) toast.success(`Moved to ${LABELS.status[patch.status]}`, { description: current.scholarship.title });
    } catch (err) {
      setItems(prev);
      toast.error("Couldn't update application", { description: (err as Error).message });
    }
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:px-0">
      <div className="grid min-w-[960px] grid-cols-4 gap-4">
        {APPLICATION_STATUSES.map((status) => {
          const meta = COLUMN_META[status];
          const cards = items.filter((i) => i.status === status);
          return (
            <section
              key={status}
              aria-labelledby={`col-${status}`}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(status);
              }}
              onDragLeave={() => setOver((o) => (o === status ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                if (dragId) update(dragId, { status });
                setDragId(null);
              }}
              className={cn(
                "flex min-h-[420px] flex-col rounded-xl border bg-muted/40 p-3 transition-colors",
                over === status && "border-primary/40 bg-primary/[0.04]",
              )}
            >
              <header className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", meta.tone)} aria-hidden />
                  <h2 id={`col-${status}`} className="text-sm font-semibold">
                    {LABELS.status[status]}
                  </h2>
                  <span className="font-mono text-xs text-muted-foreground">{cards.length}</span>
                </div>
                <meta.icon className="size-4 text-muted-foreground" aria-hidden />
              </header>

              <ul className="grid gap-2.5">
                <AnimatePresence initial={false}>
                  {cards.map((a) => (
                    <motion.li
                      key={a.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <article
                        draggable
                        onDragStart={() => setDragId(a.id)}
                        onDragEnd={() => setDragId(null)}
                        className={cn(
                          "group rounded-lg border bg-card p-3 shadow-soft transition-shadow hover:shadow-lift",
                          dragId === a.id && "opacity-50",
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="mt-0.5 size-4 shrink-0 cursor-grab text-muted-foreground/50" aria-hidden />
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/scholarships/${a.scholarship.slug}`}
                              className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary"
                            >
                              {a.scholarship.title}
                            </Link>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{a.scholarship.provider}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold tabular">{formatInrCompact(a.scholarship.amountInr)}</span>
                          {status !== "RESULT" && <DeadlinePill deadline={a.scholarship.deadline} />}
                          {status === "RESULT" && a.outcome && (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-xs font-medium",
                                a.outcome === "AWARDED" ? "text-success" : "text-muted-foreground",
                              )}
                            >
                              {a.outcome === "AWARDED" ? <Award className="size-3.5" /> : <CircleX className="size-3.5" />}
                              {LABELS.outcome[a.outcome]}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 grid gap-2 border-t pt-3">
                          <Select
                            aria-label={`Move ${a.scholarship.title} to`}
                            value={a.status}
                            onChange={(e) => update(a.id, { status: e.target.value as ApplicationStatus })}
                            className="h-8 text-xs"
                          >
                            {APPLICATION_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s === a.status ? `In: ${LABELS.status[s]}` : `Move to ${LABELS.status[s]}`}
                              </option>
                            ))}
                          </Select>
                          {status === "RESULT" && (
                            <Select
                              aria-label={`Outcome for ${a.scholarship.title}`}
                              value={a.outcome ?? ""}
                              onChange={(e) => update(a.id, { status: "RESULT", outcome: (e.target.value || null) as Outcome | null })}
                              className="h-8 text-xs"
                            >
                              <option value="">Outcome pending</option>
                              <option value="AWARDED">Awarded 🎉</option>
                              <option value="REJECTED">Not selected</option>
                            </Select>
                          )}
                        </div>
                      </article>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>

              {cards.length === 0 && (
                <p className="m-auto max-w-[180px] py-8 text-center text-xs text-muted-foreground">
                  {status === "SAVED" ? "Save scholarships to start tracking." : `Drag cards here — ${meta.hint.toLowerCase()}.`}
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
