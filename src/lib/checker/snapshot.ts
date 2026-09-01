import { emptySnapshot, type Snapshot } from "./types";

function isArgumentsObject(value: unknown): value is ArrayLike<unknown> {
  return Object.prototype.toString.call(value) === "[object Arguments]";
}

function normaliseDataLayer(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => (isArgumentsObject(entry) ? Array.from(entry) : entry));
}

function requestedUrls(): string[] {
  return performance
    .getEntriesByType("resource")
    .map((entry) => entry.name)
    .filter((name) => typeof name === "string");
}

function scriptSources(): string[] {
  return [...document.querySelectorAll<HTMLScriptElement>("script[src]")].map(
    (script) => script.src
  );
}

function gtmContainerIds(): string[] {
  const registry = window.google_tag_manager;
  if (!registry) return [];
  return Object.keys(registry).filter((key) => key.startsWith("GTM-"));
}

export function readSnapshot(): Snapshot {
  if (typeof window === "undefined") return emptySnapshot();
  return {
    href: window.location.href,
    resources: requestedUrls(),
    scriptSrcs: scriptSources(),
    dataLayer: normaliseDataLayer(window.dataLayer),
    gtmContainers: gtmContainerIds(),
    hasGtag: typeof window.gtag === "function",
    hasClarity: typeof window.clarity === "function",
  };
}
