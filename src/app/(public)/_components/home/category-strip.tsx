import Image from "next/image";
import Link from "next/link";

const bridalSubs = [
  { label: "Bridal Lehenga" },
  { label: "Designer Saree" },
  { label: "Bridal Gown" },
] as const;

const westernSubs = [
  { label: "Cocktail Gown" },
  { label: "Bodycon Dress" },
  { label: "Maxi Dress" },
] as const;

const traditionalSubs = [
  { label: "Ethnic Lehenga" },
  { label: "Festive Saree" },
  { label: "Anarkali" },
] as const;

export default function CategoryStrip() {
  return (
    <section className="w-full bg-white/50 px-3 py-10 lg:px-20 lg:py-14">
      <div className="mx-auto max-w-345">
        <div className="text-center">
          <h2 className="text-4xl font-semibold tracking-[0.04em] text-foreground">Signature Styles</h2>
          <p className="mt-2 text-sm tracking-[0.12em] text-muted-foreground sm:text-base">
            Pick your vibe for the event: bold bridal, chic western, or timeless traditional.
          </p>
          <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-foreground/70" />
        </div>

        <div className="mt-14 space-y-12">
          {/* Bridal - Left Text, Right Image */}
          <div className="grid items-center justify-center gap-6 sm:gap-8 lg:grid-cols-[0.95fr_1.5fr]">
            <div className="mx-auto w-full max-w-md text-center">
              <Link
                href="/rentals/bridal"
                className="block text-2xl font-semibold text-foreground transition hover:opacity-75 sm:text-3xl lg:text-4xl"
              >
                Bridal
              </Link>
              <p className="mt-2 text-sm uppercase tracking-[0.18em] text-muted-foreground">Celebrate Your Day</p>
              <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-3 sm:gap-x-4 sm:gap-y-4 lg:grid-cols-1">
                {bridalSubs.map((sub) => (
                  <Link
                    key={sub.label}
                    href="/rentals/bridal"
                    className="group block py-1.5 transition hover:opacity-75"
                  >
                    <p className="text-lg font-semibold text-foreground sm:text-xl">
                      {sub.label}
                    </p>
                  </Link>
                ))}
              </div>
              <Link
                href="/rentals/bridal"
                className="mt-6 inline-flex min-h-12 min-w-44 items-center justify-center bg-foreground px-6 text-lg font-semibold text-primary-foreground transition hover:opacity-90 sm:mt-8 sm:min-h-14 sm:text-xl"
              >
                Shop Now
              </Link>
            </div>
            <Link
              href="/rentals/bridal"
              className="group relative block h-60 overflow-hidden sm:h-80 lg:h-115"
            >
              <Image
                src="/images/hero/i1.png"
                alt="Bridal"
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
              />
            </Link>
          </div>

          {/* Western - Right Image, Left Text */}
          <div className="grid items-center gap-6 sm:gap-8 lg:grid-cols-[1.5fr_0.95fr]">
            <Link
              href="/rentals/western"
              className="group relative block h-60 overflow-hidden sm:h-80 lg:h-115"
            >
              <Image
                src="/images/hero/i2.png"
                alt="Western"
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
              />
            </Link>
            <div className="mx-auto w-full max-w-md text-center">
              <Link
                href="/rentals/western"
                className="block px-3 py-1 text-2xl font-semibold text-foreground transition hover:opacity-75 sm:text-3xl lg:text-4xl"
              >
                Western
              </Link>
              <p className="mt-2 text-sm uppercase tracking-[0.18em] text-muted-foreground">Modern & Chic</p>
              <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-3 sm:gap-x-4 sm:gap-y-4 lg:grid-cols-1">
                {westernSubs.map((sub) => (
                  <Link
                    key={sub.label}
                    href="/rentals/western"
                    className="group block py-1.5 transition hover:opacity-75"
                  >
                    <p className="text-lg font-semibold text-foreground sm:text-xl">
                      {sub.label}
                    </p>
                  </Link>
                ))}
              </div>
              <Link
                href="/rentals/western"
                className="mt-6 inline-flex min-h-12 min-w-44 items-center justify-center bg-foreground px-6 text-lg font-semibold text-primary-foreground transition hover:opacity-90 sm:mt-8 sm:min-h-14 sm:text-xl"
              >
                Explore
              </Link>
            </div>
          </div>

          {/* Traditional - Left Text, Right Image */}
          <div className="grid items-center gap-6 sm:gap-8 lg:grid-cols-[0.95fr_1.5fr]">
            <div className="mx-auto w-full max-w-md text-center">
              <Link
                href="/rentals/ethnic"
                className="block text-2xl font-semibold text-foreground transition hover:opacity-75 sm:text-3xl lg:text-4xl"
              >
                Traditional
              </Link>
              <p className="mt-2 text-sm uppercase tracking-[0.18em] text-muted-foreground">Timeless Heritage</p>
              <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-3 sm:gap-x-4 sm:gap-y-4 lg:grid-cols-1">
                {traditionalSubs.map((sub) => (
                  <Link
                    key={sub.label}
                    href="/rentals/ethnic"
                    className="group block py-1.5 transition hover:opacity-75"
                  >
                    <p className="text-lg font-semibold text-foreground sm:text-xl">
                      {sub.label}
                    </p>
                  </Link>
                ))}
              </div>
              <Link
                href="/rentals/ethnic"
                className="mt-6 inline-flex min-h-12 min-w-44 items-center justify-center bg-foreground px-6 text-lg font-semibold text-primary-foreground transition hover:opacity-90 sm:mt-8 sm:min-h-14 sm:text-xl"
              >
                Discover
              </Link>
            </div>
            <Link
              href="/rentals/ethnic"
              className="group relative block h-60 overflow-hidden sm:h-80 lg:h-115"
            >
              <Image
                src="/images/hero/i3.png"
                alt="Traditional"
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
