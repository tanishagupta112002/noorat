import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function CustomRequestTeaser() {
  return (
    <section className="w-full bg-white/50 pb-8 px-3 lg:px-20">
      <div className="relative overflow-hidden px-5 py-7 text-center sm:px-8 sm:py-8 lg:py-9">
        <div
          className="pointer-events-none absolute -left-16 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-primary/10 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-16 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-accent/30 blur-2xl"
          aria-hidden="true"
        />

        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Custom Request + AI Try-On
        </p>

        <h2 className="mx-auto mt-2.5 max-w-3xl text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          Didn&apos;t Find Your Size Or Style?
        </h2>

        <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
          Share your event date, preferred silhouette, and budget. We will connect you with matching
          studios and tailored suggestions.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/custom-requests"
            className="inline-flex h-12 items-center justify-center bg-foreground px-6 text-sm font-bold uppercase tracking-[0.06em] text-primary-foreground transition hover:opacity-90"
          >
            Start Custom Request
          </Link>
          <Link
            href="/custom-requests/how-it-works"
            className="inline-flex h-12 items-center justify-center border border-border bg-white px-6 text-sm font-semibold uppercase tracking-[0.06em] text-foreground transition hover:border-primary/60 hover:text-primary"
          >
            Learn Process
          </Link>
        </div>
      </div>
    </section>
  );
}
