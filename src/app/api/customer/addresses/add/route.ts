import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeText(value: string | null | undefined) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function addressSignature(address: {
  addressLine: string;
  city?: string | null;
  state?: string | null;
  pincode: string;
}) {
  return [
    normalizeText(address.addressLine),
    normalizeText(address.city),
    normalizeText(address.state),
    (address.pincode || "").replace(/\D/g, "").slice(0, 6),
  ].join("|");
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, label, addressLine, city, state, pincode } = body;

    if (!addressLine || !pincode) {
      return Response.json(
        { success: false, error: "Address line and pincode are required" },
        { status: 400 }
      );
    }

    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      return Response.json(
        { success: false, error: "Invalid pincode" },
        { status: 400 }
      );
    }

    const db = prisma as any;
    const normalizedAddress = {
      addressLine: String(addressLine || "").trim(),
      city: String(city || "").trim(),
      state: String(state || "").trim(),
      pincode: String(pincode || "").replace(/\D/g, "").slice(0, 6),
    };

    const existingAddresses = await db.customerAddress.findMany({
      where: {
        userId: session.user.id,
        pincode: normalizedAddress.pincode,
      },
      select: {
        id: true,
        name: true,
        label: true,
        addressLine: true,
        city: true,
        state: true,
        pincode: true,
      },
    });

    const incomingSignature = addressSignature(normalizedAddress);
    const duplicateAddress = existingAddresses.find(
      (item: any) =>
        addressSignature({
          addressLine: item.addressLine,
          city: item.city,
          state: item.state,
          pincode: item.pincode,
        }) === incomingSignature,
    );

    if (duplicateAddress) {
      return Response.json({
        success: true,
        duplicate: true,
        address: {
          id: duplicateAddress.id,
          name: duplicateAddress.name || "Saved Address",
          label: duplicateAddress.label || "OTHER",
          addressLine: duplicateAddress.addressLine,
          city: duplicateAddress.city || "",
          state: duplicateAddress.state || "",
          pincode: duplicateAddress.pincode,
        },
      });
    }

    const address = await db.customerAddress.create({
      data: {
        userId: session.user.id,
        name: name || "Saved Address",
        label: label || "OTHER",
        addressLine: normalizedAddress.addressLine,
        city: normalizedAddress.city || null,
        state: normalizedAddress.state || null,
        pincode: normalizedAddress.pincode,
        isDefault: false,
      },
      select: {
        id: true,
        name: true,
        label: true,
        addressLine: true,
        city: true,
        state: true,
        pincode: true,
      },
    });

    return Response.json({
      success: true,
      address,
    });
  } catch (err) {
    const message =
      process.env.NODE_ENV !== "production" && err instanceof Error
        ? err.message
        : "Unable to save address";

    return Response.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
