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
        description: "Western wear edits including dresses, gowns and celebrity styles",
        children: [
          { label: "Dresses", href: "/rentals/western/dresses" },
          { label: "Frock Dresses", href: "/rentals/western/frock-dresses" },
          { label: "Bodycon Dresses", href: "/rentals/western/bodycon-dresses" },
          { label: "Gowns", href: "/rentals/western/gowns" },
          { label: "Slit Gowns", href: "/rentals/western/slit-gowns" },
          { label: "Cape Gowns", href: "/rentals/western/cape-gowns" },
          { label: "Western Saree Dresses", href: "/rentals/western/western-saree-dresses" },
          { label: "Maxi Dresses", href: "/rentals/western/maxi-dresses" },
          { label: "Mini Dresses", href: "/rentals/western/mini-dresses" },
          { label: "Mermaid Gowns", href: "/rentals/western/mermaid-gowns" },
          { label: "Celebrity Styles", href: "/rentals/celebrity-styles" },
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
          { label: "Rajasthani Poshak", href: "/rentals/bridal/poshak" },
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
        href: "/designer-studios/nearby",
        description:
          "Find top lehenga & saree rental boutiques near your location",
      },
      {
        label: "Top Rated Boutiques",
        href: "/designer-studios/top-rated",
        badge: "Popular",
        description: "Highly rated designer rental stores",
      },
      {
        label: "Bridal Rental Specialists",
        href: "/designer-studios/bridal",
        description: "Best boutiques for bridal lehenga rentals",
      },
      {
        label: "Budget Friendly Rentals",
        href: "/designer-studios/budget",
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

// Check if EXACTLY on this item's page (not children)
export function isActiveNavItem(
  pathname: string,
  item: Pick<NavItem, "href" | "children">,
): boolean {
  // Only highlight parent if EXACTLY on its page
  return pathname === item.href;
}

// Check if any child is active (for auto-opening dropdowns)
export function hasActiveChild(
  pathname: string,
  item: Pick<NavItem, "href" | "children">,
): boolean {
  return (
    item.children?.some(
      (child) =>
        pathname === child.href || pathname.startsWith(`${child.href}/`),
    ) ?? false
  );
}
