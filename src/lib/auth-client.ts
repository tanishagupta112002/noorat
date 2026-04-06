// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { inferAdditionalFields } from "better-auth/client/plugins"; // ← important!
import { auth } from "./auth";

const envClientBaseUrl =
  (typeof process.env.NEXT_PUBLIC_APP_URL === "string"
    ? process.env.NEXT_PUBLIC_APP_URL.trim()
    : "") || "http://localhost:3000";

// Always prefer same-origin in browser to avoid cross-domain auth latency/timeouts.
const clientBaseUrl =
  typeof window !== "undefined" ? window.location.origin : envClientBaseUrl;

export const authClient = createAuthClient({
  baseURL: clientBaseUrl,

  plugins: [
    emailOTPClient(),
    inferAdditionalFields<typeof auth>(), // ← this infers your custom User/Session fields on client
  ],
});