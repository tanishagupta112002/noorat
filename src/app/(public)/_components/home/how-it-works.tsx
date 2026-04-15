import Link from "next/link";
import { CalendarClock, CheckSquare, DoorOpen, Shirt } from "lucide-react";

const steps = [
  {
    title: "Select Your Dreamy Outfit",
    description:
      "Browse rentals, nearby designer studios, or custom requests to shortlist the look that matches your event vibe and budget.",
    icon: Shirt,
  },
  {
    title: "Book For Your Special Day",
    description:
      "Choose your rental dates and explore custom AI design options, or you can also schedule an in-store trial before final checkout.",
    icon: CalendarClock,
  },
  {
    title: "Shine in Your Look",
    description:
      "Receive your outfit with timely delivery in serviceable zones, wear it with confidence, and enjoy your special occasion stress-free.",
    icon: CheckSquare,
  },
  {
    title: "Hassle-Free Return",
    description:
      "After your event, hand over the outfit via scheduled pickup or return instructions from the provider for a smooth close to your rental.",
    icon: DoorOpen,
  },
] as const;

export default function HowItWorks() {
  return (
    <section className="w-full bg-white/50 px-3 py-10 lg:px-20 lg:py-14">
      <div className="text-center">
        <h2 className="text-3xl font-semibold tracking-[0.05em] text-foreground">
          How Noorat Works
        </h2>
        <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-foreground/70" />
      </div>

      <div className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div key={step.title} className="text-center">
              <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-white text-foreground shadow-sm">
                <Icon className="h-8 w-8" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold tracking-[0.04em] text-foreground">
                {step.title}
              </h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-8 text-muted-foreground">
                {step.description}
              </p>

              <div className="mt-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-[#d6b46b] text-lg font-bold text-white xl:hidden">
                {index + 1}
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative mt-10 hidden xl:block">
        <div className="absolute left-10 right-10 top-1/2 h-px -translate-y-1/2 bg-border" aria-hidden="true" />
        <div className="grid grid-cols-4 place-items-center">
          {steps.map((step, index) => (
            <span
              key={step.title}
              className="z-10 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-[#d6b46b] text-xl font-bold text-white shadow-sm"
            >
              {index + 1}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/how-it-works" className="text-sm font-semibold text-primary hover:underline">
          View detailed journey
        </Link>
      </div>
    </section>
  );
}
