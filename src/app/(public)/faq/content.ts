import { HeartHandshake, MapPin, Ruler, Sparkles } from "lucide-react";

import type { PublicPageContent } from "@/types";

const commonCategoryFaqs = [
  {
    question: "How do I know if a rental will fit me properly?",
    answer:
      "Use the size guide as your first filter, then confirm bust, waist, hip and length details with the provider before payment if the outfit is structured or bridal-heavy.",
  },
  {
    question: "Can I request accessories with the outfit?",
    answer:
      "Yes, many providers can suggest jewellery, bags or dupattas that match your selected category. Nearby designer and provider pages are the best place to shortlist stores that offer styling help.",
  },
  {
    question: "What if I want a similar look but not the exact listed style?",
    answer:
      "Move to the AI custom request flow. It works well when you know the vibe, event and color palette but want something more specific than a ready-to-rent pick.",
  },
];

export const content: PublicPageContent = {
  theme: "rose",
  eyebrow: "FAQs",
  title: "Answers to the Questions Customers Ask Before Renting",
  description:
    "This page gives a single customer-facing FAQ route from the navbar so users are not left guessing about fit, timing, custom requests or provider coordination.",
  badges: ["Customer support", "Fast answers"],
  stats: [
    { value: "1 hub", label: "For common customer questions" },
    { value: "Fast", label: "Less back-and-forth before booking" },
    { value: "Cross-route", label: "Covers categories, custom and local providers" },
    { value: "Practical", label: "Focused on what affects decisions" },
  ],
  primaryCta: { label: "Contact support", href: "/contact" },
  secondaryCta: { label: "Read how it works", href: "/how-it-works" },
  faqTitle: "Customer questions",
  faqs: [
    ...commonCategoryFaqs,
    {
      question: "Should I start with categories or nearby designers?",
      answer:
        "Start with categories if you know the style first. Start with nearby designers if local pickup, fitting clarity or urgent coordination matters more than style discovery.",
    },
    {
      question: "When should I use a custom request instead of browsing rentals?",
      answer:
        "Use a custom request when you have a clear inspiration image, want a particular color or detail, or cannot find a close-enough ready-to-rent option.",
    },
    {
      question: "What should I confirm before finalizing a booking?",
      answer:
        "Confirm measurements, event date, pickup or delivery timing, accessory inclusion and the return process before you proceed.",
    },
    {
      question: "Do nearby providers help with accessories too?",
      answer:
        "Many boutiques can suggest matching jewellery, dupattas or bags, especially for bridal and festive categories. Ask this early if you want a full look.",
    },
  ],
  columnsTitle: "Quick links",
  columns: [
    { title: "Browse by style", icon: Sparkles, items: ["Western wear", "Ethnic wear", "Bridal specials", "Party wear"] },
    { title: "Plan your rental", icon: Ruler, items: ["Size guide", "How it works", "Nearby designers", "Custom requests"] },
    { title: "Get support", icon: HeartHandshake, items: ["Contact page", "Provider info", "Sustainability", "How it works"] },
  ],
  finalCta: {
    title: "Still need a human answer?",
    description: "Use the contact route when you are between two categories, unsure about custom requests or need help deciding which customer page to use next.",
    primary: { label: "Open contact page", href: "/contact" },
    secondary: { label: "See nearby designers", href: "/designer-studios/nearby" },
  },
};

export { commonCategoryFaqs };
