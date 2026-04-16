import {
  CreditCard,
  MapPin,
  RefreshCcw,
  Repeat,
  ShieldCheck,
  Sparkles,
  Store,
  Zap,
} from "lucide-react";

const features = [
  { label: "Same Day Delivery", mobileLabel: "Same Day", note: "Selected city zones", icon: Zap, hideOnMobile: true },
  { label: "Nearby Studios", mobileLabel: "Nearby", note: "Try before you rent", icon: MapPin },
  { label: "COD", mobileLabel: "COD", note: "Flexible payments", icon: CreditCard },
  { label: "In-Store Trial", mobileLabel: "Trial", note: "Try before booking", icon: Store },
  { label: "Easy Cancellation", mobileLabel: "Cancel", note: "Simple cancellation flow", icon: RefreshCcw },
  { label: "We Ship Both Ways", mobileLabel: "2-Way Ship", note: "Delivery and pickup", icon: Repeat, hideOnMobile: true },
  { label: "Quality Check", mobileLabel: "Quality", note: "Every outfit verified", icon: ShieldCheck },
  { label: "Custom AI Design", mobileLabel: "AI Design", note: "Personalized styling", icon: Sparkles, hideOnMobile: true },
] as const;

export default function FeatureStrip() {
  return (
    <section className="w-full bg-white px-2 py-2 lg:px-20 lg:py-5 lg:pb-2">
      <div className="grid grid-cols-5 gap-1 border-y border-border/50 py-3 text-center sm:grid-cols-4 sm:gap-x-2 sm:gap-y-4 sm:py-6 lg:grid-cols-8">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <article
              key={feature.label}
              className={`px-0.5 sm:px-1 ${"hideOnMobile" in feature && feature.hideOnMobile ? "hidden sm:block" : ""}`}
            >
              <Icon className="mx-auto h-4 w-4 text-foreground/60 sm:h-5 sm:w-5" aria-hidden="true" />
              <h3 className="mt-1 text-[10px] font-medium leading-3.5 text-foreground sm:mt-1.5 sm:text-xs sm:leading-4">
                <span className="sm:hidden">{feature.mobileLabel}</span>
                <span className="hidden sm:inline">{feature.label}</span>
              </h3>
            </article>
          );
        })}
      </div>
    </section>
  );
}
