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

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  plugins: [
    emailOTPClient(),
    inferAdditionalFields<typeof auth>(), // ← this infers your custom User/Session fields on client
  ],
});