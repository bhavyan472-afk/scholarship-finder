"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
      // Ring on keyboard focus only (focus-visible); mouse/touch clicks leave no ring behind.
      className="relative rounded-full focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Sun className="rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
