"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    title: "Find Designers Near You",
    subtitle: "Discover local boutiques for lehengas & dresses.",
    image: "/images/hero/i1.png",
    primary: { label: "Explore Designers", href: "/designer-studios" },
  },
  {
    title: "Rent Designer Outfits",
    subtitle: "Luxury looks without the luxury price.",
    image: "/images/hero/i2.png",
    primary: { label: "Browse Rentals", href: "/rentals" },
  },
  {
    title: "Design Your Dream Outfit",
    subtitle: "Use AI to create your perfect\nfashion piece.",
    image: "/images/hero/image1.png",
    primary: { label: "Try AI Design", href: "/custom-requests" },
  },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);

  const next = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const prev = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const timer = setInterval(next, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className=" relative w-full overflow-hidden">
      <div className="relative h-55 sm:h-105 md:h-110 lg:h-137.5">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              current === index ? "opacity-100 z-10" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority
                className="object-cover object-right"
              />

              <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/50 to-transparent"></div>
            </div>
            {/* Content */}
            <div className="relative h-full max-w-7xl mx-auto px-8 sm:px-20 lg:px-4 flex items-start py-6 sm:py-25 md:py-25 lg:py-40">
              <div className="max-w-45 sm:max-w-80 md:max-w-80 lg:max-w-160 space-y-1 lg:space-y-4">
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-secondary leading-tight">
                  {slide.title}
                </h1>

                <p className="text-xs sm:text-lg md:text-2xl lg:text-2xl whitespace-pre-line text-accent-foreground">
                  {slide.subtitle}
                </p>

                <Button
                  variant="default"
                  size="lg"
                  className="text-xs sm:text-sm md:text-xl mt-3 lg:text-xl px-2 sm:px-4 md:px-6 sm:py-3 lg:p-8"
                  asChild
                >
                  <Link href={slide.primary.href}>{slide.primary.label}</Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur rounded-full p-2 shadow"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur rounded-full p-2 shadow"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 w-2 rounded-full transition ${
              current === i ? "bg-white" : "bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
