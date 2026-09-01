import { PROBED_GLOBALS } from "./registry";
import { emptySnapshot, type ScriptTag, type Snapshot } from "./types";

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

function datasetOf(script: HTMLScriptElement): Record<string, string> {
  const data: Record<string, string> = {};
  for (const [key, value] of Object.entries(script.dataset)) {
    if (typeof value === "string") data[key] = value;
  }
  return data;
}

function scriptTags(): ScriptTag[] {
  return [...document.querySelectorAll<HTMLScriptElement>("script[src]")].map(
    (script) => ({
      src: script.src,
      data: datasetOf(script),
    })
  );
}

function gtmContainerIds(): string[] {
  const registry = window.google_tag_manager;
  if (!registry) return [];
  return Object.keys(registry).filter((key) => key.startsWith("GTM-"));
}

function presentGlobals(): string[] {
  const scope = window as unknown as Record<string, unknown>;
  return PROBED_GLOBALS.filter((name) => scope[name] !== undefined);
}

function metaPixelQueue(): unknown[] {
  const fbq = window.fbq as unknown as { queue?: unknown[] } | undefined;
  if (!fbq?.queue) return [];
  return fbq.queue.map((entry) => (isArgumentsObject(entry) ? Array.from(entry) : entry));
}

export function readSnapshot(): Snapshot {
  if (typeof window === "undefined") return emptySnapshot();
  return {
    href: window.location.href,
    resources: requestedUrls(),
    scripts: scriptTags(),
    dataLayer: [...normaliseDataLayer(window.dataLayer), ...metaPixelQueue()],
    gtmContainers: gtmContainerIds(),
    globals: presentGlobals(),
  };
}
