"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shared body for route-segment error boundaries (app/**\/error.tsx). */
export default function ErrorView({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Server errors arrive with a digest only; the full error is in the server (Vercel) logs.
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="container grid min-h-[60dvh] place-items-center py-20 text-center">
      <div>
        <div className="mx-auto grid size-12 place-items-center rounded-xl border border-destructive/30 bg-destructive/5">
          <AlertTriangle className="size-5 text-destructive" aria-hidden />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
          An unexpected error occurred. Try again — if it keeps happening, please let us know.
        </p>
        {error.digest && <p className="mt-2 font-mono text-xs text-muted-foreground">Ref: {error.digest}</p>}
        {/* Production strips server error messages; in dev, show the real cause instead of a dead end. */}
        {process.env.NODE_ENV === "development" && error.message && (
          <pre className="mx-auto mt-4 max-w-xl overflow-x-auto whitespace-pre-wrap rounded-lg border bg-muted/50 p-3 text-left font-mono text-xs text-muted-foreground">
            {error.message}
          </pre>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
