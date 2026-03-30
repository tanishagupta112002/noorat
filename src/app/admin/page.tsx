import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { listDeliveryAssignmentHistory } from "@/lib/admin-assignment-history";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function AdminDashboardPage() {
  const db = prisma as any;

  const [
    totalOrders,
    activeOrders,
    completedOrders,
    cancelledOrders,
    unassignedAcceptedOrders,
    totalProviders,
    totalCustomers,
    totalDeliveryPartners,
    activeDeliveryPartners,
    suspendedDeliveryPartners,
    openDeliveryTasks,
    recentOrders,
    assignmentHistory,
  ] = await Promise.all([
    db.order.count(),
    db.order.count({ where: { status: { in: ["ACCEPTED", "SHIPPED", "WITH_CUSTOMER", "RETURNED"] } } }),
    db.order.count({ where: { status: "COMPLETED" } }),
    db.order.count({ where: { status: "CANCELLED" } }),
    db.order.count({ where: { status: "ACCEPTED", deliveryTask: null } }),
    db.providerProfile.count(),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.deliveryPartnerProfile.count(),
    db.deliveryPartnerProfile.count({ where: { status: "ACTIVE" } }),
    db.deliveryPartnerProfile.count({ where: { status: "SUSPENDED" } }),
    db.deliveryTask.count({ where: { stage: { not: "CLOSED" } } }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        listing: { select: { title: true } },
        user: { select: { name: true, email: true } },
        provider: {
          select: {
            businessName: true,
            user: { select: { name: true, email: true } },
          },
        },
        deliveryTask: {
          select: {
            stage: true,
            deliveryPartner: {
              select: {
                fullName: true,
                employeeCode: true,
              },
            },
          },
        },
      },
    }),
    listDeliveryAssignmentHistory({ take: 8 }),
  ]);

  const cards = [
    { label: "Total Orders", value: totalOrders, hint: `${activeOrders} active now` },
    { label: "Unassigned Orders", value: unassignedAcceptedOrders, hint: "Need delivery assignment" },
    { label: "Open Delivery Tasks", value: openDeliveryTasks, hint: "Not yet closed" },
    { label: "Delivery Partners", value: totalDeliveryPartners, hint: `${activeDeliveryPartners} active, ${suspendedDeliveryPartners} suspended` },
    { label: "Providers", value: totalProviders, hint: "Registered providers" },
    { label: "Customers", value: totalCustomers, hint: "Registered customers" },
    { label: "Completed Orders", value: completedOrders, hint: "Successfully finished" },
    { label: "Cancelled Orders", value: cancelledOrders, hint: "Cancelled by customer/provider" },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
            <Link href="/admin/order-assign" className="text-sm font-medium text-foreground underline-offset-4 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {recentOrders.length === 0 ? (
              <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No orders found.</p>
            ) : (
              recentOrders.map((order: any) => {
                const providerName =
                  order.provider.businessName || order.provider.user.name || order.provider.user.email;
                const customerName = order.user.name || order.user.email;

                return (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="block rounded-xl border p-3 transition hover:bg-muted/30"
                  >
                    <p className="text-sm font-medium text-foreground">{order.listing.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Order {order.id.slice(0, 8)} | {order.status} | Rs. {Math.round(order.total)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Provider: {providerName}</p>
                    <p className="text-xs text-muted-foreground">Customer: {customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      Delivery: {order.deliveryTask?.deliveryPartner?.fullName || "Not assigned"}
                    </p>
                  </Link>
                );
              })
            )}
          </div>
        </article>

        <article className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Latest Assignment Activity</h2>
            <Link
              href="/admin/order-assign"
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {assignmentHistory.length === 0 ? (
              <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                No assignment activity yet.
              </p>
            ) : (
              assignmentHistory.map((entry) => (
                <div key={`${entry.orderId}-${entry.loggedAt.toISOString()}`} className="rounded-xl border p-3">
                  <p className="text-sm font-medium text-foreground">
                    {entry.action === "REASSIGNED" ? "Reassigned" : "Assigned"} | Order {entry.orderId.slice(0, 8)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Listing: {entry.listingTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    Agent: {entry.previousDeliveryPartnerName || entry.previousDeliveryPartnerEmail || "-"} to {entry.deliveryPartnerName}
                  </p>
                  <p className="text-xs text-muted-foreground">By: {entry.assignedByAdminName}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(entry.loggedAt)}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-2 text-sm sm:grid-cols-3">
        <Link href="/admin/order-assign" className="rounded-xl border bg-white px-4 py-3 font-medium shadow-sm hover:bg-muted/30">
          Manage Order Assignments
        </Link>
        <Link href="/admin/customers" className="rounded-xl border bg-white px-4 py-3 font-medium shadow-sm hover:bg-muted/30">
          Manage Customers
        </Link>
        <Link href="/admin/providers" className="rounded-xl border bg-white px-4 py-3 font-medium shadow-sm hover:bg-muted/30">
          Manage Providers
        </Link>
      </section>
    </div>
  );
}
