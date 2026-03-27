"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function deleteAccount() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { success: false };
  }

  // delete sessions first
  await prisma.session.deleteMany({
    where: {
      userId: session.user.id,
    },
  });

  // delete user
  await prisma.user.delete({
    where: {
      id: session.user.id,
    },
  });

  return { success: true };
}