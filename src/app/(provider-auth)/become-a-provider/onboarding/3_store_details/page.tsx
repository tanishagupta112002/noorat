// 3_store_details/page.tsx
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
import {
  submitStoreDetailsAction,
} from "../_actions/onboarding-actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const schema = z.object({
  businessName: z
    .string()
    .min(3, "Business name must be at least 3 characters"),
  description: z.string().optional(),
  providerType: z.enum(["BOUTIQUE", "RENTAL"]),
});

export default function StoreDetails() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { providerType: "BOUTIQUE" },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      setIsLoading(true);
      const res = await submitStoreDetailsAction(data);
      if (res.success) {
        toast.success("Store details saved successfully!");
        router.push("/become-a-provider/onboarding/4_pickup_address");
      } else {
        toast.error("Failed to save store details");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <div className="flex justify-center">
      <Card className="border-foreground w-full max-w-150 bg-white">
        <CardHeader>
          <CardTitle className="text-xl">Store / Business Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <CustomSelect
                label="Type"
                containerClassName="mt-2"
                options={[
                  { value: "", label: "Select your business type" },
                  { value: "BOUTIQUE", label: "Boutique" },
                  { value: "RENTAL", label: "Rental Service" },
                ]}
                {...form.register("providerType")}
              />

              {form.formState.errors.providerType && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.providerType.message}
                </p>
              )}
            </div>
            <div>
              <Label>Business / Boutique Name *</Label>
              <Input {...form.register("businessName")} />
              {form.formState.errors.businessName && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.businessName.message}
                </p>
              )}
            </div>

            <div>
              <Label>Description (optional)</Label>
              <Textarea {...form.register("description")} rows={4} />
              {form.formState.errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save & Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
