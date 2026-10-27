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
    title: "Resources",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#faq", label: "FAQ" },
      { href: "/scholarships?providerType=GOVERNMENT", label: "Government schemes" },
      { href: "/scholarships?providerType=INTERNATIONAL", label: "Study abroad" },
      { href: "/scholarships?deadlineWithin=14", label: "Closing soon" },
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
    <footer className="border-t">
      <div className="container grid gap-12 py-16 sm:grid-cols-2 md:grid-cols-[1.6fr_repeat(3,1fr)] md:py-20">
        <div className="max-w-xs space-y-4">
          <Logo />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Scholarships you actually qualify for — ranked by match, explained, and tracked to the deadline.
          </p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title} className="space-y-4">
            <h2 className="eyebrow">{col.title}</h2>
            <ul className="space-y-2.5">
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
        <div className="container flex flex-col gap-2 py-7 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ScholarSphere. Built for students.</p>
          <p>
            ScholarSphere is not affiliated with any scholarship provider. Always confirm details on the official website —{" "}
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
