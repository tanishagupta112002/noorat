"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function BecomeProviderRedirect() {

  const router = useRouter();

  useEffect(() => {

    async function checkSession() {

      const session = await authClient.getSession();

      if (!session.data) {
        router.replace("/auth?redirect=/become-a-provider/onboarding");
      } else {
        router.replace("/become-a-provider/onboarding");
      }

    }

    checkSession();

  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Redirecting...</p>
    </div>
  );
}