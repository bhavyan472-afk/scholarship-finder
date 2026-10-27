"use client";

import { useRef, useState } from "react";
import { Download, FileUp, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/lib/fetcher";

interface ImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

export function CsvImportDialog({ onImported }: { onImported: () => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload() {
    if (!file) return;
    setPending(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await api<ImportResult>("/api/admin/scholarships/import", { method: "POST", body });
      setResult(res);
      if (res.created + res.updated > 0) {
        toast.success(`Imported ${res.created + res.updated} scholarships`, {
          description: `${res.created} new · ${res.updated} updated${res.failed ? ` · ${res.failed} failed` : ""}`,
        });
        onImported();
      } else toast.error("No rows imported", { description: "Check the errors below." });
    } catch (err) {
      toast.error("Import failed", { description: (err as Error).message });
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setFile(null);
          setResult(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload /> Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk import scholarships</DialogTitle>
          <DialogDescription>
            Rows are matched by title: existing scholarships are updated, new ones created. Use “|” to separate list values
            (e.g. <code className="font-mono">SC|ST</code>).
          </DialogDescription>
        </DialogHeader>

        <a
          href="/api/admin/scholarships/import"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          download
        >
          <Download className="size-4" /> Download CSV template
        </a>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="grid place-items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center transition-colors hover:bg-muted/50"
        >
          <FileUp className="size-6 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium">{file ? file.name : "Choose a .csv file"}</span>
          <span className="text-xs text-muted-foreground">Max 2 MB</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          aria-label="CSV file"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setResult(null);
          }}
        />

        {result && (
          <div className="rounded-lg border bg-muted/40 p-3 text-sm" role="status">
            <p>
              <span className="font-mono font-semibold">{result.created}</span> created ·{" "}
              <span className="font-mono font-semibold">{result.updated}</span> updated ·{" "}
              <span className="font-mono font-semibold">{result.failed}</span> failed
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-destructive">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={upload} disabled={!file} loading={pending}>
            Import
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
