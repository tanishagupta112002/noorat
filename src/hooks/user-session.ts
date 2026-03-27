// C:\Users\Tanisha Gupta\OneDrive\Desktop\noorat\src\hooks\user-session.ts
"use client";

import { authClient } from "@/lib/auth-client";

export function useSession() {
  const { data, isPending, refetch } = authClient.useSession();

  return {
    session: data,
    loading: isPending,
    refetch,
  };
}