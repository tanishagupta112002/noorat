import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function OrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect("/auth?mode=signup&redirect=/orders");
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      quantity: true,
      total: true,
      status: true,
      createdAt: true,
      listing: {
        select: {
          id: true,
          title: true,
          size: true,
          category: true,
          images: true,
        },
      },
      provider: {
        select: {
          businessName: true,
        },
      },
    },
  });

  return (
    <div>
      <div>
        <h1 className="text-xl font-bold text-foreground">My Orders</h1>
        <p className="mt-2 text-muted-foreground">Track and manage all your rental orders</p>
      </div>

      {orders.length === 0 ? (
        <div className="mt-12 rounded-sm border border-[#ececec] bg-white p-12 text-center">
          <p className="mb-4 text-lg text-muted-foreground">You haven't placed any orders yet.</p>
          <Link href="/rentals" className="inline-block rounded-sm bg-primary px-6 py-2 font-medium text-primary-foreground transition hover:opacity-90">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order: (typeof orders)[number]) => {
            const primaryImage = order.listing.images[0] || "/images/image.png";

            return (
              <article key={order.id} className="rounded-sm border border-[#ececec] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                <div className="grid gap-4 sm:grid-cols-[96px_minmax(0,1fr)]">
                  <Link href={`/rentals/item/${order.listing.id}`} className="relative block aspect-[0.75] overflow-hidden rounded-md bg-white">
                    <Image src={primaryImage} alt={order.listing.title} fill className="object-contain p-1" sizes="96px" />
                  </Link>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                        {order.provider.businessName || "noorat Partner"}
                      </p>
                      <span className="rounded-full bg-[#f5f5f5] px-3 py-1 text-xs font-semibold text-foreground">{order.status}</span>
                    </div>

                    <Link href={`/rentals/item/${order.listing.id}`} className="block text-base font-semibold text-foreground transition hover:text-primary">
                      {order.listing.title}
                    </Link>

                    <p className="text-sm text-muted-foreground">
                      Size {order.listing.size} · {order.listing.category} · Qty {order.quantity}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                      <span className="text-sm text-muted-foreground">Placed on {formatDate(order.createdAt)}</span>
                      <span className="text-sm font-semibold text-foreground">Rs. {formatPrice(order.total)}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}