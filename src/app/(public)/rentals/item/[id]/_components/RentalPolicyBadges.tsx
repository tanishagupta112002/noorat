"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  CalendarDays,
  ChevronRight,
  CircleCheckBig,
  CreditCard,
  RotateCcw,
  Truck,
  X,
} from "lucide-react";

import { Sheet, SheetContent } from "@/components/ui/sheet";

type PolicyKey = "delivery" | "rentalPeriod" | "payment" | "securityDeposit" | "cancellation";

type PolicyCard = {
  label: string;
  value: string;
};

type PolicySection = {
  title: string;
  items: string[];
};

type PolicyDefinition = {
  key: PolicyKey;
  badgeLabel: string;
  badgeMeta: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentClass: string;
  cards: PolicyCard[];
  sections: PolicySection[];
};

const policies: PolicyDefinition[] = [
  {
    key: "delivery",
    badgeLabel: "Delivery",
    badgeMeta: "7-8 days standard",
    title: "Delivery Information",
    description: "Delivery timelines depend on your location and the provider's city.",
    icon: Truck,
    accentClass: "bg-sky-50 text-sky-700 border-sky-200",
    cards: [
      { label: "Standard", value: "7-8 days" },
      { label: "Within locality", value: "Next day" },
      { label: "Condition", value: "After booking confirm" },
    ],
    sections: [
      {
        title: "What to expect",
        items: [
          "Standard delivery is completed within 7-8 days after the order is confirmed.",
          "Same-locality and nearby provider area orders are delivered the next day.",
          "Real-time dispatch and delivery updates are sent after the order is accepted.",
        ],
      },
    ],
  },
  {
    key: "rentalPeriod",
    badgeLabel: "Rental Period",
    badgeMeta: "Fixed 3 days",
    title: "Rental Period",
    description: "This outfit is available on one fixed rental duration only.",
    icon: CalendarDays,
    accentClass: "bg-violet-50 text-violet-700 border-violet-200",
    cards: [
      { label: "Rental duration", value: "3 days" },
      { label: "Start", value: "From delivery date" },
      { label: "Extension", value: "Not included" },
    ],
    sections: [
      {
        title: "Rental rules",
        items: [
          "The rental period is fixed for 3 days only.",
          "The count starts from the date the outfit is delivered to you.",
        ],
      },
    ],
  },
  {
    key: "payment",
    badgeLabel: "Payment",
    badgeMeta: "COD, UPI & more",
    title: "Payment Methods",
    description: "Flexible payment options available for your convenience.",
    icon: CreditCard,
    accentClass: "bg-orange-50 text-orange-700 border-orange-200",
    cards: [
      { label: "COD", value: "Available" },
      { label: "UPI", value: "Available" },
      { label: "Cards", value: "Available" },
    ],
    sections: [
      {
        title: "Supported methods",
        items: [
          "Cash on Delivery (COD) - Pay when you receive the outfit.",
          "UPI - Instant payment via Google Pay, PhonePe, Paytm, etc.",
          "Credit & Debit Cards - Visa, Mastercard, and other major cards.",
          "Digital Wallets - Apple Pay and other supported wallet services.",
        ],
      },
    ],
  },
  {
    key: "securityDeposit",
    badgeLabel: "Security",
    badgeMeta: "Rs. 1000 refundable",
    title: "Security Deposit",
    description: "A fixed refundable deposit is collected to secure the rental.",
    icon: Banknote,
    accentClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cards: [
      { label: "Deposit", value: "Rs. 1000" },
      { label: "Type", value: "Refundable" },
      { label: "Refund time", value: "After inspection" },
    ],
    sections: [
      {
        title: "Deposit terms",
        items: [
          "A refundable security deposit of Rs. 1000 is charged along with the rental booking.",
          "The amount is refunded after the outfit is returned and checked by the provider.",
          "Deductions may apply only if there is major damage, missing accessories, or permanent staining.",
        ],
      },
    ],
  },
  {
    key: "cancellation",
    badgeLabel: "Cancellation",
    badgeMeta: "Orders & refunds",
    title: "Cancellation Policy",
    description: "Simple and transparent cancellation guidelines.",
    icon: RotateCcw,
    accentClass: "bg-amber-50 text-amber-700 border-amber-200",
    cards: [
      { label: "Before delivery", value: "100% refund" },
      { label: "At doorstep", value: "Full refund" },
      { label: "After acceptance", value: "No refund" },
    ],
    sections: [
      {
        title: "Before delivery",
        items: [
          "Cancel anytime before the outfit is delivered - you get 100% refund.",
          "Use My Orders to cancel with a single tap.",
          "Refund is processed to your original payment method within 3-5 business days.",
        ],
      },
      {
        title: "At doorstep",
        items: [
          "If the outfit doesn't meet expectations, accept it from the delivery partner.",
          "Inform the delivery boy immediately that you want to cancel.",
          "You'll get a full refund - the delivery boy will collect the outfit.",
          "No refund without returning the outfit to the delivery boy at the time of delivery.",
        ],
      },
    ],
  },
];

export default function RentalPolicyBadges() {
  const [activeKey, setActiveKey] = useState<PolicyKey | null>(null);

  const activePolicy = useMemo(
    () => policies.find((policy) => policy.key === activeKey) ?? null,
    [activeKey],
  );

  return (
    <section className="w-full border border-border/60 bg-white rounded-lg sm:rounded-2xl p-4 sm:p-6">
      <div className="space-y-1.5 border-b border-border/70 pb-3 sm:pb-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">Our Commitment</h2>
        <p className="text-xs text-muted-foreground">
          Complete policy details for your rental
        </p>
      </div>

      <div className="mt-3 sm:mt-4 divide-y divide-border/70">
        {policies.map((policy) => {
          const Icon = policy.icon;

          return (
            <button
              key={policy.key}
              type="button"
              onClick={() => setActiveKey(policy.key)}
              className="flex w-full items-center gap-2 sm:gap-3 px-3 py-3 sm:py-4 text-left transition-colors hover:bg-muted/50 rounded"
            >
              <span className="inline-flex h-10 sm:h-12 w-10 sm:w-12 shrink-0 items-center justify-center rounded-full border bg-white text-foreground">
                <Icon className="h-4 sm:h-5 w-4 sm:w-5" />
              </span>
              <span className="min-w-0 flex-1 space-y-0.5">
                <span className="block text-xs sm:text-sm font-semibold text-foreground">{policy.badgeLabel}</span>
                <span className="block text-xs leading-4 text-muted-foreground">{policy.badgeMeta}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          );
        })}
      </div>

      <Sheet open={Boolean(activePolicy)} onOpenChange={(open) => !open && setActiveKey(null)}>
        <SheetContent side="right" className="w-full max-w-none p-0 sm:max-w-md [&>button]:hidden bg-white">
          {activePolicy ? (
            <div className="flex h-full flex-col bg-white">
              <div className="flex items-start justify-between border-b border-border px-5 py-6 sm:px-6 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white text-foreground`}>
                      <activePolicy.icon className="h-4.5 w-4.5" />
                    </span>
                    <h3 className="text-lg font-semibold text-foreground">{activePolicy.title}</h3>
                  </div>
                  <p className="text-sm leading-5 text-muted-foreground">{activePolicy.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveKey(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted shrink-0"
                  aria-label="Close policy details"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {activePolicy.cards.map((card) => (
                    <div key={card.label} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{card.label}</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">{card.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-5">
                  {activePolicy.sections.map((section) => (
                    <section key={section.title} className="rounded-2xl border border-border/60 bg-white p-5">
                      <h4 className="text-base font-semibold text-foreground">{section.title}</h4>
                      <ul className="mt-4 space-y-3">
                        {section.items.map((item) => (
                          <li key={item} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                            <CircleCheckBig className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  );
}