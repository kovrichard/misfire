import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { InstallFlow } from "@/components/checker/install-flow";
import conf from "@/lib/config";
import { metaDescription, metaTitle, openGraph } from "@/lib/metadata";

const path = "/";

export const metadata: Metadata = {
  title: metaTitle,
  description: metaDescription,
  alternates: { canonical: path },
  openGraph: { ...openGraph, url: path },
};

const bundle = readFileSync(join(process.cwd(), "public/check.js"), "utf-8");

export default function Home() {
  return (
    <main className="page-column flex-1 pt-[clamp(28px,6vw,64px)] pb-[56px]">
      <section>
        <span className="inline-flex items-center rounded-full bg-olive-100 px-[10px] py-[3px] text-[11px] text-olive-800 tracking-[0.02em]">
          Bookmarklet · runs inside the page
        </span>
        <h1 className="my-[var(--space-3)] text-balance text-[clamp(34px,6.5vw,48px)]">
          Know whether your tags actually fire.
        </h1>
        <p className="max-w-[40em] text-pretty text-[16.5px] text-neutral-800 leading-[1.6]">
          Reading a page&apos;s HTML tells you nothing. Anything deployed through GTM is
          injected at runtime and never appears in the source. This runs inside the page
          instead, so it sees the real network log: which containers loaded, which IDs are
          configured, and whether a single hit was ever sent.
        </p>
      </section>

      <InstallFlow host={conf.host} bundle={bundle} />

      <section className="mt-[clamp(40px,7vw,60px)] flex flex-wrap items-center gap-[var(--space-4)] rounded-[calc(var(--radius-lg)*1.15)] bg-surface p-[clamp(18px,4vw,28px)]">
        <div className="min-w-[220px] flex-1">
          <h4 className="mb-[var(--space-2)] text-[20px]">See it catch something</h4>
          <p className="text-pretty text-[14.5px] text-neutral-800 leading-[1.6]">
            The demo page installs GA4 twice over and denies analytics consent. Run the
            bookmarklet there and it should report both. If it does not, the checker is
            broken, not your site.
          </p>
        </div>
        <a
          href="/demo"
          className="inline-flex shrink-0 items-center justify-center gap-[6px] rounded-full bg-brand px-[15.84px] py-[var(--space-2)] font-heading text-[14px] text-canvas leading-[1.2] no-underline hover:bg-brand-600 active:bg-brand-700"
        >
          Open the demo
        </a>
      </section>
    </main>
  );
}
