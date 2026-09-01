import { DEFAULT_TOOLS } from "./registry";
import type { ToolKey } from "./types";

const LOADER =
  "var d=document,s=d.createElement('script');s.src='HOST/check.js?t='+Date.now()SUFFIX;d.body.appendChild(s);";

function isDefaultSelection(tools: ToolKey[]): boolean {
  return (
    tools.length === DEFAULT_TOOLS.length &&
    DEFAULT_TOOLS.every((tool) => tools.includes(tool))
  );
}

export function loaderSnippet(host: string, tools: ToolKey[] = []): string {
  const suffix =
    tools.length === 0 || isDefaultSelection(tools) ? "" : `+'&tools=${tools.join(",")}'`;
  return LOADER.replace("HOST", host.replace(/\/+$/, "")).replace("SUFFIX", suffix);
}

export function bookmarkletHref(host: string, tools: ToolKey[] = []): string {
  return `javascript:(function(){${loaderSnippet(host, tools)}})();`;
}
