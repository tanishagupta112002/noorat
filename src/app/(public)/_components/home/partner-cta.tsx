import Link from "next/link";

export default function PartnerCta() {
  return (
    <section className="w-full bg-white px-4 py-6 pb-10 lg:px-20 lg:py-8 lg:pb-14">
      <div className="mx-auto max-w-5xl border-y border-border/60 py-10 text-center lg:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Partner With Noorat</p>
        <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          Own A Boutique? Become A Noorat Provider
        </h3>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8 lg:text-lg">
          Own a boutique? You have your own dresses. List today and start earning with Noorat.
          Get discovered by customers actively searching for bridal, western, and traditional
          outfits in your city, and manage bookings easily from one dashboard.
        </p>
        <Link
          href="/become-a-provider"
          className="mt-7 inline-flex h-12 items-center justify-center bg-foreground px-8 text-sm font-bold uppercase tracking-[0.08em] text-primary-foreground transition hover:opacity-90"
        >
          Become a Provider
        </Link>
      </div>
    </section>
  );
}
