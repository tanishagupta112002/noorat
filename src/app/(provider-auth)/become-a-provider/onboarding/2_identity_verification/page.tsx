// 2_identity_verification/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitIdentityAction } from "../_actions/onboarding-actions";
import { Loader2 } from "lucide-react";

const schema = z.object({
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN"),
  gstNumber: z.string().optional(),
});

export default function IdentityVerification() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [idDocument, setIdDocument] = useState<File | null>(null);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      panNumber: "",
      gstNumber: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    setLoading(true);
    setServerError(null);

    const formData = new FormData();
    formData.append("panNumber", data.panNumber.toUpperCase().trim());
    if (data.gstNumber) formData.append("gstNumber", data.gstNumber);
    if (idDocument) formData.append("idDocument", idDocument);

    try {
      const res = await submitIdentityAction(formData);
      if (res.success) {
        router.push("/become-a-provider/onboarding/3_store_details");
        return;
      }

      setServerError(res.message || "Failed to save identity details");
    } catch {
      setServerError("Something went wrong while saving identity details");
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="flex w-full justify-center px-0 sm:px-4">
      <Card className="border-foreground w-full max-w-md bg-white sm:max-w-2xl md:max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Identity Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4 md:space-y-6">
            <div className="space-y-2">
              <Label className="text-sm md:text-base">PAN Number *</Label>
              <Input
                {...form.register("panNumber")}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  form.setValue("panNumber", value, { shouldValidate: true });
                }}
                placeholder="ABCDE1234F"
                className="text-base md:text-sm"
              />
              {form.formState.errors.panNumber && (
                <p className="text-xs text-red-500 md:text-sm">{form.formState.errors.panNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm md:text-base">GST Number (optional for small sellers)</Label>
              <Input
                {...form.register("gstNumber")}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  form.setValue("gstNumber", value, { shouldValidate: true });
                }}
                placeholder="22AAAAA0000A1Z5"
                className="text-base md:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm md:text-base">Upload ID Proof (Aadhaar / Voter ID / Passport)</Label>
              <Input
                type="file"
                accept="image/*,.pdf"
                className="cursor-pointer text-sm md:text-base"
                onChange={(e) => setIdDocument(e.target.files?.[0] ?? null)}
              />
              {idDocument && (
                <p className="text-xs text-green-600 md:text-sm">
                  ✓ File selected: {idDocument.name}
                </p>
              )}
              <p className="text-xs text-gray-500 md:text-sm">
                Max 5MB • Formats: PDF, JPG, PNG, WEBP
              </p>
            </div>

            {serverError && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 md:text-sm">
                ⚠ {serverError}
              </div>
            )}

            <Button type="submit" className="h-11 w-full text-sm md:text-base" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save & Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}