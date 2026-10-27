// Site-wide constants for SEO, legal pages and emails.

const vercelProductionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE = {
  name: "ScholarSphere",
  /** Canonical origin. Set NEXT_PUBLIC_APP_URL in production; falls back to Vercel's production domain. */
  url: process.env.NEXT_PUBLIC_APP_URL || (vercelProductionHost ? `https://${vercelProductionHost}` : "http://localhost:3000"),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@scholarsphere.app",
  /** Shown on legal pages as the operator of the service. */
  operator: "ScholarSphere",
  jurisdiction: "India",
  legalUpdated: "27 October 2026",
} as const;

/** Only the production deployment is indexed; previews and local builds are noindex. */
export const isIndexable = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : process.env.NODE_ENV === "production";
