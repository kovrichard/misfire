import type { Finding, Level, Report, ToolReport } from "./types";

const PANEL_HOST_ID = "misfire-panel";

const GLYPH: Record<Level, string> = { ok: "✓", warn: "!", error: "✕" };

const CORNERS = [
  ["top-left", "Top left"],
  ["top-right", "Top right"],
  ["bottom-left", "Bottom left"],
  ["bottom-right", "Bottom right"],
] as const;

const DEFAULT_CORNER = "bottom-right";
const INSET = 16;
const SNAP_MS = 180;

type Corner = (typeof CORNERS)[number][0];

function occupiedCorner(rect: DOMRect): Corner {
  const vertical = rect.top + rect.height / 2 < window.innerHeight / 2 ? "top" : "bottom";
  const horizontal =
    rect.left + rect.width / 2 < window.innerWidth / 2 ? "left" : "right";
  return `${vertical}-${horizontal}` as Corner;
}

function cornerOffset(corner: Corner, width: number, height: number) {
  return {
    left: corner.endsWith("left") ? INSET : window.innerWidth - width - INSET,
    top: corner.startsWith("top") ? INSET : window.innerHeight - height - INSET,
  };
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const STYLE = `
:host { all: initial; }
.card {
  position: fixed; width: 360px; max-width: calc(100vw - 32px);
  max-height: 60vh; overflow: hidden; z-index: 2147483647;
  display: flex; flex-direction: column;
  background: #0d1117; color: #e6edf3; border: 1px solid #30363d; border-radius: 10px;
  box-shadow: 0 12px 40px rgba(0,0,0,.5); font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
}
header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid #30363d; flex: none; cursor: grab; user-select: none; touch-action: none; }
header:active { cursor: grabbing; }
.brand { font-weight: 600; letter-spacing: .02em; margin-right: auto; }
button {
  all: unset; cursor: pointer; padding: 2px 8px; border-radius: 5px; font-size: 11px;
  color: #8b949e; border: 1px solid #30363d;
}
button:hover { color: #e6edf3; border-color: #8b949e; }
.card[data-corner="top-left"] { top: 16px; left: 16px; }
.card[data-corner="top-right"] { top: 16px; right: 16px; }
.card[data-corner="bottom-left"] { bottom: 16px; left: 16px; }
.card[data-corner="bottom-right"] { bottom: 16px; right: 16px; }
.card.floating { right: auto; bottom: auto; }
.card.snapping { transition: left .18s cubic-bezier(.22,1,.36,1), top .18s cubic-bezier(.22,1,.36,1); }
.menu {
  position: absolute; top: 40px; right: 10px; z-index: 2; min-width: 156px;
  display: flex; flex-direction: column; gap: 6px;
  padding: 10px; border-radius: 8px;
  background: #161b22; border: 1px solid #30363d;
  box-shadow: 0 8px 24px rgba(0,0,0,.6);
}
.menu[hidden] { display: none; }
.menu label { color: #8b949e; font-size: 11px; }
.menu select {
  width: 100%; cursor: pointer; padding: 4px 6px; border-radius: 5px;
  font: inherit; font-size: 12px; color: #e6edf3;
  background: #0d1117; border: 1px solid #30363d;
}
.url { padding: 8px 12px; color: #8b949e; font-size: 11px; word-break: break-all; border-bottom: 1px solid #21262d; flex: none; }
.scroll { flex: 1 1 auto; overflow-y: auto; min-height: 0; overscroll-behavior: contain; }
.tool { padding: 10px 12px; border-bottom: 1px solid #21262d; }
.tool-head { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.name { font-weight: 600; min-width: 58px; flex: none; }
.ids { color: #58a6ff; word-break: break-all; flex: 1; }
.hits { color: #8b949e; font-size: 11px; white-space: nowrap; }
.finding { display: flex; gap: 8px; margin-top: 6px; }
.mark { font-weight: 700; width: 12px; flex: none; }
.finding-title { font-weight: 600; }
.detail { color: #8b949e; margin-top: 1px; }
.ok .mark, .ok .finding-title { color: #3fb950; }
.warn .mark, .warn .finding-title { color: #d29922; }
.error .mark, .error .finding-title { color: #f85149; }
.section { padding: 10px 12px; }
.unknown { padding: 10px 12px; border-top: 1px solid #30363d; }
.unknown-title { font-weight: 600; color: #d29922; }
.unknown-row { display: flex; gap: 8px; margin-top: 6px; color: #8b949e; }
.unknown-host { flex: 1; color: #e6edf3; word-break: break-all; }
.empty { color: #8b949e; padding: 10px 12px; }
`;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderFinding(finding: Finding): HTMLElement {
  const row = el("div", `finding ${finding.level}`);
  row.append(el("span", "mark", GLYPH[finding.level]));
  const body = el("div");
  body.append(el("div", "finding-title", finding.title));
  body.append(el("div", "detail", finding.detail));
  row.append(body);
  return row;
}

function hitLabel(tool: ToolReport): string {
  if (!tool.unit) return "";
  return tool.hits === 1 ? `1 ${tool.unit}` : `${tool.hits} ${tool.unit}s`;
}

function renderTool(tool: ToolReport): HTMLElement {
  const block = el("div", "tool");
  const head = el("div", "tool-head");
  head.append(el("span", "name", tool.tool));
  head.append(el("span", "ids", tool.ids.join(", ") || "—"));
  const hits = hitLabel(tool);
  if (hits) head.append(el("span", "hits", hits));
  block.append(head);
  for (const finding of tool.findings) block.append(renderFinding(finding));
  return block;
}

function renderUnknown(hosts: Report["unknownBeacons"]): HTMLElement {
  const block = el("div", "unknown");
  const label =
    hosts.length === 1 ? "1 unrecognised beacon" : `${hosts.length} unrecognised beacons`;
  block.append(el("div", "unknown-title", label));
  block.append(
    el(
      "div",
      "detail",
      "Sent with navigator.sendBeacon by something Misfire does not know."
    )
  );
  for (const { host, count } of hosts) {
    const row = el("div", "unknown-row");
    row.append(el("span", "unknown-host", host));
    row.append(el("span", undefined, count === 1 ? "1 beacon" : `${count} beacons`));
    block.append(row);
  }
  return block;
}

function renderBody(report: Report): DocumentFragment {
  const fragment = document.createDocumentFragment();
  for (const tool of report.tools) fragment.append(renderTool(tool));
  if (report.consent.length > 0) {
    const section = el("div", "section");
    for (const finding of report.consent) section.append(renderFinding(finding));
    fragment.append(section);
  }
  if (report.unknownBeacons.length > 0) {
    fragment.append(renderUnknown(report.unknownBeacons));
  }
  return fragment;
}

export interface Panel {
  update(report: Report): void;
}

export function mountPanel(onClose: () => void): Panel {
  document.getElementById(PANEL_HOST_ID)?.remove();

  const host = el("div");
  host.id = PANEL_HOST_ID;
  const root = host.attachShadow({ mode: "open" });

  const style = el("style");
  style.textContent = STYLE;

  const card = el("div", "card");
  card.dataset.corner = DEFAULT_CORNER;

  const header = el("header");
  const gear = el("button", undefined, "⚙");
  gear.title = "Settings";
  const close = el("button", undefined, "✕");
  close.title = "Close";
  header.append(el("span", "brand", "Misfire"), gear, close);

  const menu = el("div", "menu");
  menu.hidden = true;
  const picker = el("select");
  picker.setAttribute("aria-label", "Panel position");
  for (const [value, label] of CORNERS) {
    const option = el("option", undefined, label);
    option.value = value;
    picker.append(option);
  }
  picker.value = DEFAULT_CORNER;
  menu.append(el("label", undefined, "Position"), picker);

  const url = el("div", "url");
  const body = el("div", "scroll");
  card.append(header, menu, url, body);
  root.append(style, card);
  document.body.append(host);

  close.addEventListener("click", () => {
    host.remove();
    onClose();
  });

  gear.addEventListener("click", () => {
    menu.hidden = !menu.hidden;
  });

  const settle = (corner: Corner) => {
    card.classList.remove("floating", "snapping");
    card.style.left = "";
    card.style.top = "";
    card.dataset.corner = corner;
    picker.value = corner;
  };

  const snapTo = (corner: Corner) => {
    if (prefersReducedMotion()) {
      settle(corner);
      return;
    }
    const rect = card.getBoundingClientRect();
    const target = cornerOffset(corner, rect.width, rect.height);
    card.classList.add("snapping");
    card.style.left = `${target.left}px`;
    card.style.top = `${target.top}px`;
    setTimeout(() => settle(corner), SNAP_MS);
  };

  picker.addEventListener("change", () => {
    settle(picker.value as Corner);
    menu.hidden = true;
  });

  let grab: { dx: number; dy: number } | null = null;

  header.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Element && event.target.closest("button")) return;
    const rect = card.getBoundingClientRect();
    grab = { dx: event.clientX - rect.left, dy: event.clientY - rect.top };
    card.classList.remove("snapping");
    card.classList.add("floating");
    card.style.left = `${rect.left}px`;
    card.style.top = `${rect.top}px`;
    header.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  header.addEventListener("pointermove", (event) => {
    if (!grab) return;
    card.style.left = `${event.clientX - grab.dx}px`;
    card.style.top = `${event.clientY - grab.dy}px`;
  });

  const release = () => {
    if (!grab) return;
    grab = null;
    snapTo(occupiedCorner(card.getBoundingClientRect()));
  };

  header.addEventListener("pointerup", release);
  header.addEventListener("pointercancel", release);

  let rendered = "";

  return {
    update(report: Report): void {
      const next = JSON.stringify(report);
      if (next === rendered) return;
      rendered = next;
      url.textContent = report.href;
      body.replaceChildren(renderBody(report));
    },
  };
}
