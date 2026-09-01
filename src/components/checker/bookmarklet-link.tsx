"use client";

import { useEffect, useRef } from "react";

const BUTTON =
  "inline-flex items-center justify-center gap-[6px] rounded-full bg-brand px-[28px] py-[12px] font-heading text-[16px] text-canvas leading-[1.2] no-underline";

export function BookmarkletLink({
  href,
  fallbackHref,
  label,
}: Readonly<{ href: string; fallbackHref: string; label: string }>) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    ref.current?.setAttribute("href", href);
  }, [href]);

  return (
    <div className="relative inline-block">
      <a
        ref={ref}
        href={fallbackHref}
        draggable
        title="Drag me to your bookmarks bar"
        className={`${BUTTON} cursor-grab shadow-sm hover:bg-brand-600 active:bg-brand-700`}
      >
        {label}
      </a>
      <div className="ac-hand-demo pointer-events-none absolute inset-0">
        <span className={`${BUTTON} ac-hand-ghost absolute inset-0 opacity-0 shadow-md`}>
          {label}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="var(--color-canvas)"
          stroke="var(--color-ink)"
          strokeWidth="2"
          strokeLinejoin="round"
          className="ac-hand-cursor absolute top-[62%] left-[58%] size-[26px] drop-shadow-cursor"
        >
          <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" />
        </svg>
      </div>
    </div>
  );
}
