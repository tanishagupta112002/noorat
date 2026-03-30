"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InviteInfo = {
  email: string;
  fullName: string;
  phone: string | null;
  expiresAt: string;
};

function DeliveryRegisterContent() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenFromQuery = useMemo(() => params.get("token") ?? "", [params]);

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [inviteCode, setInviteCode] = useState(tokenFromQuery);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);

  const validateInvite = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Invite code is required");
      setValidated(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/delivery/invite/validate?token=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setInvite(null);
        setError(data.error || "Invalid invite code");
        setValidated(true);
        return;
      }

      setInvite(data.invite);
      setValidated(true);
      setInviteCode(trimmed);
    } catch {
      setInvite(null);
      setError("Could not validate invite");
      setValidated(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    if (tokenFromQuery) {
      void (async () => {
        if (isCancelled) return;
        await validateInvite(tokenFromQuery);
      })();
    } else {
      setValidated(false);
      setInvite(null);
    }

    return () => {
      isCancelled = true;
    };
  }, [tokenFromQuery]);

  const handleRegister = async () => {
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/delivery/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: inviteCode.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Registration failed");
        return;
      }

      const params = new URLSearchParams({
        email: data.email,
        registered: "1",
      });
      if (data.existingAccount) {
        params.set("existing", "1");
      }

      router.replace(`/delivery-auth/login?${params.toString()}`);
    } catch {
      setError("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
      <div className="w-full rounded-2xl border border-border/70 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Delivery Partner Registration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This page is invite-only. Enter your invite code from admin to continue.
        </p>

        {!validated ? (
          <div className="mt-4 space-y-3">
            <div>
              <Label>Invite code</Label>
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Paste invite code"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button className="w-full" onClick={() => void validateInvite(inviteCode)} disabled={loading}>
              {loading ? "Validating..." : "Validate Invite"}
            </Button>
          </div>
        ) : error && !invite ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <div>
              <Label>Invite code</Label>
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Paste invite code"
              />
            </div>
            <Button className="w-full" onClick={() => void validateInvite(inviteCode)} disabled={loading}>
              {loading ? "Validating..." : "Try Again"}
            </Button>
          </div>
        ) : invite ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-muted/30 p-3 text-sm">
              <p><span className="font-medium">Name:</span> {invite.fullName}</p>
              <p><span className="font-medium">Email:</span> {invite.email}</p>
              <p><span className="font-medium">Phone:</span> {invite.phone || "Not set"}</p>
            </div>

            <div>
              <Label>Create password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>
            <div>
              <Label>Confirm password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button className="w-full" onClick={handleRegister} disabled={loading}>
              {loading ? "Creating account..." : "Complete Registration"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function DeliveryRegisterPage() {
  return (
    <Suspense fallback={null}>
      <DeliveryRegisterContent />
    </Suspense>
  );
}
