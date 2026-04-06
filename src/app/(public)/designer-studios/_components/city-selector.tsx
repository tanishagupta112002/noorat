"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, X, MapPin } from "lucide-react";

const ALL_CITIES = [
 // Central India
  { name: "Gwalior", region: "Central", image: "/images/cities/gwalior.jpg" },
  { name: "Indore", region: "Central", image: "/images/cities/indore.jpg" },
  { name: "Nagpur", region: "Central", image: "/images/cities/nagpur.jpg" },
  { name: "Bhopal", region: "Central", image: "/images/cities/bhopal.jpg" },
  // North India
  { name: "Delhi", region: "North", image: "/images/cities/delhi.jpg" },
  { name: "Gurugram", region: "North", image: "/images/cities/gurugram.jpg" },
  { name: "Noida", region: "North", image: "/images/cities/noida.jpg" },
  { name: "Ghaziabad", region: "North", image: "/images/cities/ghaziabad.jpg" },
  { name: "Faridabad", region: "North", image: "/images/cities/faridabad.jpg" },
  { name: "Chandigarh", region: "North", image: "/images/cities/chandigarh.jpg" },
  { name: "Ludhiana", region: "North", image: "/images/cities/ludhiana.jpg" },
  { name: "Jaipur", region: "North", image: "/images/cities/jaipur.jpg" },
  { name: "Lucknow", region: "North", image: "/images/cities/lucknow.jpg" },
  { name: "Agra", region: "North", image: "/images/cities/agra.jpg" },
  // South India
  { name: "Bangalore", region: "South", image: "/images/cities/bangalore.jpg" },
  { name: "Hyderabad", region: "South", image: "/images/cities/hyderabad.jpg" },
  { name: "Chennai", region: "South", image: "/images/cities/chennai.jpg" },
  { name: "Kochi", region: "South", image: "/images/cities/kochi.jpg" },
  { name: "Coimbatore", region: "South", image: "/images/cities/coimbatore.jpg" },
  // West India
  { name: "Mumbai", region: "West", image: "/images/cities/mumbai.jpg" },
  { name: "Pune", region: "West", image: "/images/cities/pune.jpg" },
  { name: "Ahmedabad", region: "West", image: "/images/cities/ahmedabad.jpg" },
  { name: "Surat", region: "West", image: "/images/cities/surat.jpg" },
  { name: "Vadodara", region: "West", image: "/images/cities/vadodara.jpg" },
  // East India
  { name: "Kolkata", region: "East", image: "/images/cities/kolkata.jpg" },
  { name: "Bhubaneswar", region: "East", image: "/images/cities/bhubaneswar.jpg" },
];

interface CitySelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCity: (city: string) => void;
  selectedCity?: string;
}

export function CitySelector({
  open,
  onOpenChange,
  onSelectCity,
  selectedCity,
}: CitySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Freeze body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return ALL_CITIES;
    const query = searchQuery.toLowerCase();
    return ALL_CITIES.filter((city) =>
      city.name.toLowerCase().includes(query) ||
      city.region.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  if (!open) return null;

  const modal = (
    <div
      className="fixed inset-0 z-9999 overflow-hidden"
      style={{ top: 0, left: 0, right: 0, bottom: 0, position: "fixed" }}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/images/hero/i2.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Dark overlay on top of image */}
      <div className="absolute inset-0 bg-black/75" />

      {/* Close Button */}
      <button
        onClick={() => onOpenChange(false)}
        className="absolute top-5 right-5 z-10 p-2 hover:bg-white/20 rounded-full transition-colors"
      >
        <X className="h-7 w-7 text-white" />
      </button>

      {/* Full Page Content */}
      <div className="relative w-full h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-16 space-y-8">

          {/* Title + Search */}
          <div className="space-y-5">
            <h1 className="text-4xl sm:text-5xl font-bold text-white">
              Select Your City
            </h1>
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search cities by name or region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-3 text-lg border-2 border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:bg-white/20 rounded-xl focus:border-white/60 focus:ring-0 focus:outline-none backdrop-blur-sm"
                autoFocus
              />
            </div>
            <p className="text-sm text-white/60">
              {filteredCities.length} cities available
            </p>
          </div>

          {/* Cities Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-6">
            {filteredCities.map((city) => (
              <button
                key={city.name}
                onClick={() => {
                  onSelectCity(city.name);
                  onOpenChange(false);
                }}
                className="group flex flex-col items-center gap-3 transition-transform hover:scale-110"
              >
                <div
                  className={cn(
                    "relative w-20 h-20 rounded-full overflow-hidden border-4 transition-all cursor-pointer flex items-center justify-center bg-white/5 backdrop-blur-sm",
                    selectedCity === city.name
                      ? "border-emerald-400 ring-4 ring-emerald-400/50"
                      : "border-white/40 hover:border-white hover:ring-2 hover:ring-white/30"
                  )}
                >
                  <MapPin className="h-8 w-8 text-white" />
                  {selectedCity === city.name && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                      <span className="text-2xl font-bold text-emerald-400">✓</span>
                    </div>
                  )}
                </div>
                <span className="text-sm font-semibold text-white/90 text-center line-clamp-2 group-hover:text-white transition-colors">
                  {city.name}
                </span>
              </button>
            ))}
          </div>

          {filteredCities.length === 0 && (
            <div className="flex items-center justify-center h-40">
              <p className="text-xl text-white/60">No cities found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
