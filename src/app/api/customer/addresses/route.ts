import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const db = prisma as any;
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true },
    });

    const addresses = await db.customerAddress.findMany({
      where: { userId: session.user.id },
      orderBy: { isDefault: "desc" },
      select: {
        id: true,
        name: true,
        label: true,
        addressLine: true,
        city: true,
        state: true,
        pincode: true,
        isDefault: true,
      },
    });

    return Response.json({
      success: true,
      phone: user?.phone || "",
      addresses: addresses.map((addr: any) => ({
        id: addr.id,
        name: addr.name || "Saved Address",
        label: addr.label || "OTHER",
        addressLine: addr.addressLine,
        city: addr.city || "",
        state: addr.state || "",
        pincode: addr.pincode,
        isDefault: addr.isDefault,
      })),
    });
  } catch (err) {
    const message =
      process.env.NODE_ENV !== "production" && err instanceof Error
        ? err.message
        : "Unable to fetch addresses";

    return Response.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
