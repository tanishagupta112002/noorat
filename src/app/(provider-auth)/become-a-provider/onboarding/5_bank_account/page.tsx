// 5_bank_account/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { submitBankDetailsAction } from "../_actions/onboarding-actions";
import { useRouter } from "next/navigation";

const schema = z.object({
  bankAccountNumber: z.string().min(9).max(18),
  bankIfsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC"),
  bankAccountName: z.string().min(3),
});

export default function BankDetails() {
  const router = useRouter();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = form.handleSubmit(async (data) => {
    const res = await submitBankDetailsAction(data);
    if (res.success) router.push("/become-a-provider/onboarding/6_first_listing");
  });

  return (
    <div className="flex justify-center ">
      <Card className="border-foreground w-full max-w-150 bg-white">
      <CardHeader>
        <CardTitle className="text-xl">Bank Account Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <Label>Account Holder Name *</Label>
            <Input {...form.register("bankAccountName")} />
          </div>
          <div>
            <Label>Account Number *</Label>
            <Input {...form.register("bankAccountNumber")} />
          </div>
          <div>
            <Label>IFSC Code *</Label>
            <Input {...form.register("bankIfsc")} placeholder="SBIN0001234" />
          </div>
          <Button type="submit" className="w-full">Save & Continue</Button>
        </form>
      </CardContent>
    </Card>
    </div>
  );
}