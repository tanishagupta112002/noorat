import { HeartHandshake, Sparkles, Wallet } from "lucide-react";

import type { PublicPageContent } from "@/types";

export const content: PublicPageContent = {
  theme: "sage",
  eyebrow: "Why Rent?",
  title: "Sustainable Fashion Starts With Wearing Better, Not Buying More",
  description:
    "Renting occasionwear reduces one-time purchases, lowers wardrobe waste and keeps premium garments in use for more than a single event cycle.",
  badges: ["Lower waste", "Smarter wardrobes"],
  stats: [
    { value: "Less clutter", label: "Fewer one-event purchases at home" },
    { value: "More use", label: "Premium pieces stay in circulation" },
    { value: "Better value", label: "Spend on experience, not storage" },
    { value: "Repeatable", label: "A more practical eventwear habit" },
  ],
  primaryCta: { label: "Browse categories", href: "/categories" },
  secondaryCta: { label: "Read how it works", href: "/how-it-works" },
  cardsTitle: "Why renting helps",
  cards: [
    { title: "Cut one-time purchases", description: "Wedding and party outfits often have low repeat wear. Renting matches the real use case better." },
    { title: "Keep premium in rotation", description: "Beautiful garments get worn more often instead of disappearing into storage after one night." },
    { title: "Buy more intentionally", description: "Reserve ownership for timeless basics and rent the high-impact occasion pieces." },
  ],
  columnsTitle: "Where the impact shows up",
  columns: [
    { title: "At home", icon: HeartHandshake, items: ["Less wardrobe overflow", "Less guilt from one-time buys", "Clearer purchasing decisions", "Better event planning"] },
    { title: "In spending", icon: Wallet, items: ["Lower cost per occasion", "More room for tailoring or beauty spend", "Less sunk cost in trends", "Smarter allocation toward experiences"] },
    { title: "In fashion behavior", icon: Sparkles, items: ["Experiment more safely", "Try trend-led silhouettes", "Support circular use", "Reduce unused inventory"] },
  ],
};
