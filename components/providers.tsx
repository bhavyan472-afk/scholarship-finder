"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <MotionConfig reducedMotion="user">
          {children}
          <Toaster
            position="bottom-right"
            closeButton
            toastOptions={{
              classNames: {
                toast: "!rounded-xl !border-border !bg-popover !text-popover-foreground !shadow-lift",
                description: "!text-muted-foreground",
              },
            }}
          />
        </MotionConfig>
      </ThemeProvider>
    </SessionProvider>
  );
}
