import { analyze } from "./detect";
import { mountPanel } from "./panel";
import { TOOL_KEYS } from "./registry";
import { readSnapshot } from "./snapshot";
import type { ToolKey } from "./types";

const WATCH_MS = 20000;
const POLL_MS = 1000;

function selectedTools(): ToolKey[] {
  const script = document.currentScript as HTMLScriptElement | null;
  if (!script?.src) return [];
  try {
    const raw = new URL(script.src).searchParams.get("tools");
    if (!raw) return [];
    const known = new Set<string>(TOOL_KEYS);
    return raw.split(",").filter((key): key is ToolKey => known.has(key));
  } catch {
    return [];
  }
}

function start(): void {
  const tools = selectedTools();
  const panel = mountPanel();
  const render = () => {
    panel.update(analyze(readSnapshot(), tools));
  };

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      render();
    });
  };

  render();

  const observer = new PerformanceObserver(schedule);
  observer.observe({ type: "resource", buffered: false });
  const poll = setInterval(schedule, POLL_MS);

  setTimeout(() => {
    observer.disconnect();
    clearInterval(poll);
  }, WATCH_MS);
}

start();
