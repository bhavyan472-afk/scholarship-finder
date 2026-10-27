import { AppNav, type NavItem } from "@/components/layout/app-nav";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "LayoutDashboard", exact: true },
  { href: "/dashboard/matches", label: "Matches", icon: "Sparkles" },
  { href: "/dashboard/tracker", label: "Tracker", icon: "KanbanSquare" },
  { href: "/dashboard/profile", label: "Profile", icon: "UserRound" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <div className="container grid gap-6 py-6 lg:grid-cols-[200px_1fr] lg:gap-10 lg:py-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <AppNav items={NAV} label="Dashboard" />
        </aside>
        <main id="main" className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
