import { prisma } from "@/lib/prisma";

export type CheckoutAddress = {
  name?: string;
  addressLine: string;
  city?: string;
  state?: string;
  pincode: string;
};

export type CheckoutPaymentMethod = "UPI" | "CARD" | "COD";

const PLATFORM_FEE = 20;
const DELIVERY_FEE = 30;
const SECURITY_AMOUNT_PER_ITEM = 1000;

type CheckoutCartItem = {
  listingId: string;
  quantity: number;
  listing: {
    id: string;
    price: number;
    status: boolean;
    providerId: string;
  };
};

export function normalizePaymentMethod(input: unknown): CheckoutPaymentMethod | null {
  const value = String(input || "").trim().toUpperCase();
  if (value === "UPI" || value === "CARD" || value === "COD") {
    return value;
  }

  return null;
}

export function isValidAddress(input: unknown): input is CheckoutAddress {
  if (!input || typeof input !== "object") return false;
  const addr = input as Partial<CheckoutAddress>;

  return (
    typeof addr.addressLine === "string" &&
    addr.addressLine.trim().length > 0 &&
    typeof addr.pincode === "string" &&
    /^\d{6}$/.test(addr.pincode.trim())
  );
}

export async function getValidatedCheckoutCart(userId: string) {
  const cartItems = (await prisma.cartItem.findMany({
    where: { userId },
    select: {
      listingId: true,
      quantity: true,
      listing: {
        select: {
          id: true,
          price: true,
          status: true,
          providerId: true,
        },
      },
    },
  })) as CheckoutCartItem[];

  if (cartItems.length === 0) {
    return { ok: false as const, error: "Your cart is empty" };
  }

  const invalidItem = cartItems.find(
    (item) => !item.listing?.id || !item.listing?.status || !item.listing?.providerId
  );

  if (invalidItem) {
    return { ok: false as const, error: "One or more cart items are unavailable" };
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.listing.price) * item.quantity,
    0
  );
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const securityAmount = totalQuantity * SECURITY_AMOUNT_PER_ITEM;
  const total = subtotal + PLATFORM_FEE + DELIVERY_FEE + securityAmount;

  return {
    ok: true as const,
    items: cartItems,
    subtotal,
    totalQuantity,
    total,
    amountInPaise: Math.round(total * 100),
  };
}

export async function createOrdersAndClearCart(params: {
  userId: string;
  items: CheckoutCartItem[];
}) {
  const { userId, items } = params;

  const ordersCreated = await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await tx.order.create({
        data: {
          listingId: item.listing.id,
          userId,
          providerId: item.listing.providerId,
          quantity: item.quantity,
          total: Number(item.listing.price) * item.quantity,
          status: "PENDING",
        },
      });
    }

    await tx.cartItem.deleteMany({
      where: { userId },
    });

    return items.length;
  });

  return ordersCreated;
}
