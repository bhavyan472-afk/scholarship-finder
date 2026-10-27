import type { MetadataRoute } from "next";
import { isIndexable } from "@/lib/site";
import { absoluteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  // Keep preview deployments out of search results.
  if (!isIndexable) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard", "/admin", "/onboarding"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
