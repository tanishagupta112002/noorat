import { HeartHandshake, Ruler, Sparkles } from "lucide-react";

import type { PublicPageContent } from "@/types";

export const content: PublicPageContent = {
  theme: "amber",
  eyebrow: "Size Guide",
  title: "Use Measurements First, Labels Second",
  description:
    "Rental success depends more on measurements than on the size written on a label. This page helps customers check the right details before they book.",
  badges: ["Fit-first", "Measurement-led"],
  stats: [
    { value: "4", label: "Key checks: bust, waist, hip, length" },
    { value: "1 tape", label: "Basic tool you need at home" },
    { value: "Less risk", label: "Measurement confirmation reduces returns and panic" },
    { value: "Better booking", label: "Stronger provider conversations" },
  ],
  primaryCta: { label: "Browse categories", href: "/categories" },
  secondaryCta: { label: "Contact support", href: "/contact" },
  cardsTitle: "What to measure",
  cards: [
    { eyebrow: "Upper body", title: "Bust and shoulder", description: "Essential for blouses, gowns, fitted dresses and structured bodices." },
    { eyebrow: "Mid and lower", title: "Waist and hip", description: "Important for lehengas, skirts, saree shapewear planning and western silhouettes." },
    { eyebrow: "Final finish", title: "Length and heel height", description: "Especially important for bridal looks, gowns and anything floor-touching." },
  ],
  columnsTitle: "Fit tips customers should follow",
  columns: [
    { title: "Before booking", icon: Ruler, items: ["Measure over well-fitted innerwear", "Write numbers down clearly", "Mention your heel plan", "Tell the provider if you prefer extra ease"] },
    { title: "Categories that need extra care", icon: Sparkles, items: ["Bridal lehengas", "Reception gowns", "Blouses", "Body-skimming western dresses"] },
    { title: "When to ask for help", icon: HeartHandshake, items: ["If you sit between sizes", "If the fit looks structured", "If the event is high stakes", "If the provider description feels vague"] },
  ],
};
