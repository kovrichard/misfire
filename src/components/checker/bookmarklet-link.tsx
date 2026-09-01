"use client";

import { useEffect, useRef } from "react";

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
    <a
      ref={ref}
      href={fallbackHref}
      draggable
      className="inline-flex cursor-grab items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 py-2 font-medium text-primary text-sm active:cursor-grabbing"
    >
      {label}
    </a>
  );
}
