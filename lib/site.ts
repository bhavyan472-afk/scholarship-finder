// Site-wide constants for SEO, legal pages and emails.

/**
 * Canonical origin: NEXT_PUBLIC_SITE_URL (or the older NEXT_PUBLIC_APP_URL), else Vercel's production
 * domain, else this deployment's URL. On Vercel a localhost value is ignored, so a copied local .env
 * can never make canonical/og:url point at localhost.
 */
function resolveSiteUrl(): string {
  const onVercel = Boolean(process.env.VERCEL);
  const configured = [process.env.NEXT_PUBLIC_SITE_URL, process.env.NEXT_PUBLIC_APP_URL]
    .map((v) => v?.trim().replace(/\/+$/, ""))
    .find((v) => v && !(onVercel && /localhost|127\.0\.0\.1/.test(v)));
  if (configured) return configured;
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return vercelHost ? `https://${vercelHost}` : "http://localhost:3000";
}

export const SITE = {
  name: "ScholarSphere",
  url: resolveSiteUrl(),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@scholarsphere.app",
  /** Shown on legal pages as the operator of the service. */
  operator: "ScholarSphere",
  jurisdiction: "India",
  legalUpdated: "27 October 2026",
} as const;

/** Only the production deployment is indexed; previews and local builds are noindex. */
export const isIndexable = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : process.env.NODE_ENV === "production";
