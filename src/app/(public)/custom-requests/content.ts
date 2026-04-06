import { Clock3, HeartHandshake, MapPin, Palette, Ruler, Sparkles, Wallet } from "lucide-react";

import type { PublicPageContent } from "@/types";

export const customRequestPages: Record<string, PublicPageContent> = {
  index: {
    theme: "terracotta",
    eyebrow: "AI Try-On",
    title: "Turn Inspiration Into a Custom Outfit Brief Customers Can Actually Use",
    description:
      "This flow is for customers who know the vibe but cannot find the exact rental. Use references, event details and body-fit preferences to build a clearer request for boutiques and designers.",
    badges: ["AI Powered", "From idea to stitch plan"],
    stats: [
      { value: "3 steps", label: "From inspiration to provider-ready brief" },
      { value: "Clear", label: "Better prompts mean better design matches" },
      { value: "Flexible", label: "Use for custom stitching or design refinement" },
      { value: "Faster", label: "Reduces back-and-forth with providers" },
    ],
    primaryCta: { label: "See how it works", href: "/custom-requests/how-it-works" },
    secondaryCta: { label: "Pricing and timeline", href: "/custom-requests/pricing" },
    cardsTitle: "What this route is built for",
    cards: [
      { eyebrow: "Inspiration", title: "Upload mood and references", description: "Bring screenshots, saved looks, color ideas or ceremony references into one clearer request." },
      { eyebrow: "Clarity", title: "Describe event and fit needs", description: "Mention the occasion, deadline, comfort level and must-have details before you reach out to a provider." },
      { eyebrow: "Execution", title: "Move into boutique production", description: "Take the final brief to a boutique or rental partner that can stitch, adapt or recreate the look." },
    ],
    columnsTitle: "Best use cases",
    columns: [
      { title: "When to use AI Try-On", icon: Sparkles, items: ["You cannot find the exact look in rentals", "You want a custom color story", "You need event-specific styling guidance", "You want providers to react to one clear brief"] },
      { title: "What to include", icon: Palette, items: ["Your reference photos", "Event and date", "Desired silhouette", "Any comfort or fit constraints"] },
      { title: "What happens next", icon: Clock3, items: ["Review the process page", "Check likely pricing range", "Find a boutique or provider", "Finalize the design direction"] },
    ],
    finalCta: {
      title: "Want to compare custom against ready-to-rent first?",
      description: "Open categories and nearby designer pages side by side. If the inventory is close enough, rent. If it is not, use custom requests with clearer references.",
      primary: { label: "Browse categories", href: "/categories" },
      secondary: { label: "Find nearby designers", href: "/designer-studios/nearby" },
    },
  },
  "how-it-works": {
    theme: "sage",
    eyebrow: "Custom Requests",
    title: "How the AI Try-On Flow Moves From Idea to Provider-Ready Request",
    description:
      "This page explains the customer workflow so you know exactly what to prepare, how the request gets shaped and when to involve a boutique or provider.",
    badges: ["Transparent process", "Customer-side clarity"],
    stats: [
      { value: "1", label: "Reference-led starting point" },
      { value: "2", label: "Clarification steps before production" },
      { value: "3", label: "Decision modes: rent, adapt or stitch" },
      { value: "Less noise", label: "Stronger briefs reduce message churn" },
    ],
    primaryCta: { label: "Review pricing", href: "/custom-requests/pricing" },
    secondaryCta: { label: "Start from categories", href: "/categories" },
    cardsTitle: "The flow, step by step",
    cards: [
      { eyebrow: "Step 1", title: "Collect references", description: "Bring 2-4 images, event details, preferred colors and anything you want to avoid." },
      { eyebrow: "Step 2", title: "Shape the brief", description: "Convert raw inspiration into something a provider can actually respond to in practical terms." },
      { eyebrow: "Step 3", title: "Choose execution", description: "Either rent a close match, adapt an existing style or move into custom stitching through a provider." },
    ],
    columnsTitle: "Make the request stronger",
    columns: [
      { title: "Useful inputs", icon: Palette, items: ["Neckline preference", "Sleeve preference", "Color family", "Event type and time of day"] },
      { title: "Useful constraints", icon: Ruler, items: ["Height", "Comfort level", "Budget ceiling", "Timeline deadline"] },
      { title: "Good next routes", icon: MapPin, items: ["Nearby designers", "Top-rated boutiques", "Provider information", "Contact page for help"] },
    ],
  },
  pricing: {
    theme: "amber",
    eyebrow: "Custom Requests",
    title: "Pricing and Timelines for AI-Led Custom Outfit Requests",
    description:
      "This page sets customer expectations before they commit. Exact quotes depend on design complexity, work level and provider, but the route should still feel transparent instead of vague.",
    badges: ["Clear expectations", "Timeline awareness"],
    stats: [
      { value: "Low", label: "Simple edits and light styling cost less" },
      { value: "Medium", label: "Moderate customization needs more provider time" },
      { value: "High", label: "Heavy-work bridal requests need early planning" },
      { value: "Earlier", label: "Booking sooner reduces stress and compromises" },
    ],
    primaryCta: { label: "See the process", href: "/custom-requests/how-it-works" },
    secondaryCta: { label: "Contact for help", href: "/contact" },
    cardsTitle: "What usually changes the quote",
    cards: [
      { eyebrow: "Design complexity", title: "Silhouette and fit work", description: "Structured cuts, multi-piece sets and exact recreation requests need more time than simpler edits." },
      { eyebrow: "Detailing", title: "Embellishment and finishing", description: "Embroidery density, lining needs and finishing details can shift the quote quickly." },
      { eyebrow: "Timeline", title: "Urgency and event date", description: "Rush timelines usually reduce options and can increase the cost or narrow provider availability." },
    ],
    columnsTitle: "Customer planning guide",
    columns: [
      { title: "Best for lightweight custom", icon: Wallet, items: ["Color swaps", "Reference-inspired updates", "Simple silhouette tweaks", "Accessory-coordinated looks"] },
      { title: "Needs more lead time", icon: Clock3, items: ["Bridal recreations", "Heavy embroidery", "Multiple fitting points", "Premium finishing requests"] },
      { title: "Before you message a provider", icon: HeartHandshake, items: ["Know the budget range", "Know the event deadline", "Keep the brief focused", "Bring measurement basics"] },
    ],
    note: "Quotes and exact production windows depend on the selected provider. This page exists to set a realistic customer expectation early, not to replace final provider pricing.",
  },
};
