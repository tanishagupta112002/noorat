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

const schema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  fabric: z.string().min(2, "Fabric must be at least 2 characters"),
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
      fabric: "",
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
      formData.append("fabric", data.fabric);
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
            <Label>Fabric Type*</Label>
            <Textarea {...form.register("fabric")} rows={3} />
            {form.formState.errors.fabric && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.fabric.message}</p>
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
              options={[
                { value: "", label: "Select size" },
                ...RENTAL_SIZE_OPTIONS.map((size) => ({ value: size, label: size })),
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
              options={[
                { value: "", label: "Select category" },
                ...RENTAL_CATEGORY_OPTIONS.map((category) => ({
                  value: category.label,
                  label: category.label,
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
              options={[
                { value: "", label: "Select color" },
                ...RENTAL_COLOR_OPTIONS.map((color) => ({ value: color, label: color })),
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