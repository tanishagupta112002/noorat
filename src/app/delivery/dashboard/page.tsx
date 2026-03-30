import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDeliveryPartner } from "@/lib/delivery-auth";
import { DeliveryTaskSummaryList } from "../_components/delivery-task-summary-list";

export default async function DeliveryDashboardPage() {
  const deliverySession = await getCurrentDeliveryPartner();

  if (!deliverySession?.deliveryPartner?.id) {
    redirect("/delivery-auth/login");
  }

  const me = deliverySession.deliveryPartner;

  if (me.status !== "ACTIVE") {
    redirect("/delivery-auth/login");
  }

  const db = prisma as any;

  const tasks = await db.deliveryTask.findMany({
    where: { deliveryPartnerId: me.id },
    orderBy: { updatedAt: "desc" },
    take: 40,
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

  const serialized = tasks.map((task) => ({
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
  }));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="mb-5 rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Delivery Workspace</p>
        <h1 className="text-2xl font-semibold text-foreground">Welcome, {me.fullName || "Delivery Partner"}</h1>
        <p className="text-sm text-muted-foreground">Employee ID: {me.employeeCode}</p>
      </div>

      <DeliveryTaskSummaryList tasks={serialized} />
    </div>
  );
}
