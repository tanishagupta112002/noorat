import Link from "next/link";
import { Facebook, Instagram, Linkedin, ShieldCheck, Truck, Undo2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const footerSections = [
  {
    title: "Shop Rentals",
    links: [
      { label: "All Rentals", href: "/rentals" },
      { label: "Western Edit", href: "/rentals/western" },
      { label: "Traditional Edit", href: "/rentals/ethnic" },
      { label: "Bridal Edit", href: "/rentals/bridal" },
      { label: "Size Guide", href: "/size-guide" },
    ],
  },
  {
    title: "Discover",
    links: [
      { label: "Designer Studios", href: "/designer-studios" },
      { label: "Custom Requests", href: "/custom-requests" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Custom Request Pricing", href: "/custom-requests/pricing" },
      { label: "Provider Information", href: "/provider-info" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "FAQs", href: "/faq" },
      { label: "Sustainability", href: "/sustainability" },
      { label: "Track Orders", href: "/orders" },
      { label: "Wishlist", href: "/wishlist" },
    ],
  },
  {
    title: "Partner With Us",
    links: [
      { label: "Become a Provider", href: "/become-a-provider" },
      { label: "Provider Dashboard", href: "/provider" },
      { label: "Delivery Partner Login", href: "/delivery-auth/login" },
      { label: "Delivery Partner Register", href: "/delivery-auth/register" },
      { label: "Provider Onboarding", href: "/become-a-provider/onboarding" },
    ],
  },
] as const;

const popularSearches = [
  "Lehenga",
  "Cocktail Gown",
  "Saree",
  "Sharara",
  "Indo-Western",
  "Reception Outfit",
  "Bridesmaid Dress",
  "Festive Wear",
  "Pre-Wedding Shoot",
  "Engagement Look",
] as const;

export default function Footer() {
  return (
    <footer className="relative -mt-20 overflow-hidden border-t border-rose-200 bg-linear-to-br from-primary-foreground via-secondary to-primary text-foreground lg:mt-0">

      <div className="relative w-full px-3 pb-28 pt-14 lg:px-20 lg:pb-12">
        <div className="grid gap-10 border-b border-rose-300/70 pb-10 lg:grid-cols-[1.3fr_2fr] lg:gap-14">
          <div className="space-y-5">
            <Logo imageClassName="h-16" />
            <p className="max-w-md text-sm leading-6 text-[#603030] sm:text-[15px]">
              Noorat is your fashion rental destination to discover curated outfits from nearby
              designer studios with fast delivery, cleaner wardrobes, and smarter celebrations.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {popularSearches.map((item) => (
                <Link
                  key={item}
                  href="/rentals"
                  className="rounded-full border border-rose-300/80 bg-white/70 px-3 py-1.5 text-xs font-semibold tracking-[0.02em] text-[#6a2e2e] transition hover:-translate-y-0.5 hover:bg-white"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="mb-3 text-sm font-extrabold uppercase tracking-[0.12em] text-[#521d1d]">
                  {section.title}
                </h3>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm font-medium text-[#6b3131] transition hover:pl-1 hover:text-[#2f0f0f]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 border-b border-rose-300/60 py-6 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/60 px-4 py-3 shadow-[0_8px_25px_-20px_rgba(120,40,40,0.8)]">
            <Truck className="h-5 w-5 text-[#7a2323]" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#541f1f]">Fast Delivery</p>
              <p className="text-xs text-[#6b3232]">Doorstep delivery in selected city zones.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/60 px-4 py-3 shadow-[0_8px_25px_-20px_rgba(120,40,40,0.8)]">
            <Undo2 className="h-5 w-5 text-[#7a2323]" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#541f1f]">Easy Return</p>
              <p className="text-xs text-[#6b3232]">Hassle-free pickup after your event window.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/60 px-4 py-3 shadow-[0_8px_25px_-20px_rgba(120,40,40,0.8)]">
            <ShieldCheck className="h-5 w-5 text-[#7a2323]" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#541f1f]">Trusted Checkout</p>
              <p className="text-xs text-[#6b3232]">Secure order flow with clear pricing breakdown.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-5 text-xs text-[#642d2d] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Noorat. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <Link
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Noorat Instagram"
              className="rounded-full bg-white/65 p-2 transition hover:-translate-y-0.5 hover:bg-white"
            >
              <Instagram className="h-4 w-4" />
            </Link>
            <Link
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Noorat Facebook"
              className="rounded-full bg-white/65 p-2 transition hover:-translate-y-0.5 hover:bg-white"
            >
              <Facebook className="h-4 w-4" />
            </Link>
            <Link
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Noorat LinkedIn"
              className="rounded-full bg-white/65 p-2 transition hover:-translate-y-0.5 hover:bg-white"
            >
              <Linkedin className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}