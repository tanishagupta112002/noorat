import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  createOrdersAndClearCart,
  getValidatedCheckoutCart,
  isValidAddress,
  isValidPhone,
  normalizePaymentMethod,
} from "@/lib/payments/checkout";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const paymentMethod = normalizePaymentMethod(body?.paymentMethod);
    const deliveryAddress = body?.deliveryAddress;
    const phone = body?.phone;

    if (!paymentMethod) {
      return Response.json(
        { success: false, error: "Please select a valid payment method" },
        { status: 400 }
      );
    }

    if (!isValidAddress(deliveryAddress)) {
      return Response.json(
        { success: false, error: "Please confirm a valid delivery address" },
        { status: 400 }
      );
    }

    if (!isValidPhone({ phone })) {
      return Response.json(
        { success: false, error: "Please provide a valid phone number" },
        { status: 400 }
      );
    }

    const cart = await getValidatedCheckoutCart(session.user.id);
    if (!cart.ok) {
      return Response.json({ success: false, error: cart.error }, { status: 400 });
    }

    const ordersCreated = await createOrdersAndClearCart({
      userId: session.user.id,
      items: cart.items,
      deliveryAddress,
      phone,
    });

    return Response.json({
      success: true,
      mode: paymentMethod === "COD" ? "COD_COMPLETED" : "QR_COMPLETED",
      paymentMethod,
      ordersCreated,
    });
  } catch (err) {
    const message =
      process.env.NODE_ENV !== "production" && err instanceof Error
        ? err.message
        : "Unable to initiate checkout. Please try again.";

    return Response.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
