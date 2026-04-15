import {
  CreditCard,
  MapPin,
  RefreshCcw,
  Repeat,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  Zap,
} from "lucide-react";

const features = [
  { label: "Same Day Delivery", note: "Selected city zones", icon: Zap },
  { label: "Nearby Studios", note: "Try before you rent", icon: MapPin },
  { label: "COD", note: "Flexible payments", icon: CreditCard },
  { label: "In-Store Trial", note: "Try before booking", icon: Store },
  { label: "Easy Returns", note: "Smooth post-event flow", icon: RefreshCcw },
  { label: "We Ship Both Ways", note: "Delivery and pickup", icon: Repeat },
  { label: "Quality Check", note: "Every outfit verified", icon: ShieldCheck },
  { label: "Custom AI Design", note: "Personalized styling", icon: Sparkles },
  { label: "Secure Checkout", note: "Protected transactions", icon: Truck },
] as const;

export default function FeatureStrip() {
  return (
    <section className="w-full bg-white px-3 py-5 lg:px-20 lg:py-7 lg:pb-2">
      <div className="grid grid-cols-2 gap-y-5 border-y border-border/50 py-8 text-center sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <article key={feature.label} className="px-2">
              <Icon className="mx-auto h-6 w-6 text-foreground/60" aria-hidden="true" />
              <h3 className="mt-2 text-sm font-medium leading-5 text-foreground">{feature.label}</h3>
            </article>
          );
        })}
      </div>
    </section>
  );
}
