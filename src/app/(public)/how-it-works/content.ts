import { HeartHandshake, MapPin, Ruler } from "lucide-react";

import type { PublicPageContent } from "@/types";

export const content: PublicPageContent = {
  theme: "sage",
  eyebrow: "Explore",
  title: "How noorat Works for Customers From Search to Return",
  description:
    "This route explains the core customer journey so first-time renters know what to expect before choosing a provider, confirming fit and finalizing pickup or delivery.",
  badges: ["Customer guide", "Built from navbar"],
  stats: [
    { value: "1", label: "Search for your event or vibe" },
    { value: "2", label: "Confirm fit and timing" },
    { value: "3", label: "Book, wear, return" },
    { value: "Clear", label: "Designed to reduce rental hesitation" },
  ],
  primaryCta: { label: "Explore categories", href: "/categories" },
  secondaryCta: { label: "Find nearby designers", href: "/nearby-designers" },
  cardsTitle: "Core customer steps",
  cards: [
    { eyebrow: "Step 1", title: "Browse with purpose", description: "Start from categories, nearby designers or custom requests depending on whether you know the look, the event or the provider type first." },
    { eyebrow: "Step 2", title: "Validate the details", description: "Confirm measurements, timing, accessories and return instructions before you commit." },
    { eyebrow: "Step 3", title: "Wear and return smoothly", description: "Use the provider's pickup, return and care guidance so the rental stays simple end to end." },
  ],
  columnsTitle: "What makes the flow easier",
  columns: [
    { title: "Start with the right route", icon: MapPin, items: ["Categories for style", "Nearby designers for locality", "Top-rated boutiques for trust", "Custom requests for specific inspiration"] },
    { title: "Check before paying", icon: Ruler, items: ["Size", "Length", "Lead time", "Return window"] },
    { title: "Escalate when needed", icon: HeartHandshake, items: ["Contact support", "Switch to a custom request", "Ask a local provider", "Compare with the size guide"] },
  ],
};
