import { AppNav, type NavItem } from "@/components/layout/app-nav";
import { SiteHeader } from "@/components/layout/site-header";
import { requireAdminPage } from "@/lib/auth-guard";

export const metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "BarChart3", exact: true },
  { href: "/admin/scholarships", label: "Scholarships", icon: "GraduationCap" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Defence in depth: middleware already blocks non-admins by token.
  await requireAdminPage();

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <div className="container grid gap-6 py-6 lg:grid-cols-[200px_1fr] lg:gap-10 lg:py-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 hidden px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:block">Admin</p>
          <AppNav items={NAV} label="Admin" />
        </aside>
        <main id="main" className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
