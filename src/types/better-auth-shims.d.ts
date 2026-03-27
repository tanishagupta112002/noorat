declare module "better-auth" {
  export type User = {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
    phone?: string | null;
    alternative_mobile_number?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    dob?: Date | null;
    isActive?: boolean;
    [key: string]: unknown;
  };

  export type Session = {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      role?: string;
      phone?: string | null;
      alternative_mobile_number?: string | null;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      pincode?: string | null;
      dob?: Date | null;
      isActive?: boolean;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };

  export function betterAuth(options: Record<string, unknown>): any;
}

declare module "better-auth/adapters/prisma" {
  export function prismaAdapter(prisma: unknown, options?: Record<string, unknown>): any;
}

declare module "better-auth/react" {
  export function createAuthClient(options: Record<string, unknown>): any;
}

declare module "better-auth/client/plugins" {
  export function emailOTPClient(options?: Record<string, unknown>): any;
  export function inferAdditionalFields<T>(): any;
}
