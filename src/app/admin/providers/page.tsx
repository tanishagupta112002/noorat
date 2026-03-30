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

export default async function AdminProvidersPage({ searchParams }: PageProps) {
  const db = prisma as any;
  const resolvedSearchParams = (await searchParams) || {};
  const page = parsePage(resolvedSearchParams.page);
  const skip = (page - 1) * PAGE_SIZE;

  const [providers, totalProviders] = await Promise.all([
    db.providerProfile.findMany({
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        businessName: true,
        phone: true,
        alternate_phone: true,
        city: true,
        state: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            listings: true,
            providerOrders: true,
          },
        },
      },
    }),
    db.providerProfile.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalProviders / PAGE_SIZE));
  const nextPage = Math.min(totalPages, page + 1);
  const prevPage = Math.max(1, page - 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Provider Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage provider contacts, listings, and provider side order load.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing {providers.length} of {totalProviders} | Page {page}/{totalPages}
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-225 w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Listings</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider: any) => {
              const providerName =
                provider.businessName || provider.user.name || provider.user.email;

              return (
                <tr key={provider.id} className="border-t">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{providerName}</p>
                    <p className="text-xs text-muted-foreground">ID: {provider.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <p>{provider.user.email}</p>
                    <p className={provider.phone ? "text-xs" : "text-xs text-red-600"}>
                      Provider: {provider.phone || "Phone missing"}
                    </p>
                    <p className="text-xs">Alt: {provider.alternate_phone || "-"}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{provider.city || "-"}, {provider.state || "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{provider._count.listings}</td>
                  <td className="px-4 py-3 text-muted-foreground">{provider._count.providerOrders}</td>
                  <td className="px-4 py-3 text-muted-foreground">{provider.createdAt.toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/providers/${provider.id}`}
                      className="rounded-md border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                    >
                      View details
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Link
          href={`/admin/providers?page=${prevPage}`}
          className={`rounded-md border px-3 py-1.5 text-sm ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
        >
          Previous
        </Link>
        <Link
          href={`/admin/providers?page=${nextPage}`}
          className={`rounded-md border px-3 py-1.5 text-sm ${page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
