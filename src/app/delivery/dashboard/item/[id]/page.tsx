import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentDeliveryPartner } from "@/lib/delivery-auth";
import { DeliveryTaskBoard } from "../../../_components/delivery-task-board";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DeliveryTaskDetailPage({ params }: PageProps) {
  const deliverySession = await getCurrentDeliveryPartner();

  if (!deliverySession?.deliveryPartner?.id) {
    redirect("/delivery-auth/login");
  }

  const me = deliverySession.deliveryPartner;

  if (me.status !== "ACTIVE") {
    redirect("/delivery-auth/login");
  }

  const { id } = await params;
  const db = prisma as any;

  const task = await db.deliveryTask.findFirst({
    where: {
      id,
      deliveryPartnerId: me.id,
    },
    select: {
      id: true,
      stage: true,
      notes: true,
      order: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          acceptedAt: true,
          shippedAt: true,
          pickedUpFromProviderAt: true,
          deliveredToCustomerAt: true,
          pickedUpFromCustomerAt: true,
          returnedToProviderAt: true,
          rentalStartDate: true,
          rentalEndDate: true,
          expectedReturnDate: true,
          completedAt: true,
          cancelledAt: true,
          deliveryName: true,
          deliveryAddressLine: true,
          deliveryCity: true,
          deliveryState: true,
          deliveryPincode: true,
          listing: {
            select: {
              title: true,
              size: true,
              category: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
          provider: {
            select: {
              businessName: true,
              phone: true,
              address: true,
              city: true,
              state: true,
              pincode: true,
            },
          },
        },
      },
    },
  });

  if (!task) {
    notFound();
  }

  const serialized = {
    ...task,
    order: {
      ...task.order,
      createdAt: task.order.createdAt.toISOString(),
      acceptedAt: task.order.acceptedAt?.toISOString() ?? null,
      shippedAt: task.order.shippedAt?.toISOString() ?? null,
      pickedUpFromProviderAt: task.order.pickedUpFromProviderAt?.toISOString() ?? null,
      deliveredToCustomerAt: task.order.deliveredToCustomerAt?.toISOString() ?? null,
      pickedUpFromCustomerAt: task.order.pickedUpFromCustomerAt?.toISOString() ?? null,
      returnedToProviderAt: task.order.returnedToProviderAt?.toISOString() ?? null,
      rentalStartDate: task.order.rentalStartDate?.toISOString() ?? null,
      rentalEndDate: task.order.rentalEndDate?.toISOString() ?? null,
      expectedReturnDate: task.order.expectedReturnDate?.toISOString() ?? null,
      completedAt: task.order.completedAt?.toISOString() ?? null,
      cancelledAt: task.order.cancelledAt?.toISOString() ?? null,
    },
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-6">
      <Link
        href="/delivery/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to delivery dashboard
      </Link>

      <DeliveryTaskBoard tasks={[serialized]} />
    </div>
  );
}
