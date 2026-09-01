import type { Finding, Level, Report, ToolReport } from "./types";

const PANEL_HOST_ID = "misfire-panel";

const GLYPH: Record<Level, string> = { ok: "✓", warn: "!", error: "✕" };

const STYLE = `
:host { all: initial; }
.card {
  position: fixed; right: 16px; bottom: 16px; width: 360px; max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px); overflow: auto; z-index: 2147483647;
  background: #0d1117; color: #e6edf3; border: 1px solid #30363d; border-radius: 10px;
  box-shadow: 0 12px 40px rgba(0,0,0,.5); font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
}
header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid #30363d; }
.brand { font-weight: 600; letter-spacing: .02em; margin-right: auto; }
button {
  all: unset; cursor: pointer; padding: 2px 8px; border-radius: 5px; font-size: 11px;
  color: #8b949e; border: 1px solid #30363d;
}
button:hover { color: #e6edf3; border-color: #8b949e; }
.url { padding: 8px 12px; color: #8b949e; font-size: 11px; word-break: break-all; border-bottom: 1px solid #21262d; }
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

function renderBody(report: Report): DocumentFragment {
  const fragment = document.createDocumentFragment();
  fragment.append(el("div", "url", report.href));
  for (const tool of report.tools) fragment.append(renderTool(tool));
  if (report.consent.length > 0) {
    const section = el("div", "section");
    for (const finding of report.consent) section.append(renderFinding(finding));
    fragment.append(section);
  }
  return fragment;
}

export interface Panel {
  update(report: Report): void;
}

export function mountPanel(): Panel {
  document.getElementById(PANEL_HOST_ID)?.remove();

  const host = el("div");
  host.id = PANEL_HOST_ID;
  const root = host.attachShadow({ mode: "open" });

  const style = el("style");
  style.textContent = STYLE;

  const card = el("div", "card");
  const header = el("header");
  const close = el("button", undefined, "✕");
  header.append(el("span", "brand", "Misfire"), close);

  const body = el("div");
  card.append(header, body);
  root.append(style, card);
  document.body.append(host);

  close.addEventListener("click", () => host.remove());

  return {
    update(report: Report): void {
      body.replaceChildren(renderBody(report));
    },
  };
}
