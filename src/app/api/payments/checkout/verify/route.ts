import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  createOrdersAndClearCart,
  getValidatedCheckoutCart,
  isValidAddress,
  normalizePaymentMethod,
} from "@/lib/payments/checkout";
import { getRazorpayClient, verifyRazorpaySignature } from "@/lib/payments/razorpay";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const razorpayOrderId = String(body?.razorpayOrderId || "").trim();
    const razorpayPaymentId = String(body?.razorpayPaymentId || "").trim();
    const razorpaySignature = String(body?.razorpaySignature || "").trim();
    const paymentMethod = normalizePaymentMethod(body?.paymentMethod);
    const deliveryAddress = body?.deliveryAddress;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return Response.json(
        { success: false, error: "Missing payment verification details" },
        { status: 400 }
      );
    }

    if (paymentMethod !== "UPI" && paymentMethod !== "CARD") {
      return Response.json(
        { success: false, error: "Invalid online payment method" },
        { status: 400 }
      );
    }

    if (!isValidAddress(deliveryAddress)) {
      return Response.json(
        { success: false, error: "Please confirm a valid delivery address" },
        { status: 400 }
      );
    }

    let validSignature = false;

    try {
      validSignature = verifyRazorpaySignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });
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

    if (!validSignature) {
      return Response.json(
        { success: false, error: "Payment signature verification failed" },
        { status: 400 }
      );
    }

    let razorpay;

    try {
      razorpay = getRazorpayClient();
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
    const payment = await razorpay.payments.fetch(razorpayPaymentId);

    if (payment.order_id !== razorpayOrderId) {
      return Response.json(
        { success: false, error: "Payment order mismatch" },
        { status: 400 }
      );
    }

    if (payment.status !== "captured" && payment.status !== "authorized") {
      return Response.json(
        { success: false, error: "Payment is not completed yet" },
        { status: 400 }
      );
    }

    const cart = await getValidatedCheckoutCart(session.user.id);
    if (!cart.ok) {
      return Response.json({ success: false, error: cart.error }, { status: 400 });
    }

    const paidAmount = Number(payment.amount);
    if (!Number.isFinite(paidAmount)) {
      return Response.json(
        { success: false, error: "Unable to read paid amount" },
        { status: 400 }
      );
    }

    if (paidAmount < cart.amountInPaise) {
      return Response.json(
        { success: false, error: "Paid amount is less than checkout total" },
        { status: 400 }
      );
    }

    const ordersCreated = await createOrdersAndClearCart({
      userId: session.user.id,
      items: cart.items,
    });

    return Response.json({
      success: true,
      mode: "ONLINE_COMPLETED",
      paymentMethod,
      ordersCreated,
      razorpayPaymentId,
    });
  } catch {
    return Response.json(
      { success: false, error: "Unable to verify payment. Please contact support if amount was deducted." },
      { status: 500 }
    );
  }
}
