import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getListingsAvailability } from "@/lib/rental-availability";
import { InventoryManager } from "../../_components/inventory-manager";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProviderInventoryItemPage({ params }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect("/auth?redirect=/provider/inventory");
  }

  const providerProfile = await prisma.providerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!providerProfile) {
    redirect("/become-a-provider/onboarding");
  }

  const { id } = await params;

  const listing = (await prisma.listing.findFirst({
    where: {
      id,
      providerId: providerProfile.id,
    },
    select: {
      id: true,
      title: true,
      Fabric: true,
      size: true,
      images: true,
      category: true,
      color: true,
      originalPrice: true,
      price: true,
      status: true,
      stockQuantity: true,
      createdAt: true,
      updatedAt: true,
    },
  } as any)) as
    | {
        id: string;
        title: string;
        Fabric: string;
        size: string;
        images: string[];
        category: string;
        color?: string | null;
        originalPrice: number;
        price: number;
        status: boolean;
        stockQuantity: number;
        createdAt: Date;
        updatedAt: Date;
      }
    | null;

  if (!listing) {
    notFound();
  }

  const availabilityMap = await getListingsAvailability([listing.id]);

  return (
    <div className="space-y-4">
      <Link
        href="/provider/inventory"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to listings
      </Link>

      <InventoryManager
        initialListings={[
          {
            id: listing.id,
            title: listing.title,
            fabric: listing.Fabric,
            size: listing.size,
            images: listing.images,
            category: listing.category,
            color: listing.color || "Assorted",
            originalPrice: listing.originalPrice,
            price: listing.price,
            status: listing.status,
            stockQuantity: listing.stockQuantity ?? 1,
            createdAt: listing.createdAt.toISOString(),
            updatedAt: listing.updatedAt.toISOString(),
            activeOrderCount: availabilityMap[listing.id]?.activeCount ?? 0,
            nextAvailableAt: availabilityMap[listing.id]?.nextAvailableAt?.toISOString() ?? null,
          },
        ]}
      />
    </div>
  );
}
