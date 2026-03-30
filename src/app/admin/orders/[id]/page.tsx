import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listDeliveryAssignmentHistory } from "@/lib/admin-assignment-history";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const db = prisma as any;

  const [order, history] = await Promise.all([
    db.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        quantity: true,
        total: true,
        createdAt: true,
        acceptedAt: true,
        shippedAt: true,
        deliveredToCustomerAt: true,
        pickedUpFromCustomerAt: true,
        returnedToProviderAt: true,
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
            category: true,
            size: true,
            color: true,
            price: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            city: true,
            state: true,
            pincode: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        deliveryTask: {
          select: {
            stage: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
            deliveryPartner: {
              select: {
                id: true,
                fullName: true,
                email: true,
                employeeCode: true,
                phone: true,
                status: true,
              },
            },
          },
        },
      },
    }),
    listDeliveryAssignmentHistory({ orderId: id, take: 40 }),
  ]);

  if (!order) {
    notFound();
  }

  const providerName =
    order.provider.businessName || order.provider.user.name || order.provider.user.email;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/order-assign" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Back to order assign
        </Link>
        <h2 className="mt-2 text-xl font-semibold text-foreground">Order {order.id}</h2>
        <p className="text-sm text-muted-foreground">
          Listing: {order.listing.title} | Status: {order.status}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-foreground">Customer</h3>
          <p className="mt-2 text-sm text-foreground">{order.user.name || order.user.email}</p>
          <p className="text-sm text-muted-foreground">{order.user.email}</p>
          <p className="text-sm text-muted-foreground">{order.user.phone || "No phone"}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Delivery address: {order.deliveryName || "-"}, {order.deliveryAddressLine || "-"}, {order.deliveryCity || "-"}, {order.deliveryState || "-"}, {order.deliveryPincode || "-"}
          </p>
        </section>

        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-foreground">Provider</h3>
          <p className="mt-2 text-sm text-foreground">{providerName}</p>
          <p className="text-sm text-muted-foreground">{order.provider.user.email}</p>
          <p className="text-sm text-muted-foreground">{order.provider.phone || "No phone"}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            City: {order.provider.city || "-"}, State: {order.provider.state || "-"}, Pincode: {order.provider.pincode || "-"}
          </p>
        </section>

        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-foreground">Delivery Agent</h3>
          {order.deliveryTask?.deliveryPartner ? (
            <>
              <p className="mt-2 text-sm text-foreground">{order.deliveryTask.deliveryPartner.fullName}</p>
              <p className="text-sm text-muted-foreground">{order.deliveryTask.deliveryPartner.email}</p>
              <p className="text-sm text-muted-foreground">{order.deliveryTask.deliveryPartner.phone || "No phone"}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Code: {order.deliveryTask.deliveryPartner.employeeCode} | Status: {order.deliveryTask.deliveryPartner.status}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Stage: {order.deliveryTask.stage}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No delivery partner assigned.</p>
          )}
        </section>
      </div>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-foreground">Order Timeline</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div className="rounded-xl border p-3">Created: {formatDate(order.createdAt)}</div>
          <div className="rounded-xl border p-3">Accepted: {formatDate(order.acceptedAt)}</div>
          <div className="rounded-xl border p-3">Shipped: {formatDate(order.shippedAt)}</div>
          <div className="rounded-xl border p-3">Delivered: {formatDate(order.deliveredToCustomerAt)}</div>
          <div className="rounded-xl border p-3">Picked for Return: {formatDate(order.pickedUpFromCustomerAt)}</div>
          <div className="rounded-xl border p-3">Returned to Provider: {formatDate(order.returnedToProviderAt)}</div>
          <div className="rounded-xl border p-3">Completed: {formatDate(order.completedAt)}</div>
          <div className="rounded-xl border p-3">Cancelled: {formatDate(order.cancelledAt)}</div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-foreground">Assignment History</h3>
        <div className="mt-3 space-y-2">
          {history.length === 0 ? (
            <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">No assignment history found.</p>
          ) : (
            history.map((entry) => (
              <div key={`${entry.orderId}-${entry.loggedAt.toISOString()}`} className="rounded-xl border p-3 text-sm">
                <p className="font-medium text-foreground">{entry.action} by {entry.assignedByAdminName}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.loggedAt).toLocaleString("en-IN")} | Agent: {entry.previousDeliveryPartnerName || entry.previousDeliveryPartnerEmail || "-"} to {entry.deliveryPartnerName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Provider: {entry.providerName} ({entry.providerPhone || "No phone"})
                </p>
                <p className="text-xs text-muted-foreground">
                  Customer: {entry.customerName} ({entry.customerPhone || "No phone"})
                </p>
                <p className="text-xs text-muted-foreground">
                  Delivery: {entry.deliveryPartnerName} ({entry.deliveryPartnerPhone || "No phone"})
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
