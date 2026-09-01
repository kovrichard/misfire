import type { ScriptTag, ToolKey } from "./types";

export const TOOL_KEYS: ToolKey[] = [
  "gtm",
  "ga4",
  "clarity",
  "plausible",
  "posthog",
  "vercel",
  "meta",
  "hotjar",
];

export const DEFAULT_TOOLS: ToolKey[] = ["gtm", "ga4", "clarity"];

export const TOOL_NAMES: Record<ToolKey, string> = {
  gtm: "GTM",
  ga4: "GA4",
  clarity: "Clarity",
  plausible: "Plausible",
  posthog: "PostHog",
  vercel: "Vercel Analytics",
  meta: "Meta Pixel",
  hotjar: "Hotjar",
};

export const PROBED_GLOBALS = [
  "gtag",
  "clarity",
  "google_tag_manager",
  "plausible",
  "posthog",
  "va",
  "fbq",
  "hj",
  "_hjSettings",
  "fathom",
  "datafast",
  "OneTrust",
  "OptanonActiveGroups",
  "Cookiebot",
  "Osano",
  "cookieyes",
  "__tcfapi",
];

export interface ToolSpec {
  key: ToolKey;
  name: string;
  tag: RegExp;
  beacon?: RegExp;
  global?: string;
  idFromUrl?: RegExp;
  idFromData?: string;
  idFromDataLayer?: (dataLayer: unknown[]) => string[];
  unit: string;
}

function metaPixelIds(dataLayer: unknown[]): string[] {
  return dataLayer
    .filter((entry): entry is unknown[] => Array.isArray(entry) && entry[0] === "init")
    .map((entry) => entry[1])
    .filter((id): id is string => typeof id === "string");
}

export const TOOL_SPECS: ToolSpec[] = [
  {
    key: "plausible",
    name: "Plausible",
    tag: /plausible\.io\/js\/script[a-z.]*\.js|\/js\/(plausible|script)[a-z.]*\.js/i,
    beacon: /\/api\/event\b/i,
    global: "plausible",
    idFromData: "domain",
    unit: "event",
  },
  {
    key: "posthog",
    name: "PostHog",
    tag: /\/static\/array(\.full)?\.js/i,
    beacon: /\/(e|i\/v0\/e)\/?(\?|$)/i,
    global: "posthog",
    unit: "event",
  },
  {
    key: "vercel",
    name: "Vercel Analytics",
    tag: /\/_vercel\/insights\/script\.js|va\.vercel-scripts\.com\/v\d+\/script/i,
    beacon: /\/_vercel\/insights\/(view|event)|\/va\/(view|event)/i,
    global: "va",
    unit: "event",
  },
  {
    key: "meta",
    name: "Meta Pixel",
    tag: /connect\.facebook\.net\/[^/]+\/fbevents\.js/i,
    beacon: /facebook\.com\/tr\b/i,
    global: "fbq",
    idFromDataLayer: metaPixelIds,
    unit: "hit",
  },
  {
    key: "hotjar",
    name: "Hotjar",
    tag: /static\.hotjar\.com\/c\/hotjar-([a-z0-9]+)\.js/i,
    beacon: /(metrics|t\.cs)\.hotjar\.io|insights\.hotjar\.com/i,
    global: "hj",
    idFromUrl: /hotjar-([a-z0-9]+)\.js/i,
    unit: "upload",
  },
];

export interface CmpSpec {
  name: string;
  tag: RegExp;
  global: string;
}

export const CMP_SPECS: CmpSpec[] = [
  { name: "OneTrust", tag: /cdn\.cookielaw\.org/i, global: "OneTrust" },
  { name: "Cookiebot", tag: /consent\.cookiebot\.com/i, global: "Cookiebot" },
  { name: "Osano", tag: /cmp\.osano\.com/i, global: "Osano" },
  { name: "CookieYes", tag: /cdn-cookieyes\.com/i, global: "cookieyes" },
];

export function idsFromScripts(scripts: ScriptTag[], spec: ToolSpec): string[] {
  const matched = scripts.filter((script) => spec.tag.test(script.src));
  if (spec.idFromData) {
    return matched
      .map((script) => spec.idFromData && script.data[spec.idFromData])
      .filter((id): id is string => typeof id === "string" && id.length > 0);
  }
  return [];
}
