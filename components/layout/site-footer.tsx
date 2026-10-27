import Link from "next/link";
import { SITE } from "@/lib/site";
import { Logo } from "./logo";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/scholarships", label: "Browse scholarships" },
      { href: "/signup", label: "Create profile" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/dashboard/tracker", label: "Application tracker" },
    ],
  },
  {
    title: "Explore",
    links: [
      { href: "/scholarships?providerType=GOVERNMENT", label: "Government schemes" },
      { href: "/scholarships?providerType=PRIVATE", label: "Private & CSR" },
      { href: "/scholarships?providerType=INTERNATIONAL", label: "Study abroad" },
      { href: "/scholarships?deadlineWithin=14", label: "Closing soon" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#faq", label: "FAQ" },
      { href: `mailto:${SITE.contactEmail}`, label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/disclaimer", label: "Disclaimer" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="max-w-xs space-y-3">
          <Logo />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Find scholarships you actually qualify for, ranked by how well you match, with every deadline in one place.
          </p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title} className="space-y-3">
            <h2 className="text-sm font-semibold">{col.title}</h2>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t">
        <div className="container flex flex-col gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ScholarSphere. Built for students.</p>
          <p>
            Not affiliated with any scholarship provider. Always confirm details on the official website —{" "}
            <Link href="/disclaimer" className="underline underline-offset-2 hover:text-foreground">
              disclaimer
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
