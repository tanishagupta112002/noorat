"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogoLoader } from "@/components/ui/logo-loader";
import { MapPin, Zap } from "lucide-react";
import { CitySelector } from "./city-selector";
import { useRouter } from "next/navigation";

type NearbySearchFormProps = {
  variant?: "hero" | "inline";
  selectedCityName?: string;
};

export function NearbySearchForm({ variant = "hero", selectedCityName }: NearbySearchFormProps) {
  const [open, setOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Reset loading state when selectedCityName prop changes
  useEffect(() => {
    if (selectedCityName) {
      setIsLoading(false);
    }
  }, [selectedCityName]);

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    setIsLoading(true);
    // Navigate with city query param
    router.push(`/designer-studios/nearby?location=${encodeURIComponent(city)}#nearby-results`);
  };

  return (
    <>
      <CitySelector
        open={open}
        onOpenChange={setOpen}
        onSelectCity={handleSelectCity}
        selectedCity={selectedCity}
      />

      {/* Backdrop blur overlay when loading */}
      {isLoading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <LogoLoader label="Finding Studios" size="md" />
        </div>
      )}

      {variant === "hero" ? (
        <section className={`relative text-center ${isLoading ? "opacity-50" : ""}`}>
          <div className="mx-auto max-w-2xl space-y-5 sm:space-y-6">
            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/18 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white shadow-sm backdrop-blur-sm">
                <Zap className="h-3.5 w-3.5 fill-current" />
                Same-Day Delivery
              </p>
              <h2 className="text-4xl font-extrabold leading-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] sm:text-5xl">
                Select your city
              </h2>
              <p className="mx-auto max-w-xl text-sm leading-6 text-white/90 sm:text-base">
                Discover designer studios near you and see which ones can deliver within 24 hours.
              </p>
            </div>

            <div className="mx-auto flex max-w-md justify-center">
              {!isLoading && (
                <Button
                  onClick={() => setOpen(true)}
                  size="lg"
                  className="h-13 w-full gap-2 rounded-full bg-white px-7 text-base font-semibold text-[#4b2630] shadow-xl shadow-black/30 hover:bg-white/95 sm:h-14"
                >
                  <MapPin className="h-5 w-5" />
                  {selectedCityName || "Select Your City"}
                </Button>
              )}
            </div>

            <p className="mx-auto max-w-lg text-xs leading-6 text-white/85 sm:text-sm">
              Studios show delivery within 24 hours in your selected city.
            </p>
          </div>
        </section>
      ) : (
        <section className={`space-y-3 ${isLoading ? "opacity-50" : ""}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                <Zap className="h-3.5 w-3.5 fill-current" />
                Same-Day Delivery
              </p>
              <p className="text-sm text-muted-foreground">
                Change city to refine nearby studios.
              </p>
            </div>

            {!isLoading && (
              <Button
                onClick={() => setOpen(true)}
                size="lg"
                className="h-11 w-full gap-2 rounded-full px-6 sm:w-auto"
              >
                <MapPin className="h-4.5 w-4.5" />
                {selectedCityName || "Select Your City"}
              </Button>
            )}
          </div>
        </section>
      )}
    </>
  );
}
