import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  createOrdersAndClearCart,
  getValidatedCheckoutCart,
  isValidAddress,
  normalizePaymentMethod,
} from "@/lib/payments/checkout";
import { getRazorpayClient, getRazorpayConfig } from "@/lib/payments/razorpay";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const paymentMethod = normalizePaymentMethod(body?.paymentMethod);
    const deliveryAddress = body?.deliveryAddress;

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

    const cart = await getValidatedCheckoutCart(session.user.id);
    if (!cart.ok) {
      return Response.json({ success: false, error: cart.error }, { status: 400 });
    }

    if (paymentMethod === "COD") {
      const ordersCreated = await createOrdersAndClearCart({
        userId: session.user.id,
        items: cart.items,
      });

      return Response.json({
        success: true,
        mode: "COD_COMPLETED",
        ordersCreated,
      });
    }

    let razorpay;
    let keyId: string;

    try {
      razorpay = getRazorpayClient();
      ({ keyId } = getRazorpayConfig());
    } catch {
      return Response.json(
        {
          success: false,
          error: "Online payment is not configured. Please set Razorpay keys in environment.",
          code: "RAZORPAY_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: cart.amountInPaise,
      currency: "INR",
      receipt: `tt_${Date.now()}_${session.user.id.slice(0, 8)}`,
      notes: {
        userId: session.user.id,
        paymentMethod,
      },
    });

    return Response.json({
      success: true,
      mode: "ONLINE_PENDING",
      paymentMethod,
      razorpay: {
        keyId,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "noorat",
        description: "Rental order payment",
        prefill: {
          name: session.user.name || "",
          email: session.user.email || "",
        },
      },
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
