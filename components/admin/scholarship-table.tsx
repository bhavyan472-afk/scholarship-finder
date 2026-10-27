"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { ProviderBadge } from "@/components/scholarships/bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { api } from "@/lib/fetcher";
import { formatDate, formatInrCompact } from "@/lib/utils";
import type { Paginated, ScholarshipDTO } from "@/types";
import { CsvImportDialog } from "./csv-import";
import { ScholarshipFormDialog } from "./scholarship-form";

type Row = ScholarshipDTO & { savedCount: number; applicationCount: number };

export function ScholarshipTable() {
  const [data, setData] = useState<Paginated<Row> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Row | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15", ...(query ? { q: query } : {}) });
      setData(await api<Paginated<Row>>(`/api/admin/scholarships?${params}`));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const openForm = (row: Row | null) => {
    setEditing(row);
    setFormKey((k) => k + 1); // remount to reset form state
    setFormOpen(true);
  };

  async function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    try {
      await api(`/api/admin/scholarships/${deleting.id}`, { method: "DELETE" });
      toast.success("Scholarship deleted", { description: deleting.title });
      setDeleting(null);
      load();
    } catch (err) {
      toast.error("Couldn't delete", { description: (err as Error).message });
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or provider" aria-label="Search scholarships" className="pl-9" />
        </div>
        <div className="flex gap-2">
          <CsvImportDialog onImported={load} />
          <Button onClick={() => openForm(null)}>
            <Plus /> New scholarship
          </Button>
        </div>
      </div>

      {error ? (
        <EmptyState icon={AlertTriangle} title="Couldn't load scholarships" description={error} action={<Button variant="outline" onClick={load}>Retry</Button>} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-soft">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Scholarship</th>
                <th scope="col" className="px-4 py-3 font-medium">Type</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
                <th scope="col" className="px-4 py-3 font-medium">Deadline</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Saves</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && !data
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-4 py-3">
                        <Skeleton className="h-8 w-full" />
                      </td>
                    </tr>
                  ))
                : data?.items.map((s) => {
                    const closed = new Date(s.deadline) < new Date();
                    return (
                      <tr key={s.id} className="transition-colors hover:bg-muted/30">
                        <td className="max-w-[320px] px-4 py-3">
                          <Link href={`/scholarships/${s.slug}`} className="line-clamp-1 font-medium hover:text-primary">
                            {s.title}
                          </Link>
                          <p className="line-clamp-1 text-xs text-muted-foreground">{s.provider}</p>
                        </td>
                        <td className="px-4 py-3"><ProviderBadge type={s.providerType} /></td>
                        <td className="px-4 py-3 text-right font-medium tabular">{formatInrCompact(s.amountInr)}</td>
                        <td className="whitespace-nowrap px-4 py-3 tabular">{formatDate(s.deadline)}</td>
                        <td className="px-4 py-3 text-right font-mono tabular">{s.savedCount}</td>
                        <td className="px-4 py-3">
                          {!s.isActive ? <Badge variant="neutral">Hidden</Badge> : closed ? <Badge variant="destructive">Closed</Badge> : <Badge variant="success">Live</Badge>}
                          {s.featured && <Badge variant="accent" className="ml-1">Featured</Badge>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon-sm" onClick={() => openForm(s)} aria-label={`Edit ${s.title}`}>
                              <Pencil />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(s)} aria-label={`Delete ${s.title}`} className="text-destructive hover:text-destructive">
                              <Trash2 />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
          {data && data.items.length === 0 && <p className="p-10 text-center text-sm text-muted-foreground">No scholarships found.</p>}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">{data.total}</span> total · page {data.page} of {data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft /> Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight />
            </Button>
          </div>
        </div>
      )}

      <ScholarshipFormDialog key={formKey} open={formOpen} onOpenChange={setFormOpen} scholarship={editing} onSaved={load} />

      <Dialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete scholarship?</DialogTitle>
            <DialogDescription>
              “{deleting?.title}” will be permanently removed, along with {deleting?.savedCount ?? 0} saves and tracker cards. To hide
              it from students instead, edit it and untick “Active”.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} loading={deletePending}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
