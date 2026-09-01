"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { BookmarkletLink } from "@/components/checker/bookmarklet-link";
import { CopySnippet } from "@/components/checker/copy-snippet";
import { Toggle } from "@/components/ui/toggle";
import { bookmarkletHref, loaderSnippet } from "@/lib/checker/bookmarklet";
import { TOOL_CARDS } from "@/lib/checker/catalog";
import { DEFAULT_TOOLS, TOOL_KEYS, TOOL_NAMES } from "@/lib/checker/registry";
import type { ToolKey } from "@/lib/checker/types";
import { cn } from "@/lib/utils";

const CARD =
  "relative flex h-auto min-w-0 select-none flex-col items-start gap-[6px] whitespace-normal rounded-[calc(var(--radius-lg)*1.15)] border-2 bg-surface px-[16px] py-[14px] text-left hover:bg-surface data-[state=on]:bg-surface";

function sentence(names: string[]): string {
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

function StepHeading({ step, label }: Readonly<{ step: string; label: string }>) {
  return (
    <div className="flex items-baseline gap-[var(--space-2)]">
      <span className="font-heading text-[22px] text-brand">{step}</span>
      <h6 className="mb-[var(--space-2)] text-[13px] text-brand-700 uppercase tracking-[0.08em]">
        {label}
      </h6>
    </div>
  );
}

export function InstallFlow({
  host,
  children,
}: Readonly<{ host: string; children: ReactNode }>) {
  const [picked, setPicked] = useState<ToolKey[]>(DEFAULT_TOOLS);

  const toggle = (key: ToolKey) => {
    setPicked((current) => {
      const next = current.includes(key)
        ? current.filter((entry) => entry !== key)
        : [...current, key];
      return next.length === 0 ? current : next;
    });
  };

  const ordered = useMemo(
    () => TOOL_KEYS.filter((key) => picked.includes(key)),
    [picked]
  );
  const label = sentence(ordered.map((key) => TOOL_NAMES[key]));

  return (
    <>
      <section className="mt-[clamp(40px,7vw,60px)]">
        <StepHeading step="1" label="Pick your tools" />
        <p className="mb-[var(--space-4)] text-pretty text-[15px] text-neutral-800">
          Tick what Misfire should check. The bookmarklet you install in step 2 is built
          from this selection. Unticked tools are still listed when found on the page,
          just not checked in depth.
        </p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-[var(--space-2)]">
          {TOOL_CARDS.map((card) => {
            const on = picked.includes(card.key);
            return (
              <Toggle
                key={card.key}
                pressed={on}
                onPressedChange={() => toggle(card.key)}
                aria-label={`Check ${card.name}`}
                className={cn(CARD, on ? "border-brand" : "border-divider")}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-[13px] right-[13px] inline-flex size-[20px] items-center justify-center rounded-full border-2 text-[11px] text-canvas",
                    on ? "border-brand bg-brand" : "border-neutral-400 bg-transparent"
                  )}
                >
                  {on ? "✓" : ""}
                </span>
                <span className="pr-[26px] text-[11px] text-brand uppercase tracking-[0.1em]">
                  {card.kicker}
                </span>
                <span className="font-heading text-[16px] leading-[1.2]">
                  {card.name}
                </span>
                <ul className="flex list-none flex-col gap-[4px] p-0 text-[12.5px] text-neutral-800 leading-[1.45]">
                  {card.items.map((item) => (
                    <li key={item} className="flex gap-[7px]">
                      <span className="shrink-0 font-bold text-brand">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Toggle>
            );
          })}
        </div>
        <p className="mt-[var(--space-4)] text-pretty text-[14.5px] text-neutral-700 leading-[1.65]">
          The consent platform (OneTrust, Cookiebot, Osano, CookieYes or a bare TCF
          framework) is always detected, so a tag that loaded but sent nothing names what
          is holding it instead of shrugging at you.
        </p>
      </section>

      <section className="mt-[clamp(40px,7vw,60px)]">
        <StepHeading step="2" label="Install" />
        <p className="mb-[var(--space-3)] text-pretty text-[15px] text-neutral-800">
          Your bookmarklet, checking <strong>{label}</strong>. Drag it to your bookmarks
          bar, then click it on any page you want to check. Change your picks later? Come
          back and drag it again.
        </p>
        <BookmarkletLink
          href={bookmarkletHref(host, ordered)}
          fallbackHref="/demo"
          label="✓  Misfire"
        />

        <p className="mt-[var(--space-6)] mb-[var(--space-2)] text-[15px] text-neutral-800">
          Prefer the console? Same loader, same selection:
        </p>
        <CopySnippet code={loaderSnippet(host, ordered)} />

        {children}
      </section>
    </>
  );
}
