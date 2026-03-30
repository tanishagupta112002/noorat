import { prisma } from "@/lib/prisma";
import { calculateRentalDates, TOTAL_CYCLE_DAYS, getDaysUntilDate } from "@/lib/rental-helpers";
import { CLOSED_STATUSES, getActiveOrderReleaseSchedule } from "@/lib/rental-availability";

export type CheckoutAddress = {
  name?: string;
  label?: string;
  addressLine: string;
  city?: string;
  state?: string;
  pincode: string;
};

export type CheckoutPhone = {
  phone: string;
};

export type CheckoutPaymentMethod = "QR_UPI" | "COD";

const PLATFORM_FEE = 20;
const DELIVERY_FEE = 30;
const SECURITY_AMOUNT_PER_ITEM = 1000;

type CheckoutCartItem = {
  listingId: string;
  quantity: number;
  listing: {
    id: string;
    title: string;
    price: number;
    status: boolean;
    providerId: string;
    stockQuantity: number;
  };
};

export function normalizePaymentMethod(input: unknown): CheckoutPaymentMethod | null {
  const value = String(input || "").trim().toUpperCase();
  if (value === "COD") {
    return value;
  }

  // Backward compatibility: treat legacy UPI selections as manual QR UPI.
  if (value === "QR_UPI" || value === "UPI") {
    return "QR_UPI";
  }

  return null;
}

export function isValidPhone(input: unknown): input is CheckoutPhone {
  if (!input || typeof input !== "object") return false;
  const p = input as Partial<CheckoutPhone>;
  // Indian phone: 10 digits or +91 format
  const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
  return typeof p.phone === "string" && phoneRegex.test(p.phone.replace(/\D/g, ""));
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
          title: true,
          price: true,
          status: true,
          providerId: true,
          stockQuantity: true,
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

  const activeOrderSchedule = await getActiveOrderReleaseSchedule(
    cartItems.map((item) => item.listing.id),
  );

  // Check real-time availability (prevent overbooking)
  for (const item of cartItems) {
    const activeOrders = activeOrderSchedule[item.listing.id] ?? [];

    const activeUnits = activeOrders.reduce((sum, order) => sum + order.quantity, 0);
    const available = item.listing.stockQuantity - activeUnits;

    if (available < item.quantity) {
      const shortageUnits = item.quantity - Math.max(0, available);

      let released = 0;
      let targetReleaseDate: Date | null = null;

      for (const slot of activeOrders) {
        released += slot.quantity;
        if (released >= shortageUnits) {
          targetReleaseDate = slot.releaseAt;
          break;
        }
      }

      const daysUntilAvailable = targetReleaseDate
        ? getDaysUntilDate(targetReleaseDate)
        : TOTAL_CYCLE_DAYS;

      const unitWord = item.quantity === 1 ? "unit" : "units";
      const errorMsg = `"${item.listing.title}" is not available for ${item.quantity} ${unitWord} now. You can order after ${daysUntilAvailable} day${daysUntilAvailable === 1 ? "" : "s"}.`;

      return { ok: false as const, error: errorMsg };
    }
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
  deliveryAddress: CheckoutAddress;
  phone: string;
}) {
  const { userId, items, deliveryAddress, phone } = params;

  const normalizedAddress: CheckoutAddress = {
    name: typeof deliveryAddress.name === "string" ? deliveryAddress.name.trim() : "",
    label: typeof deliveryAddress.label === "string" ? deliveryAddress.label.trim() : "",
    addressLine: deliveryAddress.addressLine.trim(),
    city: typeof deliveryAddress.city === "string" ? deliveryAddress.city.trim() : "",
    state: typeof deliveryAddress.state === "string" ? deliveryAddress.state.trim() : "",
    pincode: deliveryAddress.pincode.trim(),
  };

  const normalizedPhone = phone.replace(/\D/g, "").slice(-10); // Extract last 10 digits

  const normalizedAddressSignature = [
    normalizedAddress.addressLine.trim().toLowerCase().replace(/\s+/g, " "),
    (normalizedAddress.city || "").trim().toLowerCase().replace(/\s+/g, " "),
    (normalizedAddress.state || "").trim().toLowerCase().replace(/\s+/g, " "),
    normalizedAddress.pincode.replace(/\D/g, "").slice(0, 6),
  ].join("|");

  const ordersCreated = await prisma.$transaction(async (tx: any) => {
    // Update customer phone
    await tx.user.update({
      where: { id: userId },
      data: { phone: normalizedPhone },
    });

    // Keep customer addresses in DB and mark the latest selected address as default.
    await tx.customerAddress.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    const candidateAddresses = await tx.customerAddress.findMany({
      where: {
        userId,
        pincode: normalizedAddress.pincode,
      },
      select: {
        id: true,
        addressLine: true,
        city: true,
        state: true,
        pincode: true,
      },
    });

    const existingAddress = candidateAddresses.find((item: any) => {
      const signature = [
        String(item.addressLine || "").trim().toLowerCase().replace(/\s+/g, " "),
        String(item.city || "").trim().toLowerCase().replace(/\s+/g, " "),
        String(item.state || "").trim().toLowerCase().replace(/\s+/g, " "),
        String(item.pincode || "").replace(/\D/g, "").slice(0, 6),
      ].join("|");

      return signature === normalizedAddressSignature;
    });

    if (existingAddress) {
      await tx.customerAddress.update({
        where: { id: existingAddress.id },
        data: {
          label: normalizedAddress.label || null,
          name: normalizedAddress.name || null,
          isDefault: true,
        },
      });
    } else {
      await tx.customerAddress.create({
        data: {
          userId,
          label: normalizedAddress.label || null,
          name: normalizedAddress.name || null,
          addressLine: normalizedAddress.addressLine,
          city: normalizedAddress.city || null,
          state: normalizedAddress.state || null,
          pincode: normalizedAddress.pincode,
          isDefault: true,
        },
      });
    }

    const activeUnitsRows = await tx.order.groupBy({
      by: ["listingId"],
      where: {
        listingId: { in: items.map((item) => item.listing.id) },
        status: { notIn: [...CLOSED_STATUSES] },
      },
      _sum: { quantity: true },
    });

    const activeUnitsByListing = new Map<string, number>(
      activeUnitsRows.map((row: { listingId: string; _sum: { quantity: number | null } }) => [
        row.listingId,
        Math.max(0, row._sum.quantity ?? 0),
      ]),
    );

    for (const item of items) {
      // Re-check availability inside the transaction to prevent race conditions
      const activeUnits = activeUnitsByListing.get(item.listing.id) ?? 0;
      if (activeUnits + item.quantity > item.listing.stockQuantity) {
        throw new Error(
          `"${item.listing.title}" was just booked by someone else. Please remove it from your cart and try again.`,
        );
      }

      activeUnitsByListing.set(item.listing.id, activeUnits + item.quantity);

      const { rentalStartDate, rentalEndDate, expectedReturnDate } =
        calculateRentalDates(new Date());

      await tx.order.create({
        data: {
          listingId: item.listing.id,
          userId,
          providerId: item.listing.providerId,
          quantity: item.quantity,
          total: Number(item.listing.price) * item.quantity,
          status: "PENDING",
          deliveryName: normalizedAddress.name || null,
          deliveryAddressLine: normalizedAddress.addressLine,
          deliveryCity: normalizedAddress.city || null,
          deliveryState: normalizedAddress.state || null,
          deliveryPincode: normalizedAddress.pincode,
          rentalStartDate,
          rentalEndDate,
          expectedReturnDate,
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
