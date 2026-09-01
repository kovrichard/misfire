import Link from "next/link";
import type React from "react";
import { JsonLd, organizationLd, webSiteLd } from "@/components/marketing/json-ld";
import { catalystReferralUrl } from "@/lib/catalyst";
import conf from "@/lib/config";
import { repoUrl } from "@/lib/metadata";

const GITHUB_MARK =
  "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z";

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
          Misfire
        </Link>
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Read the source on GitHub"
          className="inline-flex items-center gap-[7px] text-[14px] text-neutral-700 no-underline hover:text-brand"
        >
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            fill="currentColor"
            className="size-[18px]"
          >
            <path d={GITHUB_MARK} />
          </svg>
          Source
        </a>
      </nav>

      {children}

      <footer className="flex flex-wrap justify-center gap-[var(--space-3)] px-[var(--space-4)] pt-[var(--space-6)] pb-[var(--space-8)]">
        <Link
          href="/demo"
          className="text-[13px] text-neutral-600 no-underline hover:text-brand-700"
        >
          Demo
        </Link>
        <span aria-hidden="true" className="text-[13px] text-neutral-400">
          ·
        </span>
        <a
          href={catalystReferralUrl(conf.authority)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] text-neutral-600 no-underline hover:text-brand-700"
        >
          Made with Catalyst
        </a>
      </footer>
    </div>
  );
}
