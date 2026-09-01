import type { ToolKey } from "./types";

export interface ToolCard {
  key: ToolKey;
  kicker: string;
  name: string;
  items: string[];
}

export const TOOL_CARDS: ToolCard[] = [
  {
    key: "gtm",
    kicker: "Containers",
    name: "Google Tag Manager",
    items: [
      "Container ID from the gtm.js request",
      "Loaded but never initialised",
      "More than one container",
    ],
  },
  {
    key: "ga4",
    kicker: "Measurement",
    name: "Google Analytics 4",
    items: [
      "Measurement ID from the tag and the beacon",
      "One property measured twice, doubling sessions",
      "Tag present but no hit ever sent",
    ],
  },
  {
    key: "clarity",
    kicker: "Recording",
    name: "Microsoft Clarity",
    items: [
      "Project ID from the tag request",
      "Loaded but window.clarity never booted",
      "Recording but uploading nothing",
    ],
  },
  {
    key: "plausible",
    kicker: "Measurement",
    name: "Plausible",
    items: [
      "Domain from the script tag",
      "Script loaded but no event sent",
      "Proxied installs recognised",
    ],
  },
  {
    key: "posthog",
    kicker: "Product analytics",
    name: "PostHog",
    items: [
      "Loaded but never initialised",
      "Capture calls that never leave",
      "Self-hosted and proxied installs",
    ],
  },
  {
    key: "vercel",
    kicker: "Measurement",
    name: "Vercel Analytics",
    items: [
      "Detected on the same-origin insights path",
      "Loaded but no view recorded",
      "Debug builds flagged",
    ],
  },
  {
    key: "datafast",
    kicker: "Measurement",
    name: "Datafast",
    items: [
      "Website ID from the script tag",
      "Loaded but window.datafast never booted",
      "Present but no event sent",
    ],
  },
  {
    key: "umami",
    kicker: "Measurement",
    name: "Umami",
    items: [
      "Website ID from the script tag",
      "Loaded but window.umami never booted",
      "Self-hosted installs recognised",
    ],
  },
  {
    key: "googleads",
    kicker: "Advertising",
    name: "Google Ads",
    items: [
      "Conversion ID from the gtag request",
      "The same ID configured twice",
      "Loaded but no conversion sent",
    ],
  },
  {
    key: "linkedin",
    kicker: "Advertising",
    name: "LinkedIn Insight",
    items: [
      "Partner ID from the collect beacon",
      "Loaded but no partner ID configured",
      "Error pings not counted as success",
    ],
  },
  {
    key: "meta",
    kicker: "Advertising",
    name: "Meta Pixel",
    items: [
      "Pixel ID from the fbevents call",
      "PageView fired or missing",
      "Duplicate pixel IDs",
    ],
  },
  {
    key: "hotjar",
    kicker: "Recording",
    name: "Hotjar",
    items: [
      "Site ID from the tag request",
      "Loaded but never booted",
      "Recording but uploading nothing",
    ],
  },
];
