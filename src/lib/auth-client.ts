// // src/lib/auth-client.ts
// import { createAuthClient } from "better-auth/react";
// import { emailOTPClient } from "better-auth/client/plugins"

// export const authClient = createAuthClient({
//   baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
//   plugins: [
//         emailOTPClient() 
//     ]
// });


// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { inferAdditionalFields } from "better-auth/client/plugins"; // ← important!
import { auth } from "./auth";

const clientBaseUrl =
  (typeof process.env.NEXT_PUBLIC_APP_URL === "string"
    ? process.env.NEXT_PUBLIC_APP_URL.trim()
    : "") || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: clientBaseUrl,

  plugins: [
    emailOTPClient(),
    inferAdditionalFields<typeof auth>(), // ← this infers your custom User/Session fields on client
  ],
});