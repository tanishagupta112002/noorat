import Link from "next/link";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 40;

function parsePage(value: string | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

type PageProps = {
  searchParams?: Promise<{ page?: string }>;
};

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const db = prisma as any;
  const resolvedSearchParams = (await searchParams) || {};
  const page = parsePage(resolvedSearchParams.page);
  const skip = (page - 1) * PAGE_SIZE;

  const [customers, totalCustomers] = await Promise.all([
    db.user.findMany({
      where: {
        role: "CUSTOMER",
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        createdAt: true,
        _count: {
          select: {
            customerOrders: true,
            addresses: true,
          },
        },
      },
    }),
    db.user.count({ where: { role: "CUSTOMER" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCustomers / PAGE_SIZE));
  const nextPage = Math.min(totalPages, page + 1);
  const prevPage = Math.max(1, page - 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Customer Management</h2>
          <p className="text-sm text-muted-foreground">
            View customer contacts and order activity for delivery operations.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing {customers.length} of {totalCustomers} | Page {page}/{totalPages}
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-225 w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Address Book</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer: any) => (
              <tr key={customer.id} className="border-t">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{customer.name || "Unnamed customer"}</p>
                  <p className="text-xs text-muted-foreground">ID: {customer.id.slice(0, 8)}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-muted-foreground">{customer.email}</p>
                  <p className={`text-xs ${customer.phone ? "text-muted-foreground" : "text-red-600"}`}>
                    {customer.phone || "Phone missing"}
                  </p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {customer.city || "-"}, {customer.state || "-"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{customer._count.customerOrders}</td>
                <td className="px-4 py-3 text-muted-foreground">{customer._count.addresses}</td>
                <td className="px-4 py-3 text-muted-foreground">{customer.createdAt.toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="rounded-md border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                  >
                    View details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Link
          href={`/admin/customers?page=${prevPage}`}
          className={`rounded-md border px-3 py-1.5 text-sm ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
        >
          Previous
        </Link>
        <Link
          href={`/admin/customers?page=${nextPage}`}
          className={`rounded-md border px-3 py-1.5 text-sm ${page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
