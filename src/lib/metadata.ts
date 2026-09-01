import type { Metadata } from "next";
import conf from "@/lib/config";

export const robotsPolicy: Metadata["robots"] = conf.isProductionEnvironment
  ? "index, follow"
  : "noindex, nofollow";

export const metaTitle = "analytics-check: verify your GA4, GTM and Clarity install";
export const metaDescription =
  "A bookmarklet that runs inside your page and reports whether Google Analytics, Tag Manager and Clarity are really installed, and really sending data.";
export const siteUrl = "https://analytics-check.konvert7.com";

export const openGraph: Metadata["openGraph"] = {
  title: metaTitle,
  description: metaDescription,
  type: "website",
  siteName: "analytics-check",
  locale: "en_US",
  images: [
    {
      url: "/opengraph-image.png",
      width: 1200,
      height: 630,
    },
  ],
};

export const twitter: Metadata["twitter"] = {
  title: metaTitle,
  description: metaDescription,
  card: "summary_large_image",
  images: [
    {
      url: "/twitter-image.png",
      width: 1200,
      height: 630,
    },
  ],
};
