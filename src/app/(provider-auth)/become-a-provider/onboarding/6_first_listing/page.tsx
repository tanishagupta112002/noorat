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
import { completeFirstListingAction, getOnboardingStatus } from "../_actions/onboarding-actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  images: z.array(z.instanceof(File)).min(1, "At least 1 image required"),
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

  useEffect(() => {
    let active = true;

    async function checkStep() {
      const { nextStep } = await getOnboardingStatus();
      if (!active) return;
      if (nextStep !== "/become-a-provider/onboarding/6_first_listing") {
        router.replace(nextStep);
      }
    }

    void checkStep();

    return () => {
      active = false;
    };
  }, [router]);

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
        router.push("/provider/dashboard");
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
            <Label>Images * (at least 1)</Label>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => form.setValue("images", Array.from(e.target.files || []), { shouldValidate: true })}
            />
            {form.formState.errors.images && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.images.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Publishing..." : "Publish First Listing & Activate Seller Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
    </div>
  );
}