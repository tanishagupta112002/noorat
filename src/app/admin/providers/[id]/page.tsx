import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function AdminProviderDetailPage({ params }: PageProps) {
  const db = prisma as any;
  const { id } = await params;

  const provider = await db.providerProfile.findUnique({
    where: { id },
    select: {
      id: true,
      businessName: true,
      phone: true,
      alternate_phone: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
      description: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      listings: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          title: true,
          status: true,
          stockQuantity: true,
          price: true,
          createdAt: true,
        },
      },
      providerOrders: {
        orderBy: {
          createdAt: "desc",
        },
        take: 15,
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
          deliveryTask: {
            select: {
              deliveryPartner: {
                select: {
                  fullName: true,
                  phone: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!provider) {
    notFound();
  }

  const providerName = provider.businessName || provider.user.name || provider.user.email;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/providers" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Back to providers
        </Link>
        <h2 className="mt-2 text-xl font-semibold text-foreground">Provider Detail</h2>
      </div>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-foreground">Profile & Contact</h3>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <p>Name: <span className="font-medium">{providerName}</span></p>
          <p>Email: <span className="font-medium">{provider.user.email}</span></p>
          <p className={provider.phone ? "" : "text-red-600"}>Provider phone: <span className="font-medium">{provider.phone || "Missing"}</span></p>
          <p>User phone: <span className="font-medium">{provider.user.phone || "-"}</span></p>
          <p>Alternate phone: <span className="font-medium">{provider.alternate_phone || "-"}</span></p>
          <p>Joined: <span className="font-medium">{formatDate(provider.createdAt)}</span></p>
          <p className="sm:col-span-2">Address: <span className="font-medium">{provider.address || "-"}, {provider.city || "-"}, {provider.state || "-"}, {provider.pincode || "-"}</span></p>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-foreground">Listings</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-225 w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {provider.listings.map((listing: any) => (
                <tr key={listing.id} className="border-t">
                  <td className="px-3 py-2 text-foreground">{listing.title}</td>
                  <td className="px-3 py-2 text-muted-foreground">{listing.status ? "Active" : "Paused"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{listing.stockQuantity}</td>
                  <td className="px-3 py-2 text-muted-foreground">Rs. {Math.round(listing.price)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{listing.createdAt.toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-foreground">Recent Orders</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-225 w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Delivery Agent</th>
                <th className="px-3 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {provider.providerOrders.map((order: any) => (
                <tr key={order.id} className="border-t">
                  <td className="px-3 py-2 text-muted-foreground">{order.id.slice(0, 8)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{order.status}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    <p>{order.user.name || order.user.email}</p>
                    <p className="text-xs">{order.user.phone || "No phone"}</p>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {order.deliveryTask?.deliveryPartner ? (
                      <>
                        <p>{order.deliveryTask.deliveryPartner.fullName}</p>
                        <p className="text-xs">{order.deliveryTask.deliveryPartner.phone || "No phone"}</p>
                      </>
                    ) : (
                      <p>Not assigned</p>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">Rs. {Math.round(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
