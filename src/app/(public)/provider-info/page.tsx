"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Coins, Scissors, Store, Users, Building2, Shirt } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const providerFaqs = [
  {
    question: "Who should become a provider on noorat?",
    answer:
      "Boutique designers, lehenga and saree rental shops, occasionwear studios and local businesses that want customer discovery, orders and repeat demand through one platform.",
  },
  {
    question: "Do I need to be a large store to join?",
    answer:
      "No. The provider flow is useful for small local boutiques and growing rental businesses as long as you can manage communication, inventory quality and customer coordination.",
  },
  {
    question: "What do I need before onboarding?",
    answer:
      "Have your mobile number, identity documents, store details, pickup address and bank details ready. The onboarding flow then takes you into your first listing.",
  },
  {
    question: "Can I use noorat for custom orders too?",
    answer:
      "Yes. Boutique-led providers can benefit from customers coming through both category discovery and AI custom request routes.",
  },
];

"use client";

import { useState } from "react";

type ProviderType = "boutique" | "rental" | null;

export default function ProviderInfoPage() {
  const [selectedType, setSelectedType] = useState<ProviderType>(null);

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden border-b border-border/70 bg-linear-to-br from-background via-orange-50/70 to-rose-100/60">
        <div className="absolute -left-10 top-10 h-56 w-56 rounded-full bg-orange-200/60 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-rose-200/60 blur-3xl" />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-20 lg:py-24">
          <div className="max-w-3xl space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="rounded-full border-orange-300/40 bg-white/80 px-4 py-1 text-orange-800">
                Become a Provider
              </Badge>
              <span className="rounded-full border border-border/60 bg-white/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                Boutique and rental businesses
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="font-playfair text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                Build a Customer-Facing Presence Beyond Instagram DMs
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                The public navbar already sends customers toward categories, nearby designers and custom requests. This page explains why providers should be on the other side of that discovery.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/become-a-provider/onboarding">Start your journey</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#benefits">See provider benefits</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: "More reach", label: "Show up on customer browse pages" },
              { value: "Local trust", label: "Be discoverable in nearby designer routes" },
              { value: "Better leads", label: "Get customers who already know what they want" },
              { value: "2 paths", label: "Support rentals and custom requests" },
            ].map((stat) => (
              <Card key={stat.label} className="rounded-3xl border-orange-200/30 bg-white/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-3xl font-semibold sm:text-4xl">{stat.value}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Provider Type Selector */}
      <section className="border-b border-border/70 bg-gradient-to-r from-slate-50/50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-20">
          <div className="text-center mb-8">
            <h2 className="font-playfair text-2xl font-semibold sm:text-3xl mb-2">What's your business?</h2>
            <p className="text-sm text-muted-foreground">Each path is optimized for different business models</p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* Boutique/Designer Card */}
            <Card 
              className={`rounded-2xl cursor-pointer transition-all ${
                selectedType === "boutique" 
                  ? "border-primary bg-primary/5 shadow-lg" 
                  : "border-border/50 hover:border-border"
              }`}
              onClick={() => setSelectedType(selectedType === "boutique" ? null : "boutique")}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-purple-100 p-3">
                    <Shirt className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Designer Studios & Boutiques</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Custom stitched designs, bridal wear, bespoke creations
                    </p>
                    <ul className="space-y-2 text-xs">
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✓</span> Accept AI custom requests
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✓</span> Showcase your custom work
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✓</span> Build your brand presence
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rental Shop Card */}
            <Card 
              className={`rounded-2xl cursor-pointer transition-all ${
                selectedType === "rental" 
                  ? "border-primary bg-primary/5 shadow-lg" 
                  : "border-border/50 hover:border-border"
              }`}
              onClick={() => setSelectedType(selectedType === "rental" ? null : "rental")}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-orange-100 p-3">
                    <Building2 className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Rental Shops</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Lehenga rentals, saree rentals, party wear inventory
                    </p>
                    <ul className="space-y-2 text-xs">
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✓</span> Show on category pages
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✓</span> Get nearby discovery
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✓</span> Maximize inventory usage
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-14 sm:px-6 lg:px-20 lg:py-18">
        <section id="benefits" className="space-y-6 scroll-mt-32">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-playfair text-3xl font-semibold sm:text-4xl">
              {selectedType === null 
                ? "Why become a provider?" 
                : selectedType === "boutique" 
                ? "Why boutiques win on noorat"
                : "Why rental shops win on noorat"}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              {selectedType === null
                ? "noorat gives customers clear public routes. Providers benefit because those routes are already organized around how customers actually decide."
                : selectedType === "boutique"
                ? "You get customers with clearer briefs, better event context, and readiness to commission custom work."
                : "You get customers shopping by category with specific needs - making conversion easier than generic social browsing."}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {(selectedType === null ? (
              // Show all benefits for unselected
              [
                {
                  icon: Users,
                  title: "Meet intent-led customers",
                  description: "Customers arrive from category pages, nearby designer pages and custom request flows with clearer intent than generic social browsing.",
                },
                {
                  icon: Store,
                  title: "Build a stronger storefront",
                  description: "Your boutique or rental house becomes easier to discover through dedicated provider-facing and customer-facing routes.",
                },
                {
                  icon: Coins,
                  title: "Earn from idle inventory",
                  description: "List wedding, party and festive outfits that would otherwise stay underused between seasons.",
                },
                {
                  icon: Scissors,
                  title: "Support custom work too",
                  description: "Boutiques can also benefit from customers coming in with clearer briefs through AI custom requests.",
                },
              ]
            ) : selectedType === "boutique" ? (
              // Boutique-specific benefits
              [
                {
                  icon: Users,
                  title: "Clearer briefs from customers",
                  description: "Customers arrive through custom requests with event details, budget and inspiration already established.",
                },
                {
                  icon: Scissors,
                  title: "Specialize in custom work",
                  description: "AI custom requests attract customers ready to commission bespoke designs and custom stitching.",
                },
                {
                  icon: Store,
                  title: "Build brand presence",
                  description: "Your boutique becomes discoverable through designer studio routes and custom request flows.",
                },
                {
                  icon: Coins,
                  title: "Higher conversion rates",
                  description: "Customers with established budgets and clear requirements are more likely to confirm orders.",
                },
              ]
            ) : (
              // Rental-specific benefits
              [
                {
                  icon: Store,
                  title: "Category discovery",
                  description: "Show up on western, ethnic, bridal and party wear category pages where customers actively shop.",
                },
                {
                  icon: Users,
                  title: "Nearby customer routes",
                  description: "Customers find you based on location and proximity, making local discovery a key advantage.",
                },
                {
                  icon: Coins,
                  title: "Maximize inventory usage",
                  description: "Every outfit listed has multiple chances to be rented throughout the season.",
                },
                {
                  icon: CheckCircle2,
                  title: "Volume and scale",
                  description: "Higher transaction volume through faster rental cycles compared to custom work.",
                },
              ]
            )).map((item) => {
              const Icon = item.icon;

              return (
                <Card key={item.title} className="rounded-3xl border-border/70 shadow-sm">
                  <CardHeader className="space-y-3">
                    <span className="w-fit rounded-full bg-primary/10 p-2 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription className="text-sm leading-6">{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="how-it-works" className="space-y-6 scroll-mt-32">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-playfair text-3xl font-semibold sm:text-4xl">How it works</h2>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              The onboarding flow is structured so providers move from identity and store setup into live inventory instead of getting stuck in a half-finished profile.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                title: "Complete onboarding",
                items: ["Verify mobile and identity", "Add store details", "Set pickup address", "Finish bank setup"],
              },
              {
                title: "Add your first listing",
                items: selectedType === "boutique" 
                  ? ["Upload design samples", "Set service type", "Define pricing", "Publish portfolio"]
                  : ["Upload outfit images", "Set category and size", "Add pricing", "Publish available inventory"],
              },
              {
                title: "Receive customer demand",
                items: selectedType === "boutique"
                  ? ["Show up on custom requests", "Handle design inquiries", "Complete projects", "Build repeat visibility"]
                  : ["Show up on public routes", "Handle local inquiries", "Convert rental leads", "Grow repeat visibility"],
              },
            ].map((column) => (
              <Card key={column.title} className="rounded-3xl border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">{column.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {column.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Show relevant section based on selection */}
        {(selectedType === null || selectedType === "boutique") && (
          <section id="boutique" className="space-y-6 scroll-mt-32">
            <div className="max-w-2xl space-y-2">
              <h2 className="font-playfair text-3xl font-semibold sm:text-4xl">For boutique designers</h2>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                Boutique-led providers benefit most when customers come through custom requests, bridal routes and category pages that already frame the event and silhouette.
              </p>
            </div>

            <Card className="rounded-[2rem] border-border/70 bg-linear-to-r from-orange-100/70 via-white/90 to-rose-100/80 shadow-sm">
              <CardContent className="grid gap-6 p-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold">Use noorat as a clearer intake funnel</h3>
                  <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                    Customers can arrive with inspiration, event details and category intent already established. That makes it easier to quote, accept or adapt custom requests without repeating the same discovery conversation from scratch.
                  </p>
                </div>
                <ul className="space-y-3">
                  {[
                    "Great fit for custom stitched looks",
                    "Useful for bridal and premium festive work",
                    "Better lead quality from clarified briefs",
                    "Can convert inspiration into paid work faster",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        )}

        {(selectedType === null || selectedType === "rental") && (
          <section id="rental" className="space-y-6 scroll-mt-32">
            <div className="max-w-2xl space-y-2">
              <h2 className="font-playfair text-3xl font-semibold sm:text-4xl">For rental shops</h2>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                Rental-first providers win when customers can land directly on category pages, nearby designer routes and budget-friendly discovery paths without empty pages in between.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {[
                {
                  title: "Turn inventory into discovery",
                  description: "Category routes such as western, ethnic, bridal and party wear help customers find you through the exact type of outfit they want.",
                },
                {
                  title: "Strengthen local advantage",
                  description: "Nearby designer pages make your location, pickup convenience and fit support part of the decision, not an afterthought.",
                },
              ].map((item) => (
                <Card key={item.title} className="rounded-3xl border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription className="text-sm leading-6">{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section id="faq" className="space-y-6 scroll-mt-32">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-playfair text-3xl font-semibold sm:text-4xl">
              {selectedType === "boutique" 
                ? "Boutique FAQs"
                : selectedType === "rental"
                ? "Rental FAQs"
                : "Provider FAQs"}
            </h2>
          </div>

          <Card className="rounded-3xl border-border/70 shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <Accordion type="single" collapsible className="w-full">
                {(selectedType === "boutique" 
                  ? providerFaqs.slice(0, 2).concat(providerFaqs.slice(-1))
                  : selectedType === "rental"
                  ? providerFaqs.slice(1)
                  : providerFaqs
                ).map((faq) => (
                  <AccordionItem key={faq.question} value={faq.question}>
                    <AccordionTrigger className="text-base font-medium">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-sm leading-6 text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-linear-to-r from-orange-100/70 via-white/90 to-rose-100/80 shadow-sm">
            <CardContent className="flex flex-col gap-6 p-8 sm:p-10 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <h2 className="font-playfair text-3xl font-semibold sm:text-4xl">
                  {selectedType === null
                    ? "Start building your provider side now"
                    : selectedType === "boutique"
                    ? "Ready to accept custom briefs?"
                    : "Ready to turn inventory into revenue?"}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                  {selectedType === null
                    ? "The customer-facing public routes are in place. If your store is ready to convert that traffic into bookings, move straight into onboarding."
                    : selectedType === "boutique"
                    ? "Accept clearer custom requests with established briefs, budgets and timelines. Get started with your boutique setup today."
                    : "Get your rental inventory in front of customers actively searching by category and location. Start with your first listing now."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/become-a-provider/onboarding">
                    Start your journey
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/contact">Talk to support</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}