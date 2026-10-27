import { DatabaseZap, RotateCw } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

/** Shown in place of database-backed content when the database can't be reached (see withDbFallback). */
export function DbUnavailable({
  retryHref,
  title = "Scholarship data is temporarily unavailable",
  description = "We couldn't reach our database just now. The rest of the site still works — please try again in a moment.",
  className,
}: {
  /** Full page reload target, so server components re-run their queries. */
  retryHref: string;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div role="alert">
      <EmptyState
        icon={DatabaseZap}
        title={title}
        description={description}
        className={className}
        action={
          <Button asChild variant="outline">
            <a href={retryHref}>
              <RotateCw /> Try again
            </a>
          </Button>
        }
      />
    </div>
  );
}
