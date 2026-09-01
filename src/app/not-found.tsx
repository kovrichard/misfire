export default function NotFound() {
  return (
    <main className="page-column flex flex-1 flex-col items-start justify-center gap-[var(--space-6)] py-[clamp(48px,10vw,96px)]">
      <h1 className="text-[clamp(56px,12vw,96px)] text-brand leading-none">404</h1>

      <div className="flex w-full max-w-[40em] gap-[var(--space-3)] rounded-[calc(var(--radius-lg)*1.15)] bg-surface p-[clamp(18px,4vw,28px)]">
        <span aria-hidden="true" className="font-mono text-[15px] text-destructive">
          ✕
        </span>
        <div className="flex flex-col gap-[var(--space-2)]">
          <p className="font-mono font-semibold text-[15px] text-destructive">
            Page not found
          </p>
          <p className="text-pretty font-mono text-[14.5px] text-neutral-800 leading-[1.6]">
            No response recorded for this URL. This one is not your tags. It is a bad
            link.
          </p>
        </div>
      </div>

      <a
        href="/"
        className="inline-flex shrink-0 items-center justify-center gap-[6px] rounded-full bg-brand px-[15.84px] py-[var(--space-2)] font-heading text-[14px] text-canvas leading-[1.2] no-underline hover:bg-brand-600 active:bg-brand-700"
      >
        Back to Misfire
      </a>
    </main>
  );
}
