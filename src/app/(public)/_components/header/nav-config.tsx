import type { LucideIcon } from "lucide-react";
import {
  Shirt,
  Scissors,
  Heart,
  MapPin,
  Store,
} from "lucide-react";

export interface NavChild {
  label: string;
  href: string;
  description?: string;
  badge?: string; // "New", "Hot", "AI Powered", "Free" etc
  children?: NavChild[];
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavChild[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Categories",
    href: "/rentals",
    icon: Shirt,
    children: [
      {
        label: "All Rentals",
        href: "/rentals",
        description: "Browse all outfits available for rent",
      },
      {
        label: "Western Wear",
        href: "/rentals/western",
        description: "Western wear, dresses, celebrity looks, date looks and cocktail edits",
        children: [
          { label: "Dresses", href: "/rentals/western/dresses" },
          { label: "Celebrity Styles", href: "/rentals/celebrity-styles" },
          { label: "Date Specials", href: "/rentals/date-specials" },
          { label: "Birthday Specials", href: "/rentals/birthday-specials" },
          { label: "Cocktail Party", href: "/rentals/cocktail-party" },
        ],
      },
      {
        label: "Traditional Wear",
        href: "/rentals/ethnic",
        description: "Traditional wear, sarees, lehengas, poshaks and festive edits",
        children: [
          { label: "Sarees", href: "/rentals/ethnic/sarees" },
          { label: "Lehengas", href: "/rentals/ethnic/lehengas" },
          { label: "Indo Western", href: "/rentals/ethnic/indo-western" },
          { label: "Salwar Suits", href: "/rentals/ethnic/salwar-suits" },
          { label: "Kurtis & Sets", href: "/rentals/ethnic/kurtis" },
          { label: "Anarkalis", href: "/rentals/ethnic/anarkalis" },
          { label: "Lehenga Saree", href: "/rentals/ethnic/lehenga-saree" },
          { label: "Heavy Gowns", href: "/rentals/ethnic/heavy-gowns" },
          { label: "Mehndi Outfits", href: "/rentals/ethnic/mehndi-outfits" },
          { label: "Haldi Outfits", href: "/rentals/ethnic/haldi-outfits" },
          { label: "Rajasthani Poshak", href: "/rentals/ethnic/rajasthani-poshak" },
        ],
      },
      {
        label: "Bridal Specials",
        href: "/rentals/bridal",
        description: "Wedding outfits for every ceremony",
        children: [
          {
            label: "Bridal Lehengas",
            href: "/rentals/bridal/bridal-lehengas",
          },
          {
            label: "Engagement Gowns",
            href: "/rentals/bridal/engagement-gowns",
          },
          {
            label: "Reception Gowns",
            href: "/rentals/bridal/reception-gowns",
          },
          {
            label: "Reception Gown Saree",
            href: "/rentals/bridal/reception-gown-saree",
          },
          {
            label: "Mehndi & Haldi Outfits",
            href: "/rentals/bridal/mehndi-haldi",
          },
          {
            label: "Sangeet Dresses",
            href: "/rentals/bridal/sangeet-outfits",
          },
          { label: "Bridal Sarees", href: "/rentals/bridal/bridal-sarees" },
          { label: "Poshak", href: "/rentals/bridal/poshak" },
        ],
      },
      {
        label: "Party Wear",
        href: "/rentals/party-wear",
        description: "Party wear, casual outfits, tops, jumpsuits, skirts, shorts and co-ords",
        children: [
          {
            label: "Party Wear",
            href: "/rentals/party-wear",
            badge: "Trending",
          },
          { label: "Casual Outfits", href: "/rentals/casual" },
          { label: "Tops & Blouses", href: "/rentals/party-wear/tops" },
          { label: "Jumpsuits", href: "/rentals/party-wear/jumpsuits" },
          { label: "Skirts", href: "/rentals/party-wear/skirts" },
          { label: "Shorts", href: "/rentals/party-wear/shorts" },
          { label: "Co-ord Sets", href: "/rentals/party-wear/co-ord-sets" },
        ],
      },
    ],
  },
  {
    label: "AI Try-On",
    href: "/custom-requests",
    icon: Scissors,
    children: [
      {
        label: "Create Your Design",
        href: "/custom-requests",
        description: "Apna dream outfit banwao",
        badge: "AI Powered",
      },
      {
        label: "How It Works",
        href: "/custom-requests/how-it-works",
        description: "Idea se delivery tak",
      },
      {
        label: "Pricing & Timeline",
        href: "/custom-requests/pricing",
        description: "Sab kuch clear & transparent",
      },
    ],
  },
  {
    label: "Designer Studios",
    href: "/designer-studios",
    icon: MapPin,
    children: [
      {
        label: "View All Designer Studios",
        href: "/designer-studios",
        description:
          "Explore all designer studios and open any provider profile",
      },
      {
        label: "Nearby Designer Studios",
        href: "/nearby-designers",
        description:
          "Find top lehenga & saree rental boutiques near your location",
      },
      {
        label: "Top Rated Boutiques",
        href: "/nearby-designers/top-rated",
        badge: "Popular",
        description: "Highly rated designer rental stores",
      },
      {
        label: "Bridal Rental Specialists",
        href: "/nearby-designers/bridal",
        description: "Best boutiques for bridal lehenga rentals",
      },
      {
        label: "Budget Friendly Rentals",
        href: "/nearby-designers/budget",
        description: "Affordable designer outfit rentals near you",
      },
    ],
  },
  {
    label: "Explore",
    href: "/how-it-works",
    icon: Heart,
    children: [
      {
        label: "Why Rent?",
        href: "/sustainability",
        description: "Renting is the new owning – save money, space & the planet",
      },
      { label: "How noorat Works", href: "/how-it-works" },
      { label: "Size Guide", href: "/size-guide" },
      { label: "FAQs", href: "/faq" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
  label: "Become a Provider",
  href: "/provider-info",
  icon: Store,
  children: [
    {
      label: "Why Become a Provider?",
      href: "/provider-info#benefits",
      description: "Earn by listing your boutique designs or rental outfits on noorat",
    },
    {
      label: "How It Works",
      href: "/provider-info#how-it-works",
      description: "Simple steps to start earning with noorat",
    },
    {
      label: "For Boutique Designers",
      href: "/provider-info#boutique",
      description: "Showcase your designs and accept custom orders",
    },
    {
      label: "For Rental Shops",
      href: "/provider-info#rental",
      description: "List your outfits and rent them to customers",
    },
    {
      label: "Provider FAQs",
      href: "/provider-info#faq",
      description: "Common questions about becoming a provider",
    },
    {
      label: "Start Your Journey",
      href: "/become-a-provider/onboarding",
      description: "Create your provider account and start earning",
    },
  ],
}
];

// Simple active check (tum chaho to isko aur improve kar sakte ho search params ke saath)
export function isActiveNavItem(
  pathname: string,
  item: Pick<NavItem, "href" | "children">,
): boolean {
  if (pathname === item.href || pathname.startsWith(`${item.href}/`))
    return true;
  return (
    item.children?.some(
      (child) =>
        pathname === child.href || pathname.startsWith(`${child.href}/`),
    ) ?? false
  );
}
