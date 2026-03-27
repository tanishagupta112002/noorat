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
import { useEffect, useState } from "react";
import { submitIdentityAction, getOnboardingStatus } from "../_actions/onboarding-actions";
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

  useEffect(() => {
    let active = true;

    async function checkStep() {
      const { nextStep } = await getOnboardingStatus();
      if (!active) return;
      if (nextStep !== "/become-a-provider/onboarding/2_identity_verification") {
        router.replace(nextStep);
      }
    }

    void checkStep();

    return () => {
      active = false;
    };
  }, [router]);

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
    <div className="flex justify-center">
      <Card className="border-foreground w-full max-w-150 bg-white">
        <CardHeader>
          <CardTitle className="text-xl">Identity Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <Label>PAN Number *</Label>
              <Input
                {...form.register("panNumber")}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  form.setValue("panNumber", value, { shouldValidate: true });
                }}
                placeholder="ABCDE1234F"
              />
              {form.formState.errors.panNumber && (
                <p className="mt-1 text-sm text-red-500">{form.formState.errors.panNumber.message}</p>
              )}
            </div>

            <div>
              <Label>GST Number (optional for small sellers)</Label>
              <Input
                {...form.register("gstNumber")}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  form.setValue("gstNumber", value, { shouldValidate: true });
                }}
                placeholder="22AAAAA0000A1Z5"
              />
            </div>

            <div>
              <Label>Upload ID Proof (Aadhaar / Voter ID / Passport)</Label>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setIdDocument(e.target.files?.[0] ?? null)}
              />
            </div>

            {serverError && <p className="text-sm text-red-500">{serverError}</p>}

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