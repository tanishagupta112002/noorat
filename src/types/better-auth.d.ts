// import "better-auth";

// declare module "better-auth" {

//   interface User {
//     phone?: string | null;
//     alternative_mobile_number?: string | null;
//     address?: string | null;
//     city?: string | null;
//     state?: string | null;
//     pincode?: string | null;
//     dob?: Date | null;
//     role?: "CUSTOMER" | "PROVIDER" | "ADMIN";

//   }

//   interface Session {
//     user: {
//       phone?: string | null;
//       alternative_mobile_number?: string | null;
//       address?: string | null;
//       city?: string | null;
//       state?: string | null;
//       pincode?: string | null;
//       dob?: Date | null;
//       role?: "CUSTOMER" | "PROVIDER" | "ADMIN";
//     };
//   }

// }


// src/types/better-auth.d.ts   

import type { User as BaseUser, Session as BaseSession } from "better-auth";

declare module "better-auth" {
  interface User extends BaseUser {
    // Extend with your Prisma User fields (id is already in BaseUser, but make explicit)
    id: string;
    name?: string | null;
    email: string;
    role: "CUSTOMER" | "PROVIDER" | "ADMIN";
    phone?: string | null;
    alternative_mobile_number?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    dob?: Date | null;
    isActive: boolean;
    // ... add any others you use often
  }

  // Extend Session so session.user has all these fields
  interface Session extends BaseSession {
    user: User;  // ← this makes session.user inherit all the extended User fields
  }
}