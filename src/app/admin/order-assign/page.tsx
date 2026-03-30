import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminOrdersTable } from "../orders/_components/admin-orders-table";
import { AdminAssignBlock } from "./_components/admin-assign-block";

const PAGE_SIZE = 40;

function parsePage(value: string | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

type PageProps = {
  searchParams?: Promise<{ page?: string }>;
};

export default async function AdminOrderAssignPage({ searchParams }: PageProps) {
  const db = prisma as any;
  const resolvedSearchParams = (await searchParams) || {};
  const page = parsePage(resolvedSearchParams.page);
  const skip = (page - 1) * PAGE_SIZE;

  const [orders, partners, totalOrders, unassignedOrders] = await Promise.all([
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        status: true,
        createdAt: true,
        listing: { select: { title: true } },
        user: { select: { name: true, email: true, phone: true } },
        provider: {
          select: {
            businessName: true,
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
            deliveryPartnerId: true,
            deliveryPartner: {
              select: {
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    }),
    db.deliveryPartnerProfile.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        employeeCode: true,
      },
    }),
    db.order.count(),
    db.order.findMany({
      where: {
        status: "ACCEPTED",
        deliveryTask: null,
      },
      orderBy: { createdAt: "asc" },
      take: 80,
      select: {
        id: true,
        status: true,
        listing: { select: { title: true } },
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const rows = orders.map((order: any) => {
    const providerName =
      order.provider.businessName || order.provider.user.name || order.provider.user.email;

    return {
      id: order.id,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      listingTitle: order.listing.title,
      providerName,
      customerName: order.user.name || order.user.email,
      customerEmail: order.user.email,
      customerPhone: order.user.phone || null,
      deliveryPartnerId: order.deliveryTask?.deliveryPartnerId || null,
      deliveryPartnerName: order.deliveryTask?.deliveryPartner?.fullName || null,
      deliveryPartnerPhone: order.deliveryTask?.deliveryPartner?.phone || null,
      deliveryStage: order.deliveryTask?.stage || null,
      hasDeliveryTask: !!order.deliveryTask,
    };
  });

  const unassignedRows = (unassignedOrders as any[]).map((order) => ({
    id: order.id,
    status: order.status,
    listingTitle: order.listing.title,
    customerName: order.user.name || order.user.email,
  }));

  // Filter to show only assigned orders in the table
  const assignedRows = rows.filter((row) => row.deliveryPartnerId);

  const totalPages = Math.max(1, Math.ceil(totalOrders / PAGE_SIZE));
  const nextPage = Math.min(totalPages, page + 1);
  const prevPage = Math.max(1, page - 1);

  return (
    <div className="space-y-4">
      <AdminAssignBlock partners={partners} unassignedOrders={unassignedRows} />

      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Order Assign</h2>
          <p className="text-sm text-muted-foreground">
            Manage assigned orders and reassign delivery partners if needed.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing {assignedRows.length} of {totalOrders} | Page {page}/{totalPages} | Active partners: {partners.length}
        </p>
      </div>

      {assignedRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-muted-foreground">
          Not assigned yet. Use the Quick Assign box above to assign delivery partners to new orders.
        </div>
      ) : (
        <AdminOrdersTable orders={assignedRows} partners={partners} />
      )}

      <div className="flex items-center justify-end gap-2">
        <Link
          href={`/admin/order-assign?page=${prevPage}`}
          className={`rounded-md border px-3 py-1.5 text-sm ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
        >
          Previous
        </Link>
        <Link
          href={`/admin/order-assign?page=${nextPage}`}
          className={`rounded-md border px-3 py-1.5 text-sm ${page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
        >
          Next
        </Link>
      </div>

    </div>
  );
}
