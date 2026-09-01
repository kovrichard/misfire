import type { MetadataRoute } from "next";
import { cacheLife } from "next/cache";
import { siteUrl } from "@/lib/metadata";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("days");

  const lastModified = new Date();

  return [
    {
      url: `${siteUrl}/`,
      lastModified,
      changeFrequency: "yearly",
      priority: 1,
    },
  ];
}
