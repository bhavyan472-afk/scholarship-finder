import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ScholarSphere – Smart Scholarship Finder",
    short_name: SITE.name,
    description: "Scholarships you actually qualify for, ranked by match and tracked to the deadline.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfcfe",
    theme_color: "#283593",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
