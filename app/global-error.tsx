"use client";

import { useEffect } from "react";
import "./globals.css";

// Last-resort boundary for errors in the root layout itself. Replaces <html>, so no providers or theme.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="grid min-h-dvh place-items-center bg-background p-6 font-sans text-foreground">
        <main className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">ScholarSphere is having trouble</h1>
          <p className="mx-auto mt-2 max-w-sm text-muted-foreground">Please try again in a moment.</p>
          {error.digest && <p className="mt-2 font-mono text-xs text-muted-foreground">Ref: {error.digest}</p>}
          <button
            onClick={reset}
            className="mt-8 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
