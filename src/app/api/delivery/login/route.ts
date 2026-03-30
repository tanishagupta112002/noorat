import * as argon2 from "argon2";
import { prisma } from "@/lib/prisma";
import { createDeliverySession } from "@/lib/delivery-auth";

export async function POST(req: Request) {
  const db = prisma as any;
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return Response.json(
        { success: false, error: "Email and password are required" },
        { status: 400 },
      );
    }

    const deliveryPartner = await db.deliveryPartnerProfile.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
        status: true,
      },
    });

    if (!deliveryPartner) {
      return Response.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    const validPassword = await argon2.verify(deliveryPartner.passwordHash, password);
    if (!validPassword) {
      return Response.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    if (deliveryPartner.status !== "ACTIVE") {
      return Response.json(
        { success: false, error: "This delivery account is not active" },
        { status: 403 },
      );
    }

    await createDeliverySession(deliveryPartner.id);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delivery login error:", error);
    return Response.json({ success: false, error: "Login failed" }, { status: 500 });
  }
}
