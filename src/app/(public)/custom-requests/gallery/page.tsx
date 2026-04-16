"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

type GalleryItem = {
  id: string;
  imageUrl: string;
  prompt: string;
};

const GALLERY_STORAGE_KEY = "noorat-custom-gallery";

export default function CustomRequestsGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(GALLERY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as GalleryItem[];
      if (Array.isArray(parsed)) {
        setItems(parsed);
      }
    } catch {
      setItems([]);
    }
  }, []);

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-20 lg:py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-playfair text-3xl font-semibold text-foreground sm:text-4xl">Gallery</h1>
          <Link href="/custom-requests" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to chat
          </Link>
        </div>

        {items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-3xl border border-border/70 bg-white p-3 shadow-sm">
                <img src={item.imageUrl} alt={item.prompt} className="h-90 w-full rounded-2xl bg-white object-contain" />
                <p className="px-1 pt-3 text-sm text-foreground line-clamp-2">{item.prompt}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-white px-5 py-10 text-center text-muted-foreground">
            No gallery images yet. Generate from the chat screen and they will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
