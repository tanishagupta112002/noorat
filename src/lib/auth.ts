// // src/lib/auth.ts
// import { betterAuth } from 'better-auth';
// import { prismaAdapter } from 'better-auth/adapters/prisma';

// import { prisma } from './prisma';

// export const auth = betterAuth({
//   database: prismaAdapter(prisma, {
//     provider: 'postgresql',
//   }),

//   emailAndPassword: {
//     enabled: true,
//     requireEmailVerification: true,
//   },

//   callbacks: {
//     session: async ({ session, user }: { session: any; user: any }) => {
//       session.user.phone = user.phone;
//       return session;
//     },
//     async signIn({ user }: { user: any }) {

//       if (!user.isActive) {
//         throw new Error("Account is deactivated");
//       }

//       return true;
//     },
//   },


//   socialProviders: {
//     google: {
//       clientId: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//       redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
//     },
//   },


//   // Warning fix
//   baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
// });


// src/lib/auth.ts
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';
import type { User, Session } from "better-auth";  // ← Import these!

function env(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : undefined;
}

const authBaseUrl =
  env("BETTER_AUTH_URL") || env("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";

const normalizedAuthBaseUrl = authBaseUrl.replace(/\/$/, "");

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  socialProviders: {
    google: {
      clientId: env("GOOGLE_CLIENT_ID")!,
      clientSecret: env("GOOGLE_CLIENT_SECRET")!,
      redirectURI: `${normalizedAuthBaseUrl}/api/auth/callback/google`,
    },
  },

  baseURL: normalizedAuthBaseUrl,

  callbacks: {
    async session({ session, user }: { session: Session; user: User }) {
      // Now TS knows exactly what session and user look like
      if (user) {
        session.user.id = user.id;
        session.user.name = user.name;
        session.user.email = user.email;
        session.user.role = user.role;
        session.user.phone = user.phone;
        session.user.alternative_mobile_number = user.alternative_mobile_number;
        session.user.address = user.address;
        session.user.city = user.city;
        session.user.state = user.state;
        session.user.pincode = user.pincode;
        session.user.dob = user.dob;
        session.user.isActive = user.isActive;
        // Add any other fields you need in the session
      }

      return session;
    },

    async signIn({ user }: { user: User }) {
      if (!user.isActive) {
        throw new Error("Account is deactivated");
      }
      return true;
    },

    // Optional: If using JWT (default in many cases), add this too
    async jwt({ token, user }: { token: any; user?: User }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        // ... other fields you want in JWT
      }
      return token;
    },
  },
});