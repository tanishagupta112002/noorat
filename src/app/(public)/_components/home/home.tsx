// src/components/home/Home.tsx
import HeroSection from "./hero";
import FeatureStrip from "./feature-strip";
import CategoryStrip from "./category-strip";
import DeliveryCityStudios from "./delivery-city-studios";
import HowItWorks from "./how-it-works";
import CustomRequestTeaser from "./custom-request-teaser";
import PartnerCta from "./partner-cta";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeroSection />
      <FeatureStrip />
      <CategoryStrip />
     
      <DeliveryCityStudios />
      <CustomRequestTeaser />
      <div className="flex items-center justify-center px-3 lg:px-20">
        <div className="relative h-px w-full max-w-4xl bg-linear-to-r from-transparent via-foreground/55 to-transparent">
          <span
            className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
            aria-hidden="true"
          />
        </div>
      </div>
      <HowItWorks />
      
     
     
      
      <PartnerCta />
    </div>
  );
}