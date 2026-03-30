// src/app/(provider-auth)/provider/onboarding/4_pickup_address/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { submitPickupAddressAction } from "../_actions/onboarding-actions";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { RENTAL_CITY_OPTIONS } from "@/lib/rental-listing-options";

const schema = z.object({
  address: z.string().min(10, "Please enter a complete address"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "PIN code must be 6 digits"),
});

type FormData = z.infer<typeof schema>;

export default function PickupAddress() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      address: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("address", data.address);
    formData.append("city", data.city);
    formData.append("state", data.state);
    formData.append("pincode", data.pincode);

    try {
      const result = await submitPickupAddressAction(formData);
      if (result.success) {
        router.push("/become-a-provider/onboarding/5_bank_account");
      } else {
        setError("Failed to save pickup address. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="flex justify-center ">
      <Card className="border-foreground w-full max-w-150 bg-white">
    
      <CardHeader>
        <CardTitle className="text-xl">Pickup Address</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Note: This is where your orders will be picked up from. Make sure it's accurate.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <Label>Full Address *</Label>
            <Textarea 
              placeholder="House no, Street name, Area, Landmark" 
              rows={3}
              {...form.register("address")} 
            />
            {form.formState.errors.address && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>City *</Label>
              <Input {...form.register("city")} placeholder="e.g. Guna" list="provider-city-options" />
              <datalist id="provider-city-options">
                {RENTAL_CITY_OPTIONS.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
              {form.formState.errors.city && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.city.message}</p>
              )}
            </div>

            <div>
              <Label>State *</Label>
              <Input {...form.register("state")} placeholder="e.g. Madhya Pradesh" />
              {form.formState.errors.state && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.state.message}</p>
              )}
            </div>

            <div>
              <Label>PIN Code *</Label>
              <Input 
                maxLength={6} 
                {...form.register("pincode")} 
                placeholder="473001" 
              />
              {form.formState.errors.pincode && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.pincode.message}</p>
              )}
            </div>
          </div>

          {error && <p className="text-red-500 text-center">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save & Continue
          </Button>
        </form>
      </CardContent>
    </Card>
    </div>
  );
}