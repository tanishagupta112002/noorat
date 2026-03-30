import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN";
};

export async function requireAdminUser(): Promise<AdminUser> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect("/auth");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: "ADMIN",
  };
}

export async function requireAdminUserOrThrow(): Promise<AdminUser> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user || user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: "ADMIN",
  };
}
