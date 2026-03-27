import { HeartHandshake, MapPin, Store } from "lucide-react";

import type { PublicPageContent } from "@/types";

export const content: PublicPageContent = {
  theme: "terracotta",
  eyebrow: "Contact Us",
  title: "Reach Support When You Need Direction, Not Guesswork",
  description:
    "Use the contact route when a customer decision is blocked by fit confusion, route confusion or uncertainty between renting and requesting something custom.",
  badges: ["Customer help", "Route guidance"],
  stats: [
    { value: "1 team", label: "To help route customers faster" },
    { value: "Less friction", label: "Avoid getting lost between public pages" },
    { value: "Useful", label: "Best when you have a specific question" },
    { value: "Practical", label: "Support tied to next-step decisions" },
  ],
  primaryCta: { label: "Read the FAQs", href: "/faq" },
  secondaryCta: { label: "Explore nearby designers", href: "/nearby-designers" },
  cardsTitle: "Best reasons to contact support",
  cards: [
    { eyebrow: "Fit", title: "You are unsure about sizing", description: "Use support when the event is important and the silhouette feels measurement-sensitive." },
    { eyebrow: "Routing", title: "You do not know which page to use next", description: "If you are stuck between categories, nearby providers and custom requests, support can narrow the path." },
    { eyebrow: "Planning", title: "You need timeline guidance", description: "Especially useful for bridal, heavy-work or last-minute decisions where the next step matters." },
  ],
  columnsTitle: "Before you reach out",
  columns: [
    { title: "Prepare this first", icon: HeartHandshake, items: ["Event type", "Date or timeline", "Preferred category", "Any key fit concern"] },
    { title: "Support can usually guide you toward", icon: MapPin, items: ["The right category page", "A nearby designer route", "The size guide", "The custom request flow"] },
    { title: "If you are a provider instead", icon: Store, items: ["Open provider info", "Review benefits", "See how onboarding works", "Start the onboarding flow"] },
  ],
};
