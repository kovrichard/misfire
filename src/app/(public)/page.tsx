import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { CopySnippet } from "@/components/checker/copy-snippet";
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

function CheckerPreview({ code }: Readonly<{ code: string }>) {
  const kb = (code.length / 1024).toFixed(1);
  return (
    <>
      {`${code.slice(0, 44)}…  `}
      <span className="text-olive-700">{`// the whole checker, ${kb} KB, no network`}</span>
    </>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[800px] flex-1 px-[clamp(16px,4vw,44px)] pt-[clamp(28px,6vw,64px)] pb-[56px]">
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

      <InstallFlow host={conf.host}>
        <div className="mt-[var(--space-8)] rounded-[calc(var(--radius-lg)*1.15)] bg-olive-100 p-[clamp(18px,4vw,28px)]">
          <h4 className="mb-[var(--space-2)] text-[20px] text-olive-900">
            When the site has a strict CSP
          </h4>
          <p className="mb-[var(--space-3)] text-pretty text-[14.5px] text-olive-900 leading-[1.6]">
            Both of the above fetch <code className="text-[13px]">check.js</code>, and a
            strict <code className="text-[13px]">script-src</code> blocks that fetch.
            Running the loader from the console does not get around it. The{" "}
            <code className="text-[13px]">&lt;script src&gt;</code> it appends is still
            the page loading a script. Paste the whole checker instead; it requests
            nothing.
          </p>
          <CopySnippet
            code={bundle}
            bordered={false}
            preview={<CheckerPreview code={bundle} />}
          />
        </div>
      </InstallFlow>

      <section className="mt-[clamp(40px,7vw,60px)] flex flex-wrap items-center gap-[var(--space-4)] rounded-[calc(var(--radius-lg)*1.15)] bg-surface p-[clamp(18px,4vw,28px)]">
        <div className="min-w-[220px] flex-1">
          <h4 className="mb-[var(--space-2)] text-[20px]">See it catch something</h4>
          <p className="text-pretty text-[14.5px] text-neutral-800 leading-[1.6]">
            The demo page installs GA4 twice over and denies analytics consent. Run the
            bookmarklet there and it should report both. If it does not, the checker is
            broken, not your site.
          </p>
        </div>
        <Link
          href="/demo"
          className="inline-flex shrink-0 items-center justify-center gap-[6px] rounded-full bg-brand px-[15.84px] py-[var(--space-2)] font-heading text-[14px] text-canvas leading-[1.2] no-underline hover:bg-brand-600 active:bg-brand-700"
        >
          Open the demo
        </Link>
      </section>
    </main>
  );
}
