import Link from "next/link";
import { Compass } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="container grid flex-1 place-items-center py-20 text-center">
        <div>
          <div className="mx-auto grid size-12 place-items-center rounded-xl border bg-card shadow-soft">
            <Compass className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <p className="mt-6 font-mono text-sm text-muted-foreground">404</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">This page doesn&apos;t exist</h1>
          <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
            The scholarship may have closed or been removed. Let&apos;s get you back on track.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild>
              <Link href="/scholarships">Browse scholarships</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
