import Image from "next/image";
import Link from "next/link";

const categories = [
  {
    id: "bridal",
    title: "Bridal",
    subtitle: "Celebrate Your Day",
    image: "/images/hero/i1.png",
    href: "/rentals/bridal",
    cta: "Shop Now",
  },
  {
    id: "western",
    title: "Western",
    subtitle: "Modern & Chic",
    image: "/images/hero/i2.png",
    href: "/rentals/western",
    cta: "Explore",
  },
  {
    id: "traditional",
    title: "Traditional",
    subtitle: "Timeless Heritage",
    image: "/images/hero/i3.png",
    href: "/rentals/ethnic",
    cta: "Discover",
  },
] as const;

export default function CategoryStrip() {
  return (
    <section className="w-full bg-white/50 px-3 py-8 lg:px-20 lg:py-12">
      {/* Header */}
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          Signature Styles
        </h2>
        <p className="mt-2 text-xs tracking-wide text-muted-foreground sm:text-sm lg:text-base">
          Pick your vibe for the event: bold bridal, chic western, or timeless traditional.
        </p>
        <div className="mx-auto mt-4 h-px w-12 bg-foreground/70 lg:mt-5" />
      </div>

      {/* Horizontal Scroll Carousel */}
      <div className="mt-6 overflow-x-auto lg:mt-8">
        <div className="flex gap-3 pb-2 sm:gap-4 lg:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={category.href}
              className="group relative min-w-70 shrink-0 overflow-hidden rounded-lg sm:min-w-90 lg:min-w-105"
            >
              {/* Image */}
              <div className="relative h-48 w-full overflow-hidden bg-gray-100 sm:h-64 lg:h-80">
                <Image
                  src={category.image}
                  alt={category.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>

              {/* Text Overlay - Centered Bottom */}
              <div className="absolute inset-0 flex flex-col items-center justify-end bg-linear-to-t from-black/60 via-transparent to-transparent px-4 py-4 sm:py-6 lg:py-8">
                <h3 className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                  {category.title}
                </h3>
                <p className="mt-1 text-xs uppercase tracking-widest text-white/80 sm:text-sm lg:mt-2">
                  {category.subtitle}
                </p>
                <button
                  className="mt-3 inline-flex bg-white px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-white/90 sm:mt-4 sm:px-6 sm:py-2.5 sm:text-sm lg:mt-5 lg:px-8 lg:py-3 lg:text-base"
                >
                  {category.cta}
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
