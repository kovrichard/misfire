import Link from "next/link";
import type React from "react";
import { JsonLd, organizationLd, webSiteLd } from "@/components/marketing/json-ld";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-svh w-full flex-1 flex-col">
      <JsonLd data={organizationLd()} />
      <JsonLd data={webSiteLd()} />

      <nav className="flex w-full items-center gap-[var(--space-4)] px-[clamp(16px,4vw,44px)] py-[var(--space-3)]">
        <Link
          href="/"
          className="mr-auto inline-flex items-center gap-[10px] font-heading text-[18px] no-underline"
        >
          <span className="inline-flex size-[30px] shrink-0 items-center justify-center rounded-full bg-brand text-[15px] text-canvas">
            ✓
          </span>
          analytics-check
        </Link>
        <Link href="/demo" className="text-[14px] no-underline hover:text-brand">
          Demo
        </Link>
      </nav>

      {children}

      <footer className="flex justify-center px-[var(--space-4)] pt-[var(--space-6)] pb-[var(--space-8)]">
        <a
          href="https://catalyst.konvert7.com/"
          className="text-[13px] text-neutral-600 no-underline hover:text-brand-700"
        >
          Made with Catalyst
        </a>
      </footer>
    </div>
  );
}
