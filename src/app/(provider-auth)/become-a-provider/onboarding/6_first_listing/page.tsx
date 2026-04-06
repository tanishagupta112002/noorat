// 6_first_listing/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { completeFirstListingAction } from "../_actions/onboarding-actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  RENTAL_CATEGORY_OPTIONS,
  RENTAL_COLOR_OPTIONS,
  RENTAL_SIZE_OPTIONS,
} from "@/lib/rental-listing-options";

const COLOR_SWATCH_MAP: Record<string, string> = {
  "Multi Color": "bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500",
  Red: "bg-red-500",
  Pink: "bg-pink-400",
  "Light Pink": "bg-pink-200 border border-border",
  "Hot Pink": "bg-pink-500",
  "Rose Pink": "bg-rose-400",
  Blue: "bg-blue-500",
  "Sky Blue": "bg-sky-300",
  "Light Blue": "bg-blue-200 border border-border",
  "Royal Blue": "bg-blue-700",
  "Powder Blue": "bg-sky-200 border border-border",
  Green: "bg-emerald-500",
  "Light Green": "bg-green-200 border border-border",
  "Sea Green": "bg-emerald-600",
  "Lime Green": "bg-lime-500",
  "Forest Green": "bg-green-800",
  Yellow: "bg-yellow-400",
  "Light Yellow": "bg-yellow-200 border border-border",
  "Lemon Yellow": "bg-yellow-300 border border-border",
  Black: "bg-slate-900",
  Maroon: "bg-red-900",
  Gold: "bg-yellow-700",
  Silver: "bg-gray-400",
  White: "bg-white border border-border",
  Purple: "bg-violet-500",
  "Light Purple": "bg-violet-200 border border-border",
  Lilac: "bg-purple-200 border border-border",
  Orange: "bg-orange-500",
  "Burnt Orange": "bg-orange-700",
  Brown: "bg-amber-900",
  "Dark Brown": "bg-stone-800",
  "Coffee Brown": "bg-amber-800",
  "Chocolate Brown": "bg-amber-950",
  Tan: "bg-amber-300 border border-border",
  Camel: "bg-amber-400",
  Beige: "bg-amber-100 border border-border",
  Cream: "bg-amber-50 border border-border",
  Ivory: "bg-stone-100 border border-border",
  Grey: "bg-neutral-400",
  "Light Grey": "bg-neutral-200 border border-border",
  Charcoal: "bg-zinc-700",
  Navy: "bg-blue-900",
  Teal: "bg-teal-500",
  Turquoise: "bg-cyan-400",
  Aqua: "bg-cyan-300",
  Cyan: "bg-cyan-500",
  Mint: "bg-emerald-300",
  Olive: "bg-lime-700",
  Peach: "bg-orange-200 border border-border",
  "Light Peach": "bg-orange-100 border border-border",
  Coral: "bg-rose-400",
  Lavender: "bg-purple-300",
  Magenta: "bg-fuchsia-600",
  Mustard: "bg-amber-500",
  Rust: "bg-orange-700",
  Wine: "bg-rose-900",
  Burgundy: "bg-red-950",
  Plum: "bg-purple-800",
  Mauve: "bg-rose-300 border border-border",
  Periwinkle: "bg-indigo-200 border border-border",
  Champagne: "bg-yellow-100 border border-border",
  "Rose Gold": "bg-rose-300",
  Copper: "bg-orange-800",
  "Off White": "bg-stone-50 border border-border",
  Nude: "bg-orange-100 border border-border",
  Khaki: "bg-lime-300 border border-border",
  Emerald: "bg-emerald-700",
  "Sage Green": "bg-green-300 border border-border",
  "Mint Green": "bg-emerald-200 border border-border",
  "Pastel Pink": "bg-pink-100 border border-border",
  "Pastel Blue": "bg-sky-100 border border-border",
  "Pastel Green": "bg-green-100 border border-border",
  "Pastel Yellow": "bg-yellow-100 border border-border",
};

const COLOR_SEARCH_TERMS: Record<string, string[]> = {
  Yellow: ["haldi", "sunshine", "day wedding", "turmeric ceremony"],
  Green: ["mehndi", "henna", "garden", "day function"],
  Orange: ["haldi", "mehndi", "festive day"],
  Gold: ["wedding", "bridal", "festive", "celebration"],
  Red: ["bridal", "wedding", "ceremony", "shaadi"],
  Maroon: ["bridal", "wedding", "reception"],
  Pink: ["engagement", "day party", "bridesmaid"],
  Blue: ["cocktail", "sangeet", "evening", "afterparty"],
  Purple: ["sangeet", "cocktail", "night event"],
  Black: ["cocktail", "reception", "party", "evening glam"],
  Silver: ["reception", "cocktail", "night glam"],
  White: ["engagement", "brunch", "minimal", "day event"],
};

const SIZE_SEARCH_TERMS: Record<string, string[]> = {
  XS: ["extra small", "petite", "slim fit"],
  S: ["small", "slim"],
  M: ["medium", "regular fit"],
  L: ["large", "relaxed fit"],
  XL: ["extra large", "roomy"],
  XXL: ["double xl", "plus"],
  "3XL": ["triple xl", "curve", "plus size"],
  "4XL": ["extended size", "curve", "plus size"],
  "Free Size": ["free size", "adjustable", "draped"],
};

const schema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().max(2000).optional(),
  size: z.string().min(1, "Size is required"),
  originalPrice: z.coerce.number().positive("Original price must be a positive number"),
  price: z.coerce.number().positive("Price must be a positive number"),
  category: z.string().min(1, "Category is required"),
  color: z.string().min(2, "Color is required"),
  images: z.array(z.instanceof(File)).min(1, "At least 1 image required").max(6, "Maximum 6 images allowed"),
}).refine((data) => data.originalPrice >= data.price, {
  message: "Original price must be greater than or equal to rental price",
  path: ["originalPrice"],
});

type FirstListingFormInput = z.input<typeof schema>;
type FirstListingFormOutput = z.output<typeof schema>;

export default function FirstListing() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<FirstListingFormInput, undefined, FirstListingFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      size: "",
      originalPrice: undefined,
      price: undefined,
      category: "",
      color: "",
      images: [],
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("size", data.size);
      formData.append("originalPrice", data.originalPrice.toString());
      formData.append("price", data.price.toString());
      formData.append("category", data.category);
      formData.append("color", data.color);
      data.images.forEach((file: string | Blob) => formData.append("images", file));

      const res = await completeFirstListingAction(formData);
      if (res.success) {
        toast.success("Listing published! Your seller account is now active.");
        router.replace("/provider/dashboard");
      } else {
        toast.error(res.message || "Failed to publish listing");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, () => {
    toast.error("Please fix the highlighted form errors");
  });

  return (
    <div className="flex justify-center ">
          <Card className="border-foreground w-full max-w-150 bg-white">
    
      <CardHeader>
        <CardTitle className="text-xl">Add Your First Product Listing</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <Label>Product Title *</Label>
            <Input {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div>
            <Label>Product Description</Label>
            <Textarea
              {...form.register("description")}
              rows={4}
              placeholder="Describe fit, embroidery, style, and ideal occasions"
            />
            {form.formState.errors.description && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>
          <div>
            <Label>Original Price (₹) *</Label>
            <Input type="number" {...form.register("originalPrice", { valueAsNumber: true })} />
            {form.formState.errors.originalPrice && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.originalPrice.message}</p>
            )}
          </div>
          <div>
            <Label>Rental Price (₹) *</Label>
            <Input type="number" {...form.register("price", { valueAsNumber: true })} />
            {form.formState.errors.price && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.price.message}</p>
            )}
          </div>
          <div>
            <CustomSelect
              label="Size *"
              searchable
              searchPlaceholder="Search sizes..."
              options={[
                { value: "", label: "Select size" },
                ...RENTAL_SIZE_OPTIONS.map((size) => ({ 
                  value: size, 
                  label: size,
                  searchTerms: SIZE_SEARCH_TERMS[size],
                })),
              ]}
              {...form.register("size")}
            />
            {form.formState.errors.size && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.size.message}</p>
            )}
          </div>
          <div>
            <CustomSelect
              label="Category *"
              searchable
              searchPlaceholder="Search categories..."
              options={[
                { value: "", label: "Select category" },
                ...RENTAL_CATEGORY_OPTIONS.map((category) => ({
                  value: category.label,
                  label: category.label,
                  searchTerms: category.aliases,
                })),
              ]}
              {...form.register("category")}
            />
            {form.formState.errors.category && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.category.message}</p>
            )}
          </div>
          <div>
            <CustomSelect
              label="Color *"
              searchable
              showColorSwatch
              searchPlaceholder="Search colors..."
              options={[
                { value: "", label: "Select color" },
                ...RENTAL_COLOR_OPTIONS.map((color) => ({ 
                  value: color, 
                  label: color,
                  swatchClass: COLOR_SWATCH_MAP[color] ?? COLOR_SWATCH_MAP["Multi Color"],
                  searchTerms: COLOR_SEARCH_TERMS[color],
                })),
              ]}
              {...form.register("color")}
            />
            {form.formState.errors.color && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.color.message}</p>
            )}
          </div>
          <div>
            <Label>Images * (1-6 photos recommended) </Label>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                const currentImages = form.getValues("images") || [];
                const newFiles = Array.from(e.target.files || []);
                const allImages = [...currentImages, ...newFiles];
                
                // Limit to max 6 images
                if (allImages.length > 6) {
                  toast.error("Maximum 6 images allowed");
                  return;
                }
                
                form.setValue("images", allImages, { shouldValidate: true });
                // Reset file input to allow re-selecting same file
                e.target.value = "";
              }}
            />
            {form.formState.errors.images && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.images.message}</p>
            )}
            {form.watch("images")?.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-green-600 text-sm">
                  ✓ {form.watch("images").length} image(s) selected
                </p>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {form.watch("images").map((file, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-20 object-cover rounded border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updatedImages = form.getValues("images").filter((_, i) => i !== idx);
                          form.setValue("images", updatedImages, { shouldValidate: true });
                        }}
                        className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button type="submit" className="w-full px-2" disabled={isLoading}>
            {isLoading ? "Publishing..." : "Activate your Seller Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
    </div>
  );
}