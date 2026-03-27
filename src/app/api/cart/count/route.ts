import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return Response.json({ count: 0 }, { status: 200 });
  }

  const count = await prisma.cartItem.count({
    where: { userId: session.user.id },
  });

  return Response.json({ count });
}
