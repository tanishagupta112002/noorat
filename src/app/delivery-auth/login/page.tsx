"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function DeliveryLoginContent() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNewlyRegistered = params.get("registered") === "1";
  const isExistingAccountLinked = params.get("existing") === "1";

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/delivery/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Login failed");
        return;
      }

      const accessRes = await fetch("/api/delivery/access", { cache: "no-store" });
      const accessData = await accessRes.json();

      if (!accessData?.canAccessDeliveryMode) {
        await fetch("/api/delivery/logout", { method: "POST" });
        setError("This account is not approved for delivery panel");
        return;
      }

      router.replace("/delivery/dashboard");
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
      <div className="w-full rounded-2xl border border-border/70 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Delivery Partner Login</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Access is only for hired and invited delivery staff.
        </p>

        {isNewlyRegistered ? (
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {isExistingAccountLinked
              ? "Invite accepted. Login with your delivery password."
              : "Registration complete. Login with your invited email."}
          </p>
        ) : null}

        <div className="mt-4 space-y-3">
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryLoginPage() {
  return (
    <Suspense fallback={null}>
      <DeliveryLoginContent />
    </Suspense>
  );
}
