"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Props = {
  title: string;
  accentClass: string;
  images: string[];
  category: string;
};

export function ImageGallery({ title, accentClass, images, category }: Props) {
  const validImages = useMemo(
    () => images.filter((image) => typeof image === "string" && image.trim().length > 0),
    [images],
  );
  const [selected, setSelected] = useState(0);
  const hasImages = validImages.length > 0;
  const currentImage = validImages[selected] ?? validImages[0];

  return (
    <div className="lg:sticky lg:top-60">
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-start">
        {hasImages && validImages.length > 0 ? (
          <div className="order-2 grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3 md:order-1 md:w-24 md:grid-cols-1 md:pr-1">
            {validImages.map((image, i) => (
              <button
                key={`${image}-${i}`}
                onClick={() => setSelected(i)}
                aria-label={`View image ${i + 1}`}
                className={`relative aspect-3/4 overflow-hidden rounded-lg sm:rounded-xl border transition-all bg-linear-to-br ${accentClass} ${
                  selected === i
                    ? "border-primary shadow-md"
                    : "border-border/40 opacity-75 hover:border-border hover:opacity-100"
                }`}
              >
                <Image
                  src={image}
                  alt={`${title} thumbnail ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 15vw, 80px"
                  className="object-contain p-1"
                />
              </button>
            ))}
          </div>
        ) : null}

        <div className={`relative order-1 aspect-7/8  w-full overflow-hidden rounded-2xl sm:rounded-[32px] border border-border/50 bg-linear-to-br shadow-[0_24px_80px_rgba(15,23,42,0.08)] ${accentClass}`}>
          {hasImages ? (
            <Image
              src={currentImage}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 100vw, 48vw"
              className="object-contain"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <span className="text-6xl opacity-60">👗</span>
              <div className="space-y-1">
                <p className="font-playfair text-xl font-semibold leading-snug text-foreground/80">
                  {title}
                </p>
                <span className="inline-block rounded-full bg-background/70 px-3 py-1 text-xs font-medium text-foreground/60 backdrop-blur-sm">
                  {category}
                </span>
              </div>
            </div>
          )}

          {!hasImages && (
            <div className="absolute bottom-3 right-3 rounded-full bg-background/80 px-2 py-1 text-[10px] font-medium text-muted-foreground backdrop-blur-sm">
              Photos coming soon
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
