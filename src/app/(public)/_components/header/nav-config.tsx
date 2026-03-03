// src/components/layout/nav-config.ts
export const homeDropdown = [
  { href: "/", label: "Home" },
  { href: "/featured", label: "Featured Rentals", badge: "New" },
  { href: "/trending", label: "Trending Outfits" },
  { href: "/ai-preview", label: "Try AI Preview", badge: "Free" },
];

export const rentalsDropdown = [
  {
    category: "Western Wear",
    items: [
      { href: "/rentals/western/dresses", label: "Dresses" },
      { href: "/rentals/western/tops", label: "Tops & Blouses" },
      { href: "/rentals/western/skirts", label: "Skirts" },
      { href: "/rentals/western/jumpsuits", label: "Jumpsuits" },
    ],
  },
  {
    category: "Traditional Wear",
    items: [
      { href: "/rentals/ethnic/sarees", label: "Sarees" },
      { href: "/rentals/ethnic/lehengas", label: "Lehengas" },
      { href: "/rentals/ethnic/salwar-suits", label: "Salwar Suits" },
      { href: "/rentals/ethnic/kurtis", label: "Kurtis" },
    ],
  },
  {
    category: "Other Favorites",
    items: [
      { href: "/rentals/party-wear", label: "Party Wear" },
      { href: "/rentals/casual", label: "Casual" },
      { href: "/rentals/kids", label: "Kids Wear" },
      { href: "/rentals/accessories", label: "Accessories" },
    ],
  },
];

export const customDropdown = [
  { href: "/custom-requests", label: "Create Custom Request", badge: "AI Powered" },
  { href: "/custom-requests/how-it-works", label: "How Custom Works" },
  { href: "/custom-requests/pricing", label: "Pricing & Timeline" },
];

export const exploreDropdown = [
  { href: "/sustainability", label: "Why Rent? Save Money & Planet" },
  { href: "/how-it-works", label: "How TaniTwirl Works" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact Us" },
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href);
}