import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/utils";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const scholarships = await prisma.scholarship.findMany({
    where: { isActive: true, deadline: { gte: new Date() } },
    select: { slug: true, updatedAt: true },
  });
  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/scholarships"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/signup"), changeFrequency: "monthly", priority: 0.5 },
    ...["/privacy", "/terms", "/disclaimer"].map((p) => ({
      url: absoluteUrl(p),
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
    ...scholarships.map((s) => ({
      url: absoluteUrl(`/scholarships/${s.slug}`),
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
