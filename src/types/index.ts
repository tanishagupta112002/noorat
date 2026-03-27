import type { LucideIcon } from "lucide-react";

export type PageTheme = "rose" | "amber" | "sage" | "terracotta";

export interface PageLink {
  label: string;
  href: string;
}

export interface PageStat {
  value: string;
  label: string;
}

export interface PageCard {
  eyebrow?: string;
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
  icon?: LucideIcon;
}

export interface PageColumn {
  title: string;
  items: string[];
  icon?: LucideIcon;
}

export interface PageFaq {
  question: string;
  answer: string;
}

export interface PublicPageContent {
  theme?: PageTheme;
  eyebrow: string;
  title: string;
  description: string;
  badges?: string[];
  stats?: PageStat[];
  primaryCta: PageLink;
  secondaryCta?: PageLink;
  cardsTitle?: string;
  cards?: PageCard[];
  columnsTitle?: string;
  columns?: PageColumn[];
  faqTitle?: string;
  faqs?: PageFaq[];
  note?: string;
  finalCta?: {
    title: string;
    description: string;
    primary: PageLink;
    secondary?: PageLink;
  };
}
