"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/scholarships", label: "Scholarships" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#faq", label: "FAQ" },
    ...(session?.user ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    ...(session?.user?.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-[background-color,border-color,backdrop-filter] duration-500",
        scrolled || open ? "border-border/70 bg-background/75 backdrop-blur-xl backdrop-saturate-150" : "border-transparent bg-transparent",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <div className="container flex h-[68px] items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active = l.href !== "/" && !l.href.includes("#") && pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                    active && "text-foreground",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <UserMenu />
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-nav"
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t md:hidden"
          >
            <div className="container grid gap-1 py-3">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted">
                  {l.label}
                </Link>
              ))}
              {!session?.user && (
                <Link href="/login" className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted">
                  Log in
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
