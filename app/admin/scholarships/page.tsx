import type { Metadata } from "next";
import { ScholarshipTable } from "@/components/admin/scholarship-table";
import { PageTransition } from "@/components/motion";
import { requireAdminPage } from "@/lib/auth-guard";

export const metadata: Metadata = { title: "Manage scholarships" };
export const dynamic = "force-dynamic";

export default async function AdminScholarshipsPage() {
  await requireAdminPage();
  return (
    <PageTransition className="grid gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Scholarships</h1>
        <p className="mt-1 text-muted-foreground">Create, edit, hide or bulk-import scholarships and their eligibility rules.</p>
      </header>
      <ScholarshipTable />
    </PageTransition>
  );
}
