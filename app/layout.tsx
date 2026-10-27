import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "@/components/providers";
import { isIndexable, SITE } from "@/lib/site";
import "./globals.css";

const description =
  "Build your student profile once and get matched with government, private and international scholarships you're eligible for — ranked, explained and tracked to the deadline.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  applicationName: SITE.name,
  title: {
    default: "ScholarSphere – Smart Scholarship Finder",
    template: "%s · ScholarSphere",
  },
  description,
  keywords: ["scholarships India", "NSP scholarship", "scholarship finder", "study abroad scholarships", "post matric scholarship"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE.name,
    title: "ScholarSphere – Smart Scholarship Finder",
    description: "Scholarships you actually qualify for, ranked by match and tracked to the deadline.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "ScholarSphere – Smart Scholarship Finder",
    description: "Scholarships you actually qualify for, ranked by match and tracked to the deadline.",
  },
  robots: isIndexable
    ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } }
    : { index: false, follow: false },
  formatDetection: { telephone: false, address: false, email: false },
  category: "education",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfcfe" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0d1a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
