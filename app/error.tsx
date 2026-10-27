"use client";

import ErrorView from "@/components/errors/error-view";
import { SiteHeader } from "@/components/layout/site-header";

// Fallback for routes without a closer error.tsx. It renders directly under the root layout, so it brings its own header.
export default function RootError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <ErrorView {...props} />
      </main>
    </>
  );
}
