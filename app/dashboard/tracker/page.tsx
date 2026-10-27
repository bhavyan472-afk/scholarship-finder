import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { KanbanSquare } from "lucide-react";
import { KanbanBoard } from "@/components/dashboard/kanban";
import { EmptyState } from "@/components/empty-state";
import { PageTransition } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applicationInclude, serializeApplication } from "@/lib/scholarships";

export const metadata: Metadata = { title: "Application tracker" };

export default async function TrackerPage() {
  const session = (await getServerSession(authOptions))!;
  const rows = await prisma.application.findMany({
    where: { userId: session.user.id },
    include: applicationInclude,
    orderBy: { scholarship: { deadline: "asc" } },
  });
  const items = rows.map(serializeApplication);

  return (
    <PageTransition className="grid gap-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Application tracker</h1>
          <p className="mt-1 text-muted-foreground">Drag cards between columns, or use the “Move to” menu on each card.</p>
        </div>
      </header>
      {items.length === 0 ? (
        <EmptyState
          icon={KanbanSquare}
          title="Your tracker is empty"
          description="Save a scholarship or click “Apply on official site” and it will appear here."
          action={
            <Button asChild>
              <Link href="/dashboard/matches">Find scholarships</Link>
            </Button>
          }
        />
      ) : (
        <KanbanBoard initial={items} />
      )}
    </PageTransition>
  );
}
