import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getListingsAvailability } from "@/lib/rental-availability";
import { OrdersList } from "../../_components/orders-list";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProviderOrderDetailPage({ params }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect("/auth?redirect=/provider/orders");
  }

  const providerProfile = await prisma.providerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!providerProfile) {
    redirect("/become-a-provider/onboarding");
  }

  const { id } = await params;
  const db = prisma as any;

  const order = await db.order.findFirst({
    where: {
      id,
      providerId: providerProfile.id,
    },
    select: {
      id: true,
      quantity: true,
      total: true,
      status: true,
      deliveryTask: {
        select: {
          stage: true,
        },
      },
      deliveryName: true,
      deliveryAddressLine: true,
      deliveryCity: true,
      deliveryState: true,
      deliveryPincode: true,
      createdAt: true,
      rentalStartDate: true,
      rentalEndDate: true,
      expectedReturnDate: true,
      acceptedAt: true,
      shippedAt: true,
      pickedUpFromProviderAt: true,
      deliveredToCustomerAt: true,
      pickedUpFromCustomerAt: true,
      returnedToProviderAt: true,
      completedAt: true,
      cancelledAt: true,
      listing: {
        select: {
          id: true,
          title: true,
          size: true,
          category: true,
          images: true,
          stockQuantity: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const availabilityMap = await getListingsAvailability([String(order.listing.id)]);

  const serialized = {
    id: order.id,
    quantity: order.quantity,
    total: order.total,
    status: order.status,
    deliveryTaskStage: order.deliveryTask?.stage ?? null,
    deliveryName: order.deliveryName,
    deliveryAddressLine: order.deliveryAddressLine,
    deliveryCity: order.deliveryCity,
    deliveryState: order.deliveryState,
    deliveryPincode: order.deliveryPincode,
    createdAt: order.createdAt.toISOString(),
    rentalStartDate: order.rentalStartDate?.toISOString() ?? null,
    rentalEndDate: order.rentalEndDate?.toISOString() ?? null,
    expectedReturnDate: order.expectedReturnDate?.toISOString() ?? null,
    acceptedAt: order.acceptedAt?.toISOString() ?? null,
    shippedAt: order.shippedAt?.toISOString() ?? null,
    pickedUpFromProviderAt: order.pickedUpFromProviderAt?.toISOString() ?? null,
    deliveredToCustomerAt: order.deliveredToCustomerAt?.toISOString() ?? null,
    pickedUpFromCustomerAt: order.pickedUpFromCustomerAt?.toISOString() ?? null,
    returnedToProviderAt: order.returnedToProviderAt?.toISOString() ?? null,
    completedAt: order.completedAt?.toISOString() ?? null,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    listing: order.listing,
    user: order.user,
    availability: {
      activeCount: availabilityMap[order.listing.id]?.activeCount ?? 0,
      nextAvailableAt: availabilityMap[order.listing.id]?.nextAvailableAt?.toISOString() ?? null,
    },
  };

  return (
    <div className="space-y-4">
      <Link
        href="/provider/orders"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <OrdersList orders={[serialized]} />
    </div>
  );
}
