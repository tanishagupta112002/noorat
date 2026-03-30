import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  const db = prisma as any;
  const { id } = await params;

  const customer = await db.user.findFirst({
    where: {
      id,
      role: "CUSTOMER",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      state: true,
      pincode: true,
      createdAt: true,
      addresses: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          label: true,
          name: true,
          addressLine: true,
          city: true,
          state: true,
          pincode: true,
          isDefault: true,
        },
      },
      customerOrders: {
        orderBy: {
          createdAt: "desc",
        },
        take: 15,
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
          listing: {
            select: {
              title: true,
            },
          },
          provider: {
            select: {
              businessName: true,
              phone: true,
              user: {
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          },
          deliveryTask: {
            select: {
              deliveryPartner: {
                select: {
                  fullName: true,
                  phone: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/customers" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Back to customers
        </Link>
        <h2 className="mt-2 text-xl font-semibold text-foreground">Customer Detail</h2>
      </div>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-foreground">Profile & Contact</h3>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <p>Name: <span className="font-medium">{customer.name || "Unnamed"}</span></p>
          <p>Email: <span className="font-medium">{customer.email}</span></p>
          <p className={customer.phone ? "" : "text-red-600"}>Phone: <span className="font-medium">{customer.phone || "Missing"}</span></p>
          <p>Location: <span className="font-medium">{customer.city || "-"}, {customer.state || "-"}, {customer.pincode || "-"}</span></p>
          <p>Joined: <span className="font-medium">{customer.createdAt.toLocaleDateString("en-IN")}</span></p>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-foreground">Saved Addresses</h3>
        <div className="mt-3 space-y-2 text-sm">
          {customer.addresses.length === 0 ? (
            <p className="text-muted-foreground">No saved addresses.</p>
          ) : (
            customer.addresses.map((address: any) => (
              <div key={address.id} className="rounded-xl border p-3">
                <p className="font-medium text-foreground">
                  {address.label || "Address"} {address.isDefault ? "(Default)" : ""}
                </p>
                <p className="text-muted-foreground">{address.name || ""}</p>
                <p className="text-muted-foreground">
                  {address.addressLine}, {address.city || "-"}, {address.state || "-"}, {address.pincode}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-foreground">Orders</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-225 w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Listing</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Provider</th>
                <th className="px-3 py-2">Delivery Agent</th>
                <th className="px-3 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {customer.customerOrders.map((order: any) => {
                const providerName =
                  order.provider.businessName || order.provider.user.name || order.provider.user.email;

                return (
                  <tr key={order.id} className="border-t">
                    <td className="px-3 py-2 text-muted-foreground">{order.id.slice(0, 8)}</td>
                    <td className="px-3 py-2 text-foreground">{order.listing.title}</td>
                    <td className="px-3 py-2 text-muted-foreground">{order.status}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      <p>{providerName}</p>
                      <p className="text-xs">{order.provider.phone || "No phone"}</p>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      <p>{order.deliveryTask?.deliveryPartner?.fullName || "Not assigned"}</p>
                      <p className="text-xs">{order.deliveryTask?.deliveryPartner?.phone || "No phone"}</p>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">Rs. {Math.round(order.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
