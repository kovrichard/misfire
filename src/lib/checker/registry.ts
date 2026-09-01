import { configuredIds } from "./datalayer";
import type { ScriptTag, ToolKey } from "./types";

export const TOOL_KEYS: ToolKey[] = [
  "gtm",
  "ga4",
  "clarity",
  "plausible",
  "posthog",
  "vercel",
  "datafast",
  "umami",
  "googleads",
  "linkedin",
  "cloudflare",
  "quora",
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
  datafast: "DataFast",
  umami: "Umami",
  googleads: "Google Ads",
  linkedin: "LinkedIn Insight",
  cloudflare: "Cloudflare Web Analytics",
  quora: "Quora Pixel",
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
  "umami",
  "_linkedin_data_partner_id",
  "__cfBeacon",
  "qp",
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
  exclude?: RegExp;
  beacon?: RegExp;
  global?: string;
  idFromUrl?: RegExp;
  idFromData?: string;
  idTransform?: (raw: string) => string | null;
  idFromDataLayer?: (dataLayer: unknown[]) => string[];
  idFromBeacon?: string;
  idFromResource?: RegExp;
  eventParam?: string;
  baseEvent?: string;
  debugTag?: RegExp;
  unit: string;
}

function cloudflareToken(raw: string): string | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const token = (parsed as { token?: unknown }).token;
    return typeof token === "string" && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

function googleAdsIds(dataLayer: unknown[]): string[] {
  return configuredIds(dataLayer, "AW-");
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
    exclude: /datafa\.st/i,
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
    debugTag: /script\.debug\.js/i,
    unit: "event",
  },
  {
    key: "datafast",
    name: "DataFast",
    tag: /datafa\.st\/js\/script[a-z.]*\.js/i,
    beacon: /datafa\.st\/api\/events/i,
    global: "datafast",
    idFromData: "websiteId",
    unit: "event",
  },
  {
    key: "umami",
    name: "Umami",
    tag: /umami\.is\/script\.js|\/umami\.js(\?|$)/i,
    beacon: /umami\.is\/api\/send|\/api\/send(\?|$)/i,
    global: "umami",
    idFromData: "websiteId",
    unit: "event",
  },
  {
    key: "googleads",
    name: "Google Ads",
    tag: /googletagmanager\.com\/gtag\/js\?[^\s"']*?\bid=AW-[A-Z0-9]+/i,
    beacon: /(googleadservices\.com|googleads\.g\.doubleclick\.net)\/pagead\//i,
    idFromUrl: /[?&]id=(AW-[A-Z0-9]+)/i,
    idFromDataLayer: googleAdsIds,
    unit: "conversion",
  },
  {
    key: "linkedin",
    name: "LinkedIn Insight",
    tag: /snap\.licdn\.com\/li\.lms-analytics\/insight[a-z.]*\.js/i,
    beacon: /px\.ads\.linkedin\.com\/(collect|attribution_trigger)/i,
    global: "_linkedin_data_partner_id",
    idFromBeacon: "pid",
    unit: "hit",
  },
  {
    key: "cloudflare",
    name: "Cloudflare Web Analytics",
    tag: /static\.cloudflareinsights\.com\/beacon[a-z.]*\.js/i,
    beacon: /\/cdn-cgi\/rum(\?|$)/i,
    global: "__cfBeacon",
    idFromData: "cfBeacon",
    idTransform: cloudflareToken,
    unit: "beacon",
  },
  {
    key: "quora",
    name: "Quora Pixel",
    tag: /a\.quora\.com\/qevents\.js/i,
    beacon: /q\.quora\.com\/_\/ad\/[a-f0-9]+\/pixel/i,
    global: "qp",
    idFromResource: /q\.quora\.com\/_\/ad\/([a-f0-9]+)\/pixel/i,
    eventParam: "tag",
    baseEvent: "ViewContent",
    unit: "hit",
  },
  {
    key: "meta",
    name: "Meta Pixel",
    tag: /connect\.facebook\.net\/[^/]+\/fbevents\.js/i,
    beacon: /facebook\.com\/tr\b/i,
    global: "fbq",
    idFromDataLayer: metaPixelIds,
    idFromResource: /connect\.facebook\.net\/signals\/config\/(\d+)/i,
    eventParam: "ev",
    baseEvent: "PageView",
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

export function matchesTag(spec: ToolSpec, url: string): boolean {
  if (!spec.tag.test(url)) return false;
  return !spec.exclude?.test(url);
}

export function idsFromScripts(scripts: ScriptTag[], spec: ToolSpec): string[] {
  const matched = scripts.filter((script) => matchesTag(spec, script.src));
  const key = spec.idFromData;
  if (key) {
    const transform = spec.idTransform;
    return matched
      .map((script) => script.data[key])
      .filter((raw): raw is string => typeof raw === "string" && raw.length > 0)
      .map((raw) => (transform ? transform(raw) : raw))
      .filter((id): id is string => id !== null && id.length > 0);
  }
  return [];
}
