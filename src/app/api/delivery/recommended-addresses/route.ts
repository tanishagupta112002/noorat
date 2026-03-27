import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RecommendedAddress = {
  source: "user-profile" | "provider-profile";
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
};

function normalizeText(value: string | null | undefined) {
  return (value || "").trim();
}

function toSignature(address: {
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
}) {
  return [
    normalizeText(address.addressLine).toLowerCase().replace(/\s+/g, " "),
    normalizeText(address.city).toLowerCase().replace(/\s+/g, " "),
    normalizeText(address.state).toLowerCase().replace(/\s+/g, " "),
    normalizeText(address.pincode).replace(/\D/g, "").slice(0, 6),
  ].join("|");
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return Response.json({ addresses: [] as RecommendedAddress[] });
  }

  const [user, provider] = await prisma.$transaction([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        address: true,
        city: true,
        state: true,
        pincode: true,
      },
    }),
    prisma.providerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        address: true,
        city: true,
        state: true,
        pincode: true,
      },
    }),
  ]);

  const rawAddresses: RecommendedAddress[] = [];

  if (user && (user.address || user.city || user.state || user.pincode)) {
    rawAddresses.push({
      source: "user-profile",
      addressLine: normalizeText(user.address),
      city: normalizeText(user.city),
      state: normalizeText(user.state),
      pincode: normalizeText(user.pincode).replace(/\D/g, "").slice(0, 6),
    });
  }

  if (provider && (provider.address || provider.city || provider.state || provider.pincode)) {
    rawAddresses.push({
      source: "provider-profile",
      addressLine: normalizeText(provider.address),
      city: normalizeText(provider.city),
      state: normalizeText(provider.state),
      pincode: normalizeText(provider.pincode).replace(/\D/g, "").slice(0, 6),
    });
  }

  const seen = new Set<string>();
  const addresses: RecommendedAddress[] = [];

  for (const item of rawAddresses) {
    if (!item.addressLine && !item.pincode) continue;
    const sig = toSignature(item);
    if (seen.has(sig)) continue;
    seen.add(sig);
    addresses.push(item);
  }

  return Response.json({ addresses });
}
