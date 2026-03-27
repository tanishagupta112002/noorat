import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { providerType, shopName, city } = await req.json();

  // upsert: safe to call multiple times (e.g. user retries)
  await prisma.providerProfile.upsert({
    where: { userId: session.user.id },
    update: {
      providerType,
      businessName: shopName,
      city,
    },
    create: {
      userId: session.user.id,
      providerType,
      businessName: shopName,
      phone: "",   // placeholder – set properly at step 1
      city,
    },
  });

  return Response.json({ success: true });
}